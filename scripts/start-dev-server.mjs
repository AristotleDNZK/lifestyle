import { existsSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import process from "node:process";

function parsePort() {
  const portArgIndex = process.argv.findIndex((arg) => arg === "--port" || arg === "-p");
  const rawPort =
    portArgIndex >= 0 ? process.argv[portArgIndex + 1] : process.env.PORT || "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port: ${rawPort}`);
  }

  return port;
}

function runPowerShell(script) {
  return spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function stopProcessesOnPort(port) {
  if (process.platform !== "win32") {
    return;
  }

  const query = `
$connections = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue
$connections | Select-Object -ExpandProperty OwningProcess -Unique
`;
  const result = runPowerShell(query);
  const pids = result.stdout
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);

  for (const pid of pids) {
    const inspect = runPowerShell(`
$process = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
if ($process) {
  [pscustomobject]@{ Id = $process.Id; ProcessName = $process.ProcessName; Path = $process.Path; CommandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}").CommandLine } | ConvertTo-Json -Compress
}
`);
    const text = inspect.stdout.trim();
    const lower = text.toLowerCase();

    if (!lower.includes("node") && !lower.includes("next")) {
      console.warn(`Port ${port} is in use by PID ${pid}, but it does not look like a Next.js Node process.`);
      continue;
    }

    console.log(`Stopping stale dev server on port ${port} (PID ${pid}).`);
    runPowerShell(`Stop-Process -Id ${pid} -Force`);
  }
}

function cleanNextDevCaches() {
  const cacheDirs = [".next-dev", ".next"];

  for (const dir of cacheDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      continue;
    }

    console.log(`Removing stale Next.js cache: ${dir}`);
    rmSync(fullPath, { recursive: true, force: true });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestPath(port, requestPath) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "localhost",
        port,
        path: requestPath,
        timeout: 30_000,
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode || 0));
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(0);
    });
    req.on("error", () => resolve(0));
  });
}

async function waitForReady(port, child) {
  const requiredPaths = [
    "/",
    "/_next/static/chunks/app/layout.js",
    "/_next/static/chunks/app/page.js",
  ];
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      return;
    }

    const statuses = await Promise.all(
      requiredPaths.map((pathName) => requestPath(port, pathName))
    );

    if (statuses.every((status) => status >= 200 && status < 400)) {
      console.log(`Dev server warmed on http://localhost:${port}`);
      return;
    }

    await delay(1000);
  }

  console.warn(`Dev server started, but key chunks were not ready within 90s.`);
}

const port = parsePort();
stopProcessesOnPort(port);
cleanNextDevCaches();

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "--port", String(port)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

void waitForReady(port, child);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

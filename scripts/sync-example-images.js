/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { move: false, src: null, dest: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--move") {
      args.move = true;
      continue;
    }
    if (a === "--src") {
      args.src = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (a === "--dest") {
      args.dest = argv[i + 1] || null;
      i += 1;
      continue;
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"].includes(ext);
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function main() {
  const { move, src, dest } = parseArgs(process.argv);

  const projectRoot = process.cwd();
  const srcDir = path.resolve(projectRoot, src || "example_image");
  const destDir = path.resolve(projectRoot, dest || path.join("public", "example_image"));
  const manifestPath = path.join(destDir, "examples.json");

  ensureDir(destDir);

  if (!fs.existsSync(srcDir)) {
    console.log(`[sync-example-images] Source folder not found: ${srcDir}`);
    console.log(`[sync-example-images] Created destination: ${destDir}`);
    fs.writeFileSync(manifestPath, JSON.stringify([], null, 2), "utf8");
    console.log(`[sync-example-images] Wrote empty manifest: ${manifestPath}`);
    process.exit(0);
  }

  const files = fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log(`[sync-example-images] No images found in: ${srcDir}`);
    fs.writeFileSync(manifestPath, JSON.stringify([], null, 2), "utf8");
    console.log(`[sync-example-images] Wrote empty manifest: ${manifestPath}`);
    process.exit(0);
  }

  const manifest = [];

  files.forEach((filename, index) => {
    const n = index + 1;
    const srcPath = path.join(srcDir, filename);
    const ext = path.extname(filename).toLowerCase();
    const destName = `example-${pad3(n)}${ext}`;
    const destPath = path.join(destDir, destName);

    if (move) {
      fs.renameSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }

    const base = path.basename(filename, path.extname(filename));
    const promptTxt = safeReadText(path.join(srcDir, `${base}.txt`));
    const prompt =
      promptTxt ||
      "Describe how you want to edit the image. Example: change the background, lighting, style, and add details.";

    manifest.push({
      id: `ex-${n}`,
      imageUrl: `/example_image/${destName}`,
      prompt,
    });
  });

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`[sync-example-images] ${move ? "Moved" : "Copied"} ${files.length} file(s).`);
  console.log(`[sync-example-images] Source: ${srcDir}`);
  console.log(`[sync-example-images] Dest:   ${destDir}`);
  console.log(`[sync-example-images] Manifest written: ${manifestPath}`);
}

main();


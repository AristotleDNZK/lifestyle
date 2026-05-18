import { readFileSync } from "node:fs";
import { ProxyAgent, fetch as undiciFetch } from "undici";

function loadLocalEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) {
        continue;
      }
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // The caller may provide env vars directly.
  }
}

function redactProxy(proxyUrl) {
  try {
    const url = new URL(proxyUrl);
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//${url.hostname}${port}`;
  } catch {
    return "invalid-proxy-url";
  }
}

function getExplicitGeminiProxyUrl() {
  if (process.env.GEMINI_PROXY_URL) {
    return process.env.GEMINI_PROXY_URL;
  }

  if (process.env.GEMINI_USE_SYSTEM_PROXY !== "1") {
    return "";
  }

  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || "";
}

function getAutoLocalProxyUrls() {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  const raw = process.env.GEMINI_AUTO_PROXY_URLS || "";

  if (!raw && process.env.GEMINI_AUTO_PROXY !== "1") {
    return [];
  }

  const proxyUrls =
    raw ||
    "http://127.0.0.1:7890,http://127.0.0.1:7891,http://127.0.0.1:10809,http://127.0.0.1:1080";

  return proxyUrls
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveGeminiRelayEndpoint() {
  const raw = String(process.env.GEMINI_RELAY_URL || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/api/gemini/relay";
    }
    return url.toString();
  } catch {
    return "";
  }
}

async function request(label, url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error(`${label} timed out`));
  }, 60_000);

  const started = Date.now();
  try {
    const response = await undiciFetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      label,
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - started,
      bodyLength: text.length,
      body: text,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      cause:
        error && typeof error === "object" && "cause" in error
          ? error.cause?.message || error.cause?.code || null
          : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  loadLocalEnv();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const generateUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent" +
    `?key=${encodeURIComponent(apiKey)}`;
  const proxyUrl =
    process.env.GEMINI_DISABLE_PROXY === "1" ? "" : getExplicitGeminiProxyUrl();

  const candidates = [
    {
      label: "direct",
      dispatcher: undefined,
      proxy: null,
    },
  ];

  if (proxyUrl && process.env.GEMINI_DISABLE_PROXY !== "1") {
    candidates.unshift({
      label: "proxy",
      dispatcher: new ProxyAgent(proxyUrl),
      proxy: redactProxy(proxyUrl),
    });
  }

  if (process.env.GEMINI_DISABLE_PROXY !== "1") {
    for (const autoProxyUrl of getAutoLocalProxyUrls().reverse()) {
      candidates.unshift({
        label: "auto-proxy",
        dispatcher: new ProxyAgent(autoProxyUrl),
        proxy: redactProxy(autoProxyUrl),
      });
    }
  }

  for (const candidate of candidates) {
    const dispatcher = candidate.dispatcher
      ? { dispatcher: candidate.dispatcher }
      : {};
    const modelProbe = await request(`${candidate.label}:models`, modelsUrl, {
      ...dispatcher,
      method: "GET",
    });

    console.log(
      JSON.stringify({
        label: modelProbe.label,
        proxy: candidate.proxy,
        ok: modelProbe.ok,
        status: modelProbe.status,
        durationMs: modelProbe.durationMs,
        error: modelProbe.error,
        cause: modelProbe.cause,
      })
    );

    const generationProbe = await request(
      `${candidate.label}:generate`,
      generateUrl,
      {
        ...dispatcher,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Generate one simple small realistic portrait-style test image, neutral background.",
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    let parts = [];
    try {
      const json = JSON.parse(generationProbe.body || "{}");
      parts = json?.candidates?.[0]?.content?.parts || [];
    } catch {
      parts = [];
    }

    console.log(
      JSON.stringify({
        label: generationProbe.label,
        proxy: candidate.proxy,
        ok: generationProbe.ok,
        status: generationProbe.status,
        durationMs: generationProbe.durationMs,
        error: generationProbe.error,
        cause: generationProbe.cause,
        parts: parts.map((part) => {
          const inline = part.inlineData || part.inline_data;
          return {
            hasText: Boolean(part.text),
            hasInlineData: Boolean(inline?.data),
            mimeType: inline?.mimeType || null,
            dataLength: inline?.data ? String(inline.data).length : 0,
          };
        }),
      })
    );
  }

  const relayEndpoint = resolveGeminiRelayEndpoint();
  if (relayEndpoint) {
    const relayCandidates = [];

    if (proxyUrl && process.env.GEMINI_DISABLE_PROXY !== "1") {
      relayCandidates.push({
        label: "relay-proxy",
        dispatcher: new ProxyAgent(proxyUrl),
        proxy: redactProxy(proxyUrl),
      });
    }

    relayCandidates.push({
      label: "relay-direct",
      dispatcher: undefined,
      proxy: null,
    });

    for (const relayCandidate of relayCandidates) {
      const dispatcher = relayCandidate.dispatcher
        ? { dispatcher: relayCandidate.dispatcher }
        : {};
      const relayProbe = await request(`${relayCandidate.label}:generate`, relayEndpoint, {
        ...dispatcher,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-relay-secret": String(process.env.GEMINI_RELAY_SECRET || ""),
        },
        body: JSON.stringify({
          jobId: "network-check",
          prompt:
            "Generate one simple small realistic portrait-style test image, neutral background.",
          modelId: "gemini-3.1-flash-image-preview",
          userId: "network-check",
          cost: 0,
        }),
      });

      let hasImage = false;
      let mimeType = null;
      try {
        const json = JSON.parse(relayProbe.body || "{}");
        hasImage = Boolean(json?.imageBase64);
        mimeType = json?.mimeType || null;
      } catch {
        hasImage = false;
      }

      console.log(
        JSON.stringify({
          label: relayProbe.label,
          proxy: relayCandidate.proxy,
          ok: relayProbe.ok,
          status: relayProbe.status,
          durationMs: relayProbe.durationMs,
          error: relayProbe.error,
          cause: relayProbe.cause,
          hasImage,
          mimeType,
        })
      );
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

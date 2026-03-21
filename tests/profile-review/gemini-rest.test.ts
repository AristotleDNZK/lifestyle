import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGeminiFetchOptions,
  extractGeminiText,
  generateGeminiStructuredJson,
} from "../../lib/profile-review/gemini-rest";

test("buildGeminiFetchOptions injects a dispatcher when proxy env is present", () => {
  const options = buildGeminiFetchOptions({
    HTTPS_PROXY: "http://127.0.0.1:7890",
  });

  assert.ok(options.dispatcher);
});

test("buildGeminiFetchOptions omits dispatcher when no proxy env is present", () => {
  const options = buildGeminiFetchOptions({});

  assert.equal(options.dispatcher, undefined);
});

test("extractGeminiText returns the first text part from a Gemini response", () => {
  const text = extractGeminiText({
    candidates: [
      {
        content: {
          parts: [{ text: "{\"ok\":true}" }],
        },
      },
    ],
  });

  assert.equal(text, "{\"ok\":true}");
});

test("generateGeminiStructuredJson forwards dispatcher to the fetch layer", async () => {
  let capturedInit: Record<string, unknown> | undefined;

  const result = await generateGeminiStructuredJson({
    apiKey: "test-key",
    modelName: "gemini-2.5-flash-lite",
    prompt: "Return JSON only.",
    inlineImages: [],
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
      },
      required: ["ok"],
    },
    timeoutMs: 1000,
    env: {
      HTTPS_PROXY: "http://127.0.0.1:7890",
    },
    fetchImpl: async (_url, init) => {
      capturedInit = init as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "{\"ok\":true}" }],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    },
  });

  assert.equal(result, "{\"ok\":true}");
  assert.ok(capturedInit?.dispatcher);
});

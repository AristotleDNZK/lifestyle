import { createHmac, timingSafeEqual } from "crypto";

export type PaddleEnvironment = "sandbox" | "production";

export function getPaddleApiBaseUrl(environment = process.env.PADDLE_ENVIRONMENT) {
  return environment === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export function getPaddleCheckoutEnvironment(
  environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || process.env.PADDLE_ENVIRONMENT
) {
  return environment === "production" ? "production" : "sandbox";
}

export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
) {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = parts.ts;
  const signature = parts.h1;

  if (!timestamp || !signature) {
    return false;
  }

  const signedPayload = `${timestamp}:${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const actualBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

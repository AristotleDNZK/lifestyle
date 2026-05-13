"use client";

import Script from "next/script";

export function PaddleScript() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";

  if (!token) {
    return null;
  }

  return (
    <Script
      id="paddle-js"
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.Paddle?.Environment.set(environment);
        window.Paddle?.Initialize({ token });
      }}
    />
  );
}

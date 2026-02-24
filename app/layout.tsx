import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Video & Image Generator",
  description: "Generate images and videos with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

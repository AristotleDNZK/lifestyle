import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GlobalLanguageSwitcher } from "./_components/global-language-switcher";
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
          {children}
          <GlobalLanguageSwitcher />
        </ClerkProvider>
      </body>
    </html>
  );
}

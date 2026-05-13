import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GlobalLanguageSwitcher } from "./_components/global-language-switcher";
import { PaddleScript } from "./_components/paddle-script";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DatingPhotosAI",
  description: "Generate and optimize dating profile photos with AI",
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
          <PaddleScript />
        </ClerkProvider>
      </body>
    </html>
  );
}

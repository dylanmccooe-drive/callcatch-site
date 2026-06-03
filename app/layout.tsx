import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-fraunces",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CallCatch — AI catches the calls you miss",
  description:
    "CallCatch texts missed callers back, captures the lead, and sends it straight to your phone.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}

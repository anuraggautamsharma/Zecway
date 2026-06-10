import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display-serif",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zecway.com"),
  title: "Zecway — The AI assistant that actually knows your company",
  description:
    "Ask anything — Zecway connects every tool your company uses and turns scattered knowledge into instant, cited answers. Built on permissions-aware search across everything.",
  openGraph: {
    title: "Zecway — The AI assistant that actually knows your company",
    description:
      "Ask anything — your company already knows the answer. Instant, cited answers from every tool you use.",
    url: "https://www.zecway.com",
    siteName: "Zecway",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable} ${mono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

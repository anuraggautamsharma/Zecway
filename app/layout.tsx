import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}

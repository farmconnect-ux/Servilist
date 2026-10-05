import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Servilist · Pan-African Marketplace", template: "%s · Servilist" },
  description:
    "Buy what you need. Sell what you have. Request what you cannot find. Pan-African marketplace for products, services, requests, auctions, and escrow.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans bg-[#fafaf9] text-[#18181b]">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FetchSave — TikTok & Pinterest Downloader",
  description: "Download public TikTok liked videos and Pinterest pins at original quality. No login required. Clean, watermark-free.",
  icons: { icon: "/favicon.ico" }
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#fcfcfd] text-zinc-900 antialiased" style={{fontFamily:'Inter, system-ui, sans-serif'}}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

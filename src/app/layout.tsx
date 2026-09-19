import { ToastProvider } from "@/components/Feedback";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const prompt = localFont({
  src: [
    { path: "./fonts/prompt/Prompt-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/prompt/Prompt-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/prompt/Prompt-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/prompt/Prompt-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/prompt/Prompt-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
  preload: false,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

// Marketplace/auth data is request-specific; builds must not query a live database.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Community Enterprise Market",
  description: "ตลาดวิสาหกิจชุมชน อำเภอนิคมพัฒนา จังหวัดระยอง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          ข้ามไปยังเนื้อหา
        </a>
        <Navbar />

        <div id="main-content" tabIndex={-1}>
          {children}
        </div>

        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}

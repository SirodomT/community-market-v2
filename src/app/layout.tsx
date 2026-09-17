import { ToastProvider } from "@/components/Feedback";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <html lang="th">
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

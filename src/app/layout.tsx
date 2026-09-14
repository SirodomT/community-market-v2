import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
export const metadata: Metadata = {
  title: "Community Enterprise Market",
  description:
    "ตลาดวิสาหกิจชุมชน อำเภอนิคมพัฒนา จังหวัดระยอง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
     <body>
  <Navbar />
  {children}
</body>
    </html>
  );
}
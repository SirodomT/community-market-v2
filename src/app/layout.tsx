import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
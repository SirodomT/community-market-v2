import Link from "next/link";
import { Store, MapPin, ArrowUpRight } from "lucide-react";
export default function Footer() {
  return (
    <footer className="market-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-primary"
          >
            <Store aria-hidden="true" className="size-5" />
            Community Market
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            พื้นที่เล็ก ๆ ที่เชื่อมสินค้าของชุมชน
            <br />
            กับคนที่เห็นคุณค่าในสิ่งที่ทำด้วยใจ
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4" />
            อำเภอนิคมพัฒนา จังหวัดระยอง
          </p>
        </div>
        <nav aria-label="เลือกซื้อสินค้า">
          <h2 className="mb-3 text-sm font-bold">ค้นพบชุมชน</h2>
          <Link
            href="/products"
            className="flex min-h-11 items-center text-sm text-muted-foreground"
          >
            สินค้าทั้งหมด
          </Link>
          <Link
            href="/shops"
            className="flex min-h-11 items-center text-sm text-muted-foreground"
          >
            ร้านค้าชุมชน
          </Link>
        </nav>
        <nav aria-label="บัญชีและร้านค้า">
          <h2 className="mb-3 text-sm font-bold">เป็นส่วนหนึ่งกับเรา</h2>
          <Link
            href="/account"
            className="flex min-h-11 items-center text-sm text-muted-foreground"
          >
            บัญชีของฉัน
          </Link>
          <Link
            href="/seller/apply"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            เปิดร้านกับเรา
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © 2026 Community Enterprise Market · ตลาดวิสาหกิจชุมชน
      </div>
    </footer>
  );
}

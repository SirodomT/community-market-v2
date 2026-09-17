import Link from "next/link";
import { ShoppingBag, MapPin, CircleCheck, ChevronRight } from "lucide-react";
export default function CommerceSteps({ step }: { step: "cart" | "checkout" }) {
  return (
    <nav aria-label="ขั้นตอนการสั่งซื้อ" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm">
        <li>
          <Link
            href="/cart"
            aria-current={step === "cart" ? "step" : undefined}
            className={`flex min-h-11 items-center gap-2 ${step === "cart" ? "font-bold text-primary" : "text-muted-foreground"}`}
          >
            <ShoppingBag aria-hidden="true" className="size-4" />
            ตะกร้าสินค้า
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-4 text-muted-foreground" />
        </li>
        <li
          aria-current={step === "checkout" ? "step" : undefined}
          className={`flex min-h-11 items-center gap-2 ${step === "checkout" ? "font-bold text-primary" : "text-muted-foreground"}`}
        >
          <MapPin aria-hidden="true" className="size-4" />
          ข้อมูลจัดส่ง
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-4 text-muted-foreground" />
        </li>
        <li className="flex min-h-11 items-center gap-2 text-muted-foreground">
          <CircleCheck aria-hidden="true" className="size-4" />
          ยืนยันคำสั่งซื้อ
        </li>
      </ol>
    </nav>
  );
}

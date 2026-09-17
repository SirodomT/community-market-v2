"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Users,
  ClipboardList,
  Plus,
} from "lucide-react";
export default function DashboardNav({ mode }: { mode: "admin" | "seller" }) {
  const pathname = usePathname();
  const links =
    mode === "admin"
      ? [
          { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
          { href: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
          { href: "/admin/shops", label: "ร้านค้า", icon: Store },
          { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
          {
            href: "/admin/shop-requests",
            label: "คำขอเปิดร้าน",
            icon: ClipboardList,
          },
        ]
      : [
          { href: "/seller", label: "ภาพรวมร้าน", icon: LayoutDashboard },
          { href: "/seller/products", label: "สินค้าของร้าน", icon: Package },
          { href: "/seller/orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
          { href: "/seller/products/new", label: "เพิ่มสินค้า", icon: Plus },
        ];
  return (
    <nav
      aria-label={mode === "admin" ? "จัดการระบบ" : "จัดการร้านค้า"}
      className={`flex max-w-full gap-1 overflow-x-auto p-1 ${mode === "admin" ? "lg:flex-col" : "mb-7 rounded-2xl border border-border bg-surface"}`}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== `/${mode}` &&
            !pathname.endsWith("/new") &&
            pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

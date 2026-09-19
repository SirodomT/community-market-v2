"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Store,
  ShoppingBag,
  UserRound,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { logoutUser } from "@/app/account/actions";
import Sheet from "@/components/ui/sheet";
import { Button } from "@/components/ui/primitives";

type Props = {
  username?: string;
  role?: "USER" | "SELLER" | "ADMIN";
  cartCount: number;
};
export default function MarketplaceNav({ username, role, cartCount }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "หน้าแรก" },
    { href: "/products", label: "เลือกซื้อสินค้า" },
    { href: "/shops", label: "ร้านค้าชุมชน" },
    ...(username ? [{ href: "/orders", label: "คำสั่งซื้อ" }] : []),
    ...(role === "USER"
      ? [{ href: "/seller/apply", label: "เปิดร้านกับเรา" }]
      : []),
    ...(role === "SELLER" ? [{ href: "/seller", label: "จัดการร้าน" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "จัดการระบบ" }] : []),
  ];
  function navLinks(mobile = false) {
    return links.map(({ href, label }) => {
      const active =
        href === "/"
          ? pathname === "/"
          : pathname === href || pathname.startsWith(href + "/");
      return (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined}
          className={`${mobile ? "px-4 py-3" : "px-3 py-2.5"} rounded-xl text-sm font-semibold transition-colors ${active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          {label}
        </Link>
      );
    });
  }
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex min-h-8 items-center justify-center bg-primary px-4 py-1.5 text-center text-[10px] tracking-wide text-white">
        ของดีจากนิคมพัฒนา · ส่งต่อความตั้งใจจากชุมชนระยอง
      </div>
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Community Market หน้าแรก"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Store aria-hidden="true" className="size-5" />
          </span>
          <span className="text-sm font-bold leading-tight tracking-tight sm:text-lg">
            Community
            <span className="block text-[10px] font-medium tracking-[.18em] text-primary sm:text-[11px]">
              MARKET / RAYONG
            </span>
          </span>
        </Link>
        <nav
          aria-label="เมนูหลัก"
          className="hidden items-center gap-0.5 xl:flex"
        >
          {navLinks()}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {username && (
            <Link
              href="/cart"
              className="relative flex size-11 items-center justify-center rounded-xl hover:bg-muted"
              aria-label={`ตะกร้า ${cartCount} ชิ้น`}
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}
          <div className="hidden items-center gap-2 xl:flex">
            {username ? (
              <>
                <Link
                  href="/account"
                  className="btn btn-secondary max-w-32"
                  title={username}
                >
                  <UserRound aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{username}</span>
                </Link>
                <form action={logoutUser}>
                  <Button
                    type="submit"
                    variant="ghost"
                    aria-label="ออกจากระบบ"
                    title="ออกจากระบบ"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="btn btn-primary">
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
          <div className="xl:hidden">
            <Sheet
              title="Community Market"
              description="สินค้าและเรื่องราวจากชุมชน"
              open={open}
              onOpenChange={setOpen}
              trigger={
                <Button
                  variant="secondary"
                  className="px-3"
                  aria-label="เปิดเมนู"
                >
                  <Menu aria-hidden="true" className="size-5" />
                </Button>
              }
            >
              <nav
                aria-label="เมนูหลักบนมือถือ"
                className="flex flex-col gap-1"
              >
                {navLinks(true)}
                <div className="my-4 border-t border-border" />
                {username ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="btn btn-secondary justify-start"
                    >
                      <UserRound aria-hidden="true" className="size-4" />
                      <span className="min-w-0 break-all">{username}</span>
                    </Link>
                    <form action={logoutUser}>
                      <Button
                        variant="ghost"
                        type="submit"
                        className="mt-3 w-full justify-start text-rose-800"
                      >
                        <LogOut aria-hidden="true" className="size-4" />
                        ออกจากระบบ
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="btn btn-secondary"
                    >
                      เข้าสู่ระบบ
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="btn btn-primary mt-2"
                    >
                      สมัครสมาชิก
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </>
                )}
              </nav>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

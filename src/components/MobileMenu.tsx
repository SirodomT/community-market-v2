"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/app/account/actions";

export default function MobileMenu({ username, role, cartCount = 0 }: { username?: string; role?: "USER" | "SELLER" | "ADMIN"; cartCount?: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    }
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  const links = [
    { href: "/", label: "หน้าแรก" }, { href: "/products", label: "สินค้า" }, { href: "/shops", label: "ร้านค้า" },
    ...(username ? [{ href: "/cart", label: `ตะกร้า${cartCount > 0 ? ` (${cartCount})` : ""}` }, { href: "/orders", label: "คำสั่งซื้อของฉัน" }] : []),
    ...(role === "USER" ? [{ href: "/seller/apply", label: "สมัครเปิดร้าน" }] : []),
    ...(role === "SELLER" ? [{ href: "/seller", label: "จัดการร้าน" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "ผู้ดูแลระบบ" }] : []),
  ];
  return <div ref={root} className="xl:hidden" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-emerald-900" aria-label={open ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={open} aria-controls={id}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} /></svg>
    </button>
    {open && <nav id={id} aria-label="เมนูหลักบนมือถือ" className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-stone-200 bg-white p-4 shadow-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-1">
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`rounded-xl px-4 py-3 font-medium ${active ? "bg-emerald-50 text-emerald-900" : "hover:bg-stone-50"}`}>{label}</Link>;
        })}
        <div className="my-2 border-t border-stone-200" />
        {username ? <>
          <Link href="/account" onClick={() => setOpen(false)} className="break-words rounded-xl bg-stone-100 px-4 py-3 font-semibold">{username}</Link>
          <form action={logoutUser}><button type="submit" className="mt-2 w-full rounded-xl px-4 py-3 text-left font-medium text-red-700 hover:bg-red-50">ออกจากระบบ</button></form>
        </> : <div className="grid grid-cols-2 gap-3">
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-stone-300 px-3 py-3 text-center font-medium">เข้าสู่ระบบ</Link>
          <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl bg-emerald-900 px-3 py-3 text-center font-medium text-white">สมัครสมาชิก</Link>
        </div>}
      </div>
    </nav>}
  </div>;
}

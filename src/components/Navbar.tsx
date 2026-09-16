import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        {/* LOGO */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          Community Market
        </Link>

        {/* NAVIGATION */}
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            หน้าแรก
          </Link>

          <Link
            href="/products"
            className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            สินค้า
          </Link>

          <Link
            href="/shops"
            className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            ร้านค้า
          </Link>

          {/* USER */}
          {user?.role === "USER" && (
            <Link
              href="/seller/apply"
              className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              สมัครเปิดร้าน
            </Link>
          )}

          {/* SELLER */}
          {user?.role === "SELLER" && (
            <Link
              href="/seller"
              className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              จัดการร้าน
            </Link>
          )}

          {/* ADMIN */}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              ผู้ดูแลระบบ
            </Link>
          )}

          {/* ACCOUNT */}
          {user ? (
            <Link
              href="/account"
              className="ml-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {user.username}
            </Link>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
              >
                เข้าสู่ระบบ
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
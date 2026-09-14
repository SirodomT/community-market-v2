import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold"
        >
          Community Market
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="hover:text-gray-500"
          >
            หน้าแรก
          </Link>

          <Link
            href="/products"
            className="hover:text-gray-500"
          >
            สินค้า
          </Link>

          <Link
            href="/shops"
            className="hover:text-gray-500"
          >
            ร้านค้า
          </Link>

          {user?.role === "SELLER" && (
            <Link
              href="/seller"
              className="hover:text-gray-500"
            >
              จัดการร้าน
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link
                href="/seller"
                className="hover:text-gray-500"
              >
                Seller
              </Link>

              <Link
                href="/admin"
                className="hover:text-gray-500"
              >
                Admin
              </Link>
            </>
          )}

          {user ? (
            <Link
              href="/account"
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              {user.username}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-gray-500"
              >
                เข้าสู่ระบบ
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
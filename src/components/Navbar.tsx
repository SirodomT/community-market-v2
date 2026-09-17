import Link from "next/link";
import {
  eq,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  cartItems,
} from "@/db/schema";
import {
  getCurrentUser,
} from "@/lib/session";
import {
  logoutUser,
} from "@/app/account/actions";

import MobileMenu from "@/components/MobileMenu";

export default async function Navbar() {
  const user =
    await getCurrentUser();

  let cartCount = 0;

  if (user) {
    const [result] = await db
      .select({
        total: sql<number>`
          COALESCE(
            SUM(${cartItems.quantity}),
            0
          )
        `,
      })
      .from(cartItems)
      .where(
        eq(
          cartItems.userId,
          user.id
        )
      );

    cartCount = Number(
      result?.total ?? 0
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">
        {/* LOGO */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-black"
        >
          Community Market
        </Link>

        {/* DESKTOP */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
          >
            หน้าแรก
          </Link>

          <Link
            href="/products"
            className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
          >
            สินค้า
          </Link>

          <Link
            href="/shops"
            className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
          >
            ร้านค้า
          </Link>

          {user && (
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              <span>ตะกร้า</span>

              {cartCount > 0 && (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user?.role === "USER" && (
            <Link
              href="/seller/apply"
              className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              สมัครเปิดร้าน
            </Link>
          )}

          {user?.role ===
            "SELLER" && (
            <Link
              href="/seller"
              className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              จัดการร้าน
            </Link>
          )}

          {user?.role ===
            "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              ผู้ดูแลระบบ
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/orders"
                className="rounded-lg px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                คำสั่งซื้อของฉัน
              </Link>

              <Link
                href="/account"
                className="ml-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {user.username}
              </Link>

              <form
                action={logoutUser}
              >
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
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

        {/* MOBILE */}
        {user ? (
          <MobileMenu
            username={
              user.username
            }
            role={user.role}
            cartCount={
              cartCount
            }
          />
        ) : (
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium"
            >
              เข้าสู่ระบบ
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
            >
              สมัคร
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
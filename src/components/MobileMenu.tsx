"use client";

import Link from "next/link";
import { useState } from "react";

import { logoutUser } from "@/app/account/actions";

type UserRole =
  | "USER"
  | "SELLER"
  | "ADMIN";

export default function MobileMenu({
  username,
  role,
  cartCount,
}: {
  username: string;
  role: UserRole;
  cartCount: number;
}) {
  const [open, setOpen] =
    useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      {/* HAMBURGER */}
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-100"
        aria-label="เปิดเมนู"
        aria-expanded={open}
      >
        {open ? (
          // X ICON
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        ) : (
          // HAMBURGER ICON
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        )}
      </button>

      {/* MENU */}
      {open && (
        <div className="absolute left-0 top-full w-full border-t border-gray-200 bg-white shadow-lg">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-5">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
            >
              หน้าแรก
            </Link>

            <Link
              href="/products"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
            >
              สินค้า
            </Link>

            <Link
              href="/shops"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
            >
              ร้านค้า
            </Link>

            <Link
              href="/cart"
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
            >
              <span>ตะกร้า</span>

              {cartCount > 0 && (
                <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-black px-2 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/orders"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
            >
              คำสั่งซื้อของฉัน
            </Link>

            {/* USER */}
            {role === "USER" && (
              <Link
                href="/seller/apply"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
              >
                สมัครเปิดร้าน
              </Link>
            )}

            {/* SELLER */}
            {role === "SELLER" && (
              <Link
                href="/seller"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
              >
                จัดการร้าน
              </Link>
            )}

            {/* ADMIN */}
            {role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-medium transition hover:bg-gray-100"
              >
                ผู้ดูแลระบบ
              </Link>
            )}

            <div className="my-3 border-t border-gray-200" />

            {/* ACCOUNT */}
            <Link
              href="/account"
              onClick={closeMenu}
              className="rounded-xl bg-gray-100 px-4 py-3 font-semibold"
            >
              {username}
            </Link>

            {/* LOGOUT */}
            <form
              action={logoutUser}
              className="mt-3"
            >
              <button
                type="submit"
                className="w-full rounded-xl border border-red-200 px-4 py-3 text-left font-semibold text-red-600 transition hover:bg-red-50"
              >
                ออกจากระบบ
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
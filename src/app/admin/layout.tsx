import Link from "next/link";
import { logoutUser } from "@/app/account/actions";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireRole([
    "ADMIN",
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ADMIN HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-xl font-bold"
            >
              Admin Panel
            </Link>

            <p className="mt-1 text-xs text-gray-500">
              เข้าสู่ระบบเป็น{" "}
              <span className="font-medium text-black">
                {admin.username}
              </span>
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/users"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Users
            </Link>

            <Link
              href="/admin/shops"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Shops
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Orders
            </Link>

            <Link
              href="/admin/shop-requests"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Shop Requests
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              หน้าหลัก
            </Link>
            <form action={logoutUser}>
  <button
    type="submit"
    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
  >
    Logout
  </button>
</form>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
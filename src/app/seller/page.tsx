import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function SellerPage() {
  const user = await requireRole(["SELLER"]);

  const result = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (result.length === 0) {
    redirect("/seller/apply");
  }

  const shop = result[0];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Seller Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {shop.name}
            </h1>

            <p className="mt-2 text-gray-500">
              จัดการร้านค้าและสินค้าของคุณ
            </p>
          </div>

          <Link
            href="/seller/products/new"
 className="rounded-lg bg-black px-5 py-3 text-center font-medium text-white hover:bg-gray-800"          >
            + เพิ่มสินค้า
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              สถานะร้าน
            </p>

            <p className="mt-2 text-xl font-bold">
              {shop.status}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              เบอร์โทรศัพท์
            </p>

            <p className="mt-2 text-xl font-bold">
              {shop.phone}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              เจ้าของร้าน
            </p>

            <p className="mt-2 text-xl font-bold">
              {user.username}
            </p>
          </div>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            เกี่ยวกับร้าน
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            {shop.description}
          </p>

          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-500">
              ที่อยู่
            </p>

            <p className="mt-2">
              {shop.address}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              สินค้าของฉัน
            </h2>

            <Link
              href="/seller/products"
              className="text-sm font-medium underline"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              ยังไม่มีสินค้า
            </p>

            <Link
              href="/seller/products/new"
              className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-white"
            >
              เพิ่มสินค้าแรก
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
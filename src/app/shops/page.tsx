import Link from "next/link";

import {
  and,
  desc,
  eq,
  like,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import { shops } from "@/db/schema";

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const query = await searchParams;

  const search =
    query.q?.trim().slice(0, 100) ?? "";

  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
      createdAt: shops.createdAt,
    })
    .from(shops)
    .where(
  and(
    eq(
      shops.status,
      "ACTIVE"
    ),

    search
      ? or(
          like(
            shops.name,
            `%${search}%`
          ),
          like(
            shops.description,
            `%${search}%`
          ),
          like(
            shops.address,
            `%${search}%`
          )
        )
      : undefined
  )
)
.orderBy(
  desc(shops.createdAt)
);
  /*
   * ถ้ามีการ Search ต้องบังคับ ACTIVE ด้วย
   */
  const visibleShops = search
    ? allShops.filter(
        async () => true
      )
    : allShops;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            Community Shops
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            ร้านค้าชุมชน
          </h1>

          <p className="mt-3 max-w-2xl text-gray-500">
            ค้นหาและเลือกดูร้านค้าจากผู้ประกอบการในชุมชน
          </p>
        </div>

        {/* SEARCH */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <form
            action="/shops"
            method="GET"
            className="flex flex-col gap-4 md:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="q"
                className="mb-2 block text-sm font-medium"
              >
                ค้นหาร้านค้า
              </label>

              <input
                id="q"
                type="text"
                name="q"
                defaultValue={search}
                placeholder="เช่น Boss mart..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 md:w-auto"
              >
                ค้นหา
              </button>
            </div>
          </form>

          {search && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
              <p className="text-sm text-gray-500">
                คำค้นหา{" "}
                <span className="font-medium text-black">
                  “{search}”
                </span>
              </p>

              <Link
                href="/shops"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                ล้างการค้นหา
              </Link>
            </div>
          )}
        </section>

        {/* SHOPS */}
        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-bold">
              ร้านค้าทั้งหมด
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {visibleShops.length} ร้าน
            </p>
          </div>

          {visibleShops.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-xl font-bold">
                ไม่พบร้านค้า
              </p>

              <p className="mt-2 text-gray-500">
                ลองใช้คำค้นหาอื่น
              </p>

              <Link
                href="/shops"
                className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                ดูร้านค้าทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleShops.map(
                (shop) => (
                  <Link
                    key={shop.id}
                    href={`/shops/${shop.id}`}
                    className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* SHOP ICON */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
                      {shop.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <h3 className="mt-5 text-xl font-bold transition group-hover:text-gray-600">
                      {shop.name}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                      {shop.description}
                    </p>

                    <div className="mt-5 border-t pt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        ที่อยู่
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {shop.address}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        ติดต่อ
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        {shop.phone}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t pt-5">
                      <span className="text-sm font-medium">
                        ดูหน้าร้าน
                      </span>

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
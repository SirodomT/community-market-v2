import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { shops } from "@/db/schema";

export default async function ShopsPage() {
  const shopList = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
      status: shops.status,
    })
    .from(shops)
    .where(eq(shops.status, "ACTIVE"))
    .orderBy(asc(shops.name));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-4xl font-bold">
            ร้านค้าวิสาหกิจชุมชน
          </h1>

          <p className="mt-3 text-gray-500">
            ร้านค้าจากวิสาหกิจชุมชน
            อำเภอนิคมพัฒนา จังหวัดระยอง
          </p>
        </div>

        {shopList.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">
              ยังไม่มีร้านค้า
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shopList.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.id}`}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-bold">
                  {shop.name.charAt(0).toUpperCase()}
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  {shop.name}
                </h2>

                <p className="mt-3 line-clamp-3 leading-7 text-gray-500">
                  {shop.description}
                </p>

                <div className="mt-6 border-t pt-5">
                  <p className="text-sm text-gray-500">
                    เบอร์โทรศัพท์
                  </p>

                  <p className="mt-1 font-medium">
                    {shop.phone}
                  </p>

                  <p className="mt-4 text-sm text-gray-500">
                    ที่อยู่
                  </p>

                  <p className="mt-1 line-clamp-2 text-sm leading-6">
                    {shop.address}
                  </p>
                </div>

                <p className="mt-6 text-sm font-medium">
                  ดูร้านค้า →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
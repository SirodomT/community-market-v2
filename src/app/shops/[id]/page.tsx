import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const shopId = Number(id);

  if (!Number.isInteger(shopId) || shopId <= 0) {
    notFound();
  }

  const shopResult = await db
    .select()
    .from(shops)
    .where(
      and(
        eq(shops.id, shopId),
        eq(shops.status, "ACTIVE")
      )
    )
    .limit(1);

  if (shopResult.length === 0) {
    notFound();
  }

  const shop = shopResult[0];

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(
      categories,
      eq(products.categoryId, categories.id)
    )
    .where(
      and(
        eq(products.shopId, shop.id),
        eq(products.status, "ACTIVE")
      )
    )
    .orderBy(desc(products.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shops"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← กลับไปหน้าร้านค้า
        </Link>

        <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-500">
            Community Enterprise Shop
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {shop.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-gray-600">
            {shop.description}
          </p>

          <div className="mt-8 grid gap-6 border-t pt-8 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                เบอร์โทรศัพท์
              </p>

              <p className="mt-2 font-medium">
                {shop.phone}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                ที่อยู่
              </p>

              <p className="mt-2 leading-6">
                {shop.address}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold">
            สินค้าของร้าน
          </h2>

          {productList.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center">
              <p className="text-gray-500">
                ร้านนี้ยังไม่มีสินค้า
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productList.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">
                        ยังไม่มีรูปสินค้า
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-gray-500">
                      {product.categoryName ??
                        "ไม่ระบุหมวดหมู่"}
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-4 text-xl font-bold">
                      ฿
                      {Number(product.price).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      เหลือ {product.stock} ชิ้น
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
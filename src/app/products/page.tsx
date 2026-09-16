import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";

export default async function ProductsPage() {
  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      shopName: shops.name,
    })
    .from(products)
    .innerJoin(
      shops,
      eq(products.shopId, shops.id)
    )
    .leftJoin(
      categories,
      eq(products.categoryId, categories.id)
    )
    .where(
      and(
        eq(products.status, "ACTIVE"),
        eq(shops.status, "ACTIVE")
      )
    )
    .orderBy(desc(products.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">
          สินค้าทั้งหมด
        </h1>

        <p className="mt-3 text-gray-500">
          สินค้าจากวิสาหกิจชุมชน อำเภอนิคมพัฒนา จังหวัดระยอง
        </p>

        {productList.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-12 text-center">
            <p className="text-gray-500">
              ยังไม่มีสินค้า
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    {product.categoryName ?? "ไม่ระบุหมวดหมู่"}
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {product.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                    {product.description}
                  </p>

                  <p className="mt-4 text-sm text-gray-500">
                    ร้าน {product.shopName}
                  </p>

                  <div className="mt-5 flex items-end justify-between">
                    <p className="text-xl font-bold">
                      ฿
                      {Number(product.price).toLocaleString(
                        "th-TH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>

                    <p className="text-xs text-gray-500">
                      เหลือ {product.stock}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
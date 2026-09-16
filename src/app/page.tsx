import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";

export default async function HomePage() {
  const latestProducts = await db
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
    .orderBy(desc(products.createdAt))
    .limit(4);

  const activeShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
    })
    .from(shops)
    .where(eq(shops.status, "ACTIVE"))
    .orderBy(desc(shops.createdAt))
    .limit(3);

  return (
    <main>
      {/* HERO */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Community Enterprise Market
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-6xl">
              ตลาดวิสาหกิจชุมชน
              <br />
              อำเภอนิคมพัฒนา
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              เลือกซื้อสินค้าและสนับสนุนผู้ประกอบการ
              วิสาหกิจชุมชนในอำเภอนิคมพัฒนา จังหวัดระยอง
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                เลือกซื้อสินค้า
              </Link>

              <Link
                href="/shops"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium hover:bg-gray-100"
              >
                ดูร้านค้า
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                Products
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                สินค้าล่าสุด
              </h2>

              <p className="mt-2 text-gray-500">
                สินค้าจากผู้ประกอบการในชุมชน
              </p>
            </div>

            <Link
              href="/products"
              className="hidden text-sm font-medium underline sm:block"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>

          {latestProducts.length === 0 ? (
            <div className="mt-10 rounded-2xl bg-gray-50 p-12 text-center">
              <p className="text-gray-500">
                ยังไม่มีสินค้า
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>

                    <p className="mt-4 text-sm text-gray-500">
                      ร้าน {product.shopName}
                    </p>

                    <div className="mt-5 flex items-end justify-between">
                      <p className="text-xl font-bold">
                        ฿
                        {Number(
                          product.price
                        ).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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

          <Link
            href="/products"
            className="mt-8 inline-block text-sm font-medium underline sm:hidden"
          >
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      </section>

      {/* SHOPS */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                Community Shops
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                ร้านค้าในชุมชน
              </h2>

              <p className="mt-2 text-gray-500">
                รู้จักร้านค้าและผู้ประกอบการในพื้นที่
              </p>
            </div>

            <Link
              href="/shops"
              className="hidden text-sm font-medium underline sm:block"
            >
              ดูร้านค้าทั้งหมด
            </Link>
          </div>

          {activeShops.length === 0 ? (
            <div className="mt-10 rounded-2xl bg-white p-12 text-center">
              <p className="text-gray-500">
                ยังไม่มีร้านค้า
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {activeShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="mt-5 text-2xl font-bold">
                    {shop.name}
                  </h3>

                  <p className="mt-3 line-clamp-3 leading-7 text-gray-500">
                    {shop.description}
                  </p>

                  <div className="mt-6 border-t pt-5">
                    <p className="text-sm text-gray-500">
                      {shop.address}
                    </p>
                  </div>

                  <p className="mt-5 text-sm font-medium">
                    ดูร้านค้า →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-3xl bg-black px-8 py-14 text-white md:px-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              For Community Sellers
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              มีผลิตภัณฑ์จากชุมชนของคุณเอง?
            </h2>

            <p className="mt-4 leading-7 text-gray-300">
              สมัครเปิดร้านและนำสินค้าของคุณมาแสดงบน
              Community Market
            </p>

            <Link
              href="/seller/apply"
              className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-medium text-black hover:bg-gray-200"
            >
              สมัครเปิดร้าน
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
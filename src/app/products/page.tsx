import Image from "next/image";
import Link from "next/link";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  like,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stock?: string;
  }>;
}) {
  const query = await searchParams;

  const search =
    query.q?.trim().slice(0, 100) ?? "";

  const categoryValue =
    Number(query.category);

  const categoryId =
    Number.isInteger(categoryValue) &&
    categoryValue > 0
      ? categoryValue
      : null;

  const inStock =
    query.stock === "1";

  /*
   * ดึงหมวดหมู่สำหรับ Dropdown
   */
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .orderBy(
      asc(categories.name)
    );

  /*
   * ดึงสินค้า
   *
   * - สินค้าต้อง ACTIVE
   * - ร้านต้อง ACTIVE
   * - Search ตามชื่อสินค้า / ชื่อร้าน
   * - Filter หมวดหมู่
   * - Filter Stock
   */
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      description:
        products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,

      categoryId:
        products.categoryId,
      categoryName:
        categories.name,

      shopId: shops.id,
      shopName: shops.name,
    })
    .from(products)
    .innerJoin(
      shops,
      eq(
        products.shopId,
        shops.id
      )
    )
    .leftJoin(
      categories,
      eq(
        products.categoryId,
        categories.id
      )
    )
    .where(
      and(
        eq(
          products.status,
          "ACTIVE"
        ),

        eq(
          shops.status,
          "ACTIVE"
        ),

        search
          ? or(
              like(
                products.name,
                `%${search}%`
              ),
              like(
                shops.name,
                `%${search}%`
              )
            )
          : undefined,

        categoryId
          ? eq(
              products.categoryId,
              categoryId
            )
          : undefined,

        inStock
          ? gt(products.stock, 0)
          : undefined
      )
    )
    .orderBy(
      desc(products.createdAt)
    );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            Marketplace
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            สินค้าทั้งหมด
          </h1>

          <p className="mt-3 text-gray-500">
            ค้นหาและเลือกสินค้าจากร้านค้าในชุมชน
          </p>
        </div>

        {/* FILTER */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <form
            action="/products"
            method="GET"
            className="grid gap-5 lg:grid-cols-[1fr_260px_auto]"
          >
            {/* SEARCH */}
            <div>
              <label
                htmlFor="q"
                className="mb-2 block text-sm font-medium"
              >
                ค้นหาสินค้า
              </label>

              <input
                id="q"
                type="text"
                name="q"
                defaultValue={search}
                placeholder="เช่น น้ำพริก กุ้งแห้ง..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium"
              >
                หมวดหมู่
              </label>

              <select
                id="category"
                name="category"
                defaultValue={
                  categoryId?.toString() ??
                  ""
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-black"
              >
                <option value="">
                  ทุกหมวดหมู่
                </option>

                {allCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BUTTON */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 lg:w-auto"
              >
                ค้นหา
              </button>
            </div>

            {/* STOCK */}
            <div className="lg:col-span-3">
              <label className="flex w-fit cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="stock"
                  value="1"
                  defaultChecked={
                    inStock
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm">
                  แสดงเฉพาะสินค้าที่มี Stock
                </span>
              </label>
            </div>
          </form>

          {/* CURRENT FILTER */}
          {(search ||
            categoryId ||
            inStock) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
              <p className="text-sm text-gray-500">
                พบสินค้า{" "}
                <span className="font-medium text-black">
                  {allProducts.length}
                </span>{" "}
                รายการ
              </p>

              <Link
                href="/products"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                ล้างตัวกรอง
              </Link>
            </div>
          )}
        </section>

        {/* RESULT */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                รายการสินค้า
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {allProducts.length} รายการ
              </p>
            </div>
          </div>

          {allProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-xl font-bold">
                ไม่พบสินค้า
              </p>

              <p className="mt-2 text-gray-500">
                ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
              </p>

              <Link
                href="/products"
                className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                ดูสินค้าทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allProducts.map(
                (product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* IMAGE */}
                    <div className="relative h-52 overflow-hidden bg-gray-100">
                      {product.imageUrl ? (
                        <Image
                          src={
                            product.imageUrl
                          }
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          ยังไม่มีรูปสินค้า
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {product.categoryName && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            {
                              product.categoryName
                            }
                          </span>
                        )}

                        {product.stock > 0 ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                            มีสินค้า
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                            สินค้าหมด
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-lg font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                        {
                          product.description
                        }
                      </p>

                      <p className="mt-3 text-sm text-gray-500">
                        ร้าน{" "}
                        <span className="font-medium text-black">
                          {product.shopName}
                        </span>
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <p className="text-2xl font-bold">
                          ฿
                          {Number(
                            product.price
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>

                        <p className="text-xs text-gray-400">
                          คงเหลือ{" "}
                          {product.stock}
                        </p>
                      </div>
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
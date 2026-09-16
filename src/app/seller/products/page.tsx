import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  deleteProduct,
  toggleProductStatus,
} from "./actions";
import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function SellerProductsPage() {
  const user = await requireRole(["SELLER"]);

  const shopResult = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (shopResult.length === 0) {
    redirect("/seller");
  }

  const shop = shopResult[0];

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      status: products.status,
      categoryName: categories.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(
      categories,
      eq(products.categoryId, categories.id)
    )
    .where(eq(products.shopId, shop.id))
    .orderBy(desc(products.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/seller"
              className="text-sm text-gray-500 hover:text-black"
            >
              ← Seller Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold">
              สินค้าของฉัน
            </h1>

            <p className="mt-2 text-gray-500">
              จัดการสินค้าของ {shop.name}
            </p>
          </div>

          <Link
            href="/seller/products/new"
 className="rounded-lg bg-black px-5 py-3 text-center font-medium text-white hover:bg-gray-800"          >
            + เพิ่มสินค้า
          </Link>
        </div>

        {productList.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              ยังไม่มีสินค้า
            </h2>

            <p className="mt-2 text-gray-500">
              เพิ่มสินค้าแรกให้ร้านของคุณ
            </p>

            <Link
              href="/seller/products/new"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
            >
              เพิ่มสินค้า
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">
                      สินค้า
                    </th>

                    <th className="px-6 py-4">
                      หมวดหมู่
                    </th>

                    <th className="px-6 py-4">
                      ราคา
                    </th>

                    <th className="px-6 py-4">
                      คงเหลือ
                    </th>

                    <th className="px-6 py-4">
                      สถานะ
                    </th>
                    <th className="px-6 py-4">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {productList.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.categoryName ?? "ไม่ระบุ"}
                      </td>

                      <td className="px-6 py-4">
                        ฿
                        {Number(
                          product.price
                        ).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-6 py-4">
                        {product.stock}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
  <div className="flex flex-wrap gap-2">
    <Link
      href={`/seller/products/${product.id}/edit`}
      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
    >
      แก้ไข
    </Link>

    <form action={toggleProductStatus}>
      <input
        type="hidden"
        name="productId"
        value={product.id}
      />

      <button
        type="submit"
        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
      >
        {product.status === "ACTIVE"
          ? "ปิดสินค้า"
          : "เปิดสินค้า"}
      </button>
    </form>

    <form action={deleteProduct}>
      <input
        type="hidden"
        name="productId"
        value={product.id}
      />

      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        ลบ
      </button>
    </form>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
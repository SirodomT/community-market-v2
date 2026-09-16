import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { createProduct } from "./actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  await requireRole(["SELLER"]);

  const params = await searchParams;

  const categoryList = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <Link
          href="/seller/products"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← กลับไปหน้าสินค้า
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          เพิ่มสินค้า
        </h1>

        <p className="mt-2 text-gray-500">
          เพิ่มสินค้าใหม่เข้าสู่ร้านของคุณ
        </p>

        {params.error === "missing" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {params.error === "name" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            ชื่อสินค้ายาวเกินไป
          </p>
        )}

        {params.error === "price" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            ราคาสินค้าไม่ถูกต้อง
          </p>
        )}

        {params.error === "stock" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            จำนวนสินค้าไม่ถูกต้อง
          </p>
        )}

        {params.error === "category" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            หมวดหมู่สินค้าไม่ถูกต้อง
          </p>
        )}

        <form
          action={createProduct}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block font-medium"
            >
              ชื่อสินค้า
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={150}
              placeholder="เช่น น้ำพริกสมุนไพร"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="mb-2 block font-medium"
            >
              หมวดหมู่
            </label>

            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="">
                ไม่ระบุหมวดหมู่
              </option>

              {categoryList.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block font-medium"
            >
              รายละเอียดสินค้า
            </label>

            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="รายละเอียดเกี่ยวกับสินค้า"
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="mb-2 block font-medium"
              >
                ราคา (บาท)
              </label>

              <input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="stock"
                className="mb-2 block font-medium"
              >
                จำนวนสินค้า
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                required
                min="0"
                step="1"
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            เพิ่มสินค้า
          </button>
        </form>
      </div>
    </main>
  );
}
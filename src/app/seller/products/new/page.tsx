import DashboardNav from "@/components/DashboardNav";
import SubmitButton from "@/components/ui/submit-button";
import { Input, Select, Textarea } from "@/components/ui/primitives";
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
    <main className="page-shell">
      <div className="mx-auto max-w-2xl surface p-5 sm:p-8">
        <DashboardNav mode="seller" />
        <Link
          href="/seller/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับไปหน้าสินค้า
        </Link>

        <h1 className="mt-5 text-3xl font-bold">เพิ่มสินค้า</h1>

        <p className="mt-2 text-muted-foreground">
          เพิ่มสินค้าใหม่เข้าสู่ร้านของคุณ
        </p>

        {params.error === "missing" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {params.error === "name" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            ชื่อสินค้ายาวเกินไป
          </p>
        )}

        {params.error === "price" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            ราคาสินค้าไม่ถูกต้อง
          </p>
        )}

        {params.error === "stock" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            จำนวนสินค้าไม่ถูกต้อง
          </p>
        )}

        {params.error === "category" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            หมวดหมู่สินค้าไม่ถูกต้อง
          </p>
        )}
        {params.error === "image" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            รองรับเฉพาะไฟล์ JPG, PNG และ WEBP
          </p>
        )}

        {params.error === "image-size" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            รูปสินค้าต้องมีขนาดไม่เกิน 900 KB
          </p>
        )}

        <form action={createProduct} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="field-label">
              ชื่อสินค้า
            </label>

            <Input
              id="name"
              name="name"
              type="text"
              required
              maxLength={150}
              placeholder="เช่น น้ำพริกสมุนไพร"
              className=""
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="field-label">
              หมวดหมู่
            </label>

            <Select id="categoryId" name="categoryId" className="">
              <option value="">ไม่ระบุหมวดหมู่</option>

              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              รายละเอียดสินค้า
            </label>

            <Textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="รายละเอียดเกี่ยวกับสินค้า"
              className="resize-none"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="price" className="field-label">
                ราคา (บาท)
              </label>

              <Input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className=""
              />
            </div>

            <div>
              <label htmlFor="stock" className="field-label">
                จำนวนสินค้า
              </label>

              <Input
                id="stock"
                name="stock"
                type="number"
                required
                min="0"
                step="1"
                placeholder="0"
                className=""
              />
            </div>
          </div>

          <div>
            <label htmlFor="image" className="field-label">
              รูปสินค้า
            </label>

            <Input
              id="image"
              name="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className=""
            />

            <p className="mt-2 text-sm text-muted-foreground">
              รองรับ JPG, PNG และ WEBP ขนาดไม่เกิน 900 KB
            </p>
          </div>
          <SubmitButton type="submit" variant="primary" className="w-full">
            เพิ่มสินค้า
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}

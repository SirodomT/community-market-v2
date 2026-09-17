import Image from "next/image";
import DashboardNav from "@/components/DashboardNav";
import SubmitButton from "@/components/ui/submit-button";
import { Input, Select, Textarea } from "@/components/ui/primitives";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { updateProduct } from "./actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const user = await requireRole(["SELLER"]);

  const { id } = await params;
  const query = await searchParams;

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const shopResult = await db
    .select({
      id: shops.id,
    })
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (shopResult.length === 0) {
    notFound();
  }

  const productResult = await db
    .select()
    .from(products)
    .where(
      and(eq(products.id, productId), eq(products.shopId, shopResult[0].id)),
    )
    .limit(1);

  if (productResult.length === 0) {
    notFound();
  }

  const product = productResult[0];

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

        <h1 className="mt-5 text-3xl font-bold">แก้ไขสินค้า</h1>

        <p className="mt-2 text-muted-foreground">แก้ไขข้อมูลสินค้าของร้าน</p>

        {query.error === "missing" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {query.error === "name" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            ชื่อสินค้ายาวเกินไป
          </p>
        )}

        {query.error === "price" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            ราคาสินค้าไม่ถูกต้อง
          </p>
        )}

        {query.error === "stock" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            จำนวนสินค้าไม่ถูกต้อง
          </p>
        )}

        {query.error === "category" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            หมวดหมู่ไม่ถูกต้อง
          </p>
        )}
        {query.error === "image" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            รองรับเฉพาะไฟล์ JPG, PNG และ WEBP
          </p>
        )}

        {query.error === "image-size" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            รูปต้องมีขนาดไม่เกิน 900 KB
          </p>
        )}

        <form action={updateProduct} className="mt-8 space-y-5">
          <input type="hidden" name="productId" value={product.id} />

          <div>
            <label htmlFor="name" className="field-label">
              ชื่อสินค้า
            </label>

            <Input
              id="name"
              name="name"
              required
              maxLength={150}
              defaultValue={product.name}
              className=""
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="field-label">
              หมวดหมู่
            </label>

            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={product.categoryId ?? ""}
              className=""
            >
              <option value="">ไม่ระบุหมวดหมู่</option>

              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="image" className="field-label">
              รูปสินค้า
            </label>

            {product.imageUrl ? (
              <div className="mb-4">
                <Image
                  unoptimized
                  width={480}
                  height={360}
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-48 w-48 rounded-xl object-cover"
                />

                <label className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <input type="checkbox" name="removeImage" />
                  ลบรูปปัจจุบัน
                </label>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">
                สินค้านี้ยังไม่มีรูป
              </p>
            )}

            <Input
              id="image"
              name="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className=""
            />

            <p className="mt-2 text-sm text-muted-foreground">
              JPG, PNG หรือ WEBP ไม่เกิน 900 KB
            </p>
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
              defaultValue={product.description}
              className="resize-none"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="price" className="field-label">
                ราคา
              </label>

              <Input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                defaultValue={product.price}
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
                defaultValue={product.stock}
                className=""
              />
            </div>
          </div>

          <SubmitButton type="submit" variant="primary" className="w-full">
            บันทึกการแก้ไข
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}

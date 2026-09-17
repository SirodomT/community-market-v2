import Image from "next/image";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      shopName: shops.name,
      shopPhone: shops.phone,
      shopAddress: shops.address,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.id, productId),
        eq(products.status, "ACTIVE"),
        eq(shops.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    notFound();
  }

  const product = result[0];

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับไปหน้าสินค้า
        </Link>

        <div className="mt-8 grid gap-10 surface p-6 md:grid-cols-2 md:p-10">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted">
            {product.imageUrl ? (
              <Image
                unoptimized
                width={480}
                height={360}
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground">ยังไม่มีรูปสินค้า</span>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {product.categoryName ?? "ไม่ระบุหมวดหมู่"}
            </p>

            <h1 className="mt-3 text-3xl sm:text-4xl font-bold">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-bold">
              ฿
              {Number(product.price).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              สินค้าคงเหลือ {product.stock} ชิ้น
            </p>

            <div className="mt-8 border-t pt-8">
              <h2 className="text-lg font-bold">รายละเอียดสินค้า</h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="mt-8 border-t pt-8">
              <h2 className="text-lg font-bold">ข้อมูลร้านค้า</h2>

              <p className="mt-3 font-medium">{product.shopName}</p>

              <p className="mt-2 text-sm text-muted-foreground">
                โทร: {product.shopPhone}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {product.shopAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

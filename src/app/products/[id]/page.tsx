import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!/^\d+$/.test(id) || !Number.isSafeInteger(productId) || productId <= 0) {
    notFound();
  }

  const [product] = await db
    .select({
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
        eq(shops.status, "ACTIVE")
      )
    )
    .limit(1);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/products" className="text-sm text-gray-500 hover:text-black">
          ← กลับไปหน้าสินค้า
        </Link>

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <span className="text-sm text-gray-400">ยังไม่มีรูปสินค้า</span>
              )}
            </div>

            <div className="p-8">
              <p className="text-sm text-gray-500">
                {product.categoryName ?? "ไม่ระบุหมวดหมู่"}
              </p>
              <h1 className="mt-2 text-4xl font-bold">{product.name}</h1>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-gray-600">
                {product.description}
              </p>
              <p className="mt-8 text-3xl font-bold">
                ฿{Number(product.price).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                คงเหลือ {product.stock} ชิ้น
              </p>
            </div>
          </div>

          <div className="border-t p-8">
            <h2 className="text-2xl font-bold">ร้าน {product.shopName}</h2>
            <dl className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">เบอร์โทรศัพท์</dt>
                <dd className="mt-2 font-medium">{product.shopPhone}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">ที่อยู่</dt>
                <dd className="mt-2 whitespace-pre-wrap leading-6">{product.shopAddress}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}

import { Store, Banknote } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { Input } from "@/components/ui/primitives";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { addToCart } from "@/app/cart/actions";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

export default async function ProductDetailPage({
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
  const { id } = await params;
  const productId = Number(id);
  const query = await searchParams;
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
      shopId: shops.id,
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

  if (!product) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับไปหน้าสินค้า
        </Link>

        <section className="mt-8 overflow-hidden surface">
          <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted">
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
                <span className="text-sm text-muted-foreground">
                  ยังไม่มีรูปสินค้า
                </span>
              )}
            </div>

            <div className="p-5 sm:p-8">
              <p className="text-sm text-muted-foreground">
                {product.categoryName ?? "ไม่ระบุหมวดหมู่"}
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-relaxed sm:text-3xl sm:text-4xl">
                {product.name}
              </h1>
              <Link
                href={`/shops/${product.shopId}`}
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
              >
                <Store aria-hidden="true" className="size-4" />
                {product.shopName} →
              </Link>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-8 text-3xl font-bold">
                ฿
                {Number(product.price).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                คงเหลือ {product.stock} ชิ้น
              </p>
              {query.error === "stock" && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
                >
                  จำนวนสินค้าที่เลือกเกินจำนวนคงเหลือ
                </p>
              )}

              {query.error === "quantity" && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
                >
                  จำนวนสินค้าไม่ถูกต้อง
                </p>
              )}

              {query.error === "out-of-stock" && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
                >
                  สินค้านี้หมด
                </p>
              )}

              {product.stock > 0 ? (
                <form
                  action={addToCart}
                  className="mt-6 flex flex-wrap items-center gap-3"
                >
                  <input type="hidden" name="productId" value={productId} />

                  <div>
                    <label htmlFor="quantity" className="field-label">
                      จำนวน
                    </label>

                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      inputMode="numeric"
                      defaultValue={1}
                      min={1}
                      max={product.stock}
                      className="w-24 text-center"
                    />
                  </div>

                  <SubmitButton
                    type="submit"
                    variant="primary"
                    className="mt-7 flex-1"
                  >
                    เพิ่มลงตะกร้า
                  </SubmitButton>
                </form>
              ) : (
                <p className="mt-6 font-medium text-red-600">สินค้าหมด</p>
              )}
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Banknote aria-hidden="true" className="size-4" />
                ชำระเงินปลายทางเมื่อได้รับสินค้า
              </p>
            </div>
          </div>

          <div className="border-t p-5 sm:p-8">
            <h2 className="text-2xl font-bold">ร้าน {product.shopName}</h2>
            <dl className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">เบอร์โทรศัพท์</dt>
                <dd className="mt-2 font-medium">{product.shopPhone}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">ที่อยู่</dt>
                <dd className="mt-2 whitespace-pre-wrap leading-6">
                  {product.shopAddress}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}

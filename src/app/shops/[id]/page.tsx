import ProductCard from "@/components/ProductCard";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { Store, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const shopId = Number(id);

  if (!Number.isInteger(shopId) || shopId <= 0) {
    notFound();
  }

  const shopResult = await db
    .select()
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.status, "ACTIVE")))
    .limit(1);

  if (shopResult.length === 0) {
    notFound();
  }

  const shop = shopResult[0];

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.shopId, shop.id), eq(products.status, "ACTIVE")))
    .orderBy(desc(products.createdAt));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shops"
          className="btn btn-ghost mb-5 pl-0 text-muted-foreground"
        >
          ← ร้านค้าชุมชน
        </Link>
        <section className="surface overflow-hidden">
          <div className="bg-primary-soft px-5 py-8 sm:p-10">
            <span className="mb-5 inline-flex rounded-2xl bg-white p-4 text-primary">
              <Store aria-hidden="true" className="size-7" />
            </span>
            <p className="eyebrow">ร้านค้าชุมชน</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{shop.name}</h1>
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-8 text-muted-foreground sm:text-base">
              {shop.description}
            </p>
          </div>
          <div className="grid gap-5 p-5 sm:p-8 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Phone
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="text-xs text-muted-foreground">ติดต่อร้านค้า</p>
                <p className="mt-1 font-medium">{shop.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="text-xs text-muted-foreground">ที่ตั้งร้าน</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
                  {shop.address}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-10">
          <SectionHeader
            title="สินค้าจากร้านนี้"
            description={
              productList.length + " รายการ · เลือกซื้อสินค้าที่คุณสนใจ"
            }
          />
          {productList.length === 0 ? (
            <EmptyState
              title="ร้านนี้กำลังเตรียมสินค้า"
              description="กลับมาแวะชมอีกครั้ง หรือเลือกดูสินค้าจากร้านค้าอื่นในชุมชน"
              href="/products"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {productList.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, shopName: shop.name }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { PageHeader, EmptyState } from "@/components/ui/primitives";

import { and, asc, desc, eq, gt, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

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

  const search = query.q?.trim().slice(0, 100) ?? "";

  const categoryValue = Number(query.category);

  const categoryId =
    Number.isInteger(categoryValue) && categoryValue > 0 ? categoryValue : null;

  const inStock = query.stock === "1";

  /*
   * ดึงหมวดหมู่สำหรับ Dropdown
   */
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .orderBy(asc(categories.name));

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
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,

      categoryId: products.categoryId,
      categoryName: categories.name,

      shopId: shops.id,
      shopName: shops.name,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.status, "ACTIVE"),

        eq(shops.status, "ACTIVE"),

        search
          ? or(
              ilike(products.name, `%${search}%`),
              ilike(shops.name, `%${search}%`),
            )
          : undefined,

        categoryId ? eq(products.categoryId, categoryId) : undefined,

        inStock ? gt(products.stock, 0) : undefined,
      ),
    )
    .orderBy(desc(products.createdAt));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="ตลาดชุมชน / สินค้า"
          title="ค้นพบของดีจากชุมชน"
          description="เลือกซื้อสินค้าที่มีเรื่องราว จากผู้ประกอบการท้องถิ่นที่ตั้งใจทำ"
        />
        <ProductFilters
          key={[search, categoryId, inStock].join("-")}
          categories={allCategories}
          search={search}
          categoryId={categoryId}
          inStock={inStock}
        />
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              สินค้าทั้งหมด{" "}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {allProducts.length} รายการ
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              เรียงตามสินค้าล่าสุด
            </p>
          </div>
          {allProducts.length === 0 ? (
            <EmptyState
              title="ยังไม่พบสินค้าที่ตรงใจ"
              description="ลองเปลี่ยนคำค้นหา เลือกหมวดหมู่อื่น หรือล้างตัวกรองเพื่อดูสินค้าทั้งหมด"
              href="/products"
              label="ดูสินค้าทั้งหมด"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

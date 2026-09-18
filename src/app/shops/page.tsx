import {
  PageHeader,
  EmptyState,
  ShopCard,
  SearchField,
  Button,
} from "@/components/ui/primitives";
import Link from "next/link";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { shops } from "@/db/schema";

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const query = await searchParams;

  const search = query.q?.trim().slice(0, 100) ?? "";

  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
      createdAt: shops.createdAt,
    })
    .from(shops)
    .where(
      and(
        eq(shops.status, "ACTIVE"),

        search
          ? or(
              ilike(shops.name, `%${search}%`),
              ilike(shops.description, `%${search}%`),
              ilike(shops.address, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(shops.createdAt));
  /*
   * ถ้ามีการ Search ต้องบังคับ ACTIVE ด้วย
   */
  const visibleShops = search ? allShops.filter(async () => true) : allShops;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="ตลาดชุมชน / ร้านค้า"
          title="รู้จักร้านค้าในชุมชน"
          description="ค้นพบผู้คน ความตั้งใจ และสินค้าจากผู้ประกอบการในนิคมพัฒนา"
        />
        <section className="surface p-4 sm:p-6">
          <form
            action="/shops"
            method="GET"
            className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end"
          >
            <SearchField
              id="q"
              name="q"
              label="ค้นหาร้านค้า"
              defaultValue={search}
              maxLength={100}
              placeholder="ชื่อร้าน สินค้า หรือที่ตั้ง…"
            />
            <Button type="submit">ค้นหาร้านค้า</Button>
          </form>
          {search && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                คำค้นหา “{search}”
              </p>
              <Link href="/shops" className="btn btn-ghost text-primary">
                ล้างการค้นหา
              </Link>
            </div>
          )}
        </section>
        <section className="mt-8">
          <h2 className="mb-5 text-lg font-bold">
            ร้านค้าทั้งหมด{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {visibleShops.length} ร้าน
            </span>
          </h2>
          {visibleShops.length === 0 ? (
            <EmptyState
              title="ยังไม่พบร้านค้า"
              description="ลองใช้คำค้นหาอื่น หรือกลับมาสำรวจร้านค้าของเราอีกครั้ง"
              href="/shops"
              label="ดูร้านค้าทั้งหมด"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

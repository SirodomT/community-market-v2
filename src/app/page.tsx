import Image from "next/image";
import {
  MapPin,
  Search,
  ArrowUpRight,
  ArrowRight,
  Package,
  Leaf,
  Utensils,
  Shirt,
  Sprout,
  Armchair,
  Shapes,
} from "lucide-react";
import {
  SectionHeader,
  EmptyState,
  ShopCard,
} from "@/components/ui/primitives";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, products, shops } from "@/db/schema";

export default async function HomePage() {
  const latestProducts = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      categoryName: categories.name,
      shopName: shops.name,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "ACTIVE"), eq(shops.status, "ACTIVE")))
    .orderBy(desc(products.createdAt))
    .limit(4);

  const activeShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
    })
    .from(shops)
    .where(eq(shops.status, "ACTIVE"))
    .orderBy(desc(shops.createdAt))
    .limit(3);

  const discoveryCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);
  const spotlight = latestProducts[0];
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl bg-[#e8eee2] p-6 sm:p-10 lg:p-12">
            <p className="eyebrow flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4" />
              นิคมพัฒนา · ระยอง
            </p>
            <h1 className="mt-6 max-w-xl text-3xl font-bold leading-[1.4] tracking-tight sm:text-5xl">
              ของดีจากชุมชน
              <br />
              <span className="text-primary">ส่งต่อถึงมือคุณ</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-muted-foreground sm:text-base">
              ค้นพบสินค้า ร้านค้า และความตั้งใจของผู้ประกอบการท้องถิ่น
              <br className="hidden sm:block" />
              เลือกสิ่งที่ชอบ พร้อมเป็นส่วนหนึ่งในการสนับสนุนชุมชน
            </p>
            <form
              action="/products"
              method="GET"
              className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-primary/15 bg-white p-2"
            >
              <label htmlFor="home-search" className="sr-only">
                ค้นหาสินค้าหรือร้านค้า
              </label>
              <Search
                aria-hidden="true"
                className="ml-2 hidden size-5 shrink-0 text-muted-foreground sm:block"
              />
              <input
                id="home-search"
                name="q"
                type="search"
                maxLength={100}
                placeholder="ค้นหาสินค้าหรือร้านค้า…"
                className="min-w-0 flex-1 rounded-xl px-2 py-3 text-base"
              />
              <button type="submit" className="btn btn-primary">
                ค้นหา
              </button>
            </form>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/products" className="btn btn-primary">
                เลือกซื้อสินค้า
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/shops" className="btn btn-ghost text-primary">
                รู้จักร้านค้าชุมชน
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {spotlight ? (
              <Link
                href={`/products/${spotlight.id}`}
                className="group relative flex min-h-52 flex-col justify-end overflow-hidden rounded-3xl bg-[#ede2d2] p-6 sm:min-h-60"
              >
                {spotlight.imageUrl ? (
                  <>
                    <Image
                      src={spotlight.imageUrl}
                      alt={spotlight.name}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 450px, 50vw"
                      className="object-cover transition duration-200 motion-safe:group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-black/45" />
                  </>
                ) : (
                  <Package
                    aria-hidden="true"
                    className="absolute right-7 top-7 size-20 stroke-[.75] text-accent/30"
                  />
                )}
                <div
                  className={`relative ${spotlight.imageUrl ? "text-white" : "text-foreground"}`}
                >
                  <p className="text-xs font-semibold">ค้นพบสินค้าจากชุมชน</p>
                  <h2 className="mt-3 text-2xl font-bold">{spotlight.name}</h2>
                  <p className="mt-2 text-sm">จากร้าน {spotlight.shopName}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    ดูรายละเอียด
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex min-h-52 flex-col justify-between rounded-3xl bg-[#ede2d2] p-6">
                <Leaf aria-hidden="true" className="size-10 text-accent" />
                <p className="mt-6 text-2xl font-bold leading-relaxed">
                  สินค้าท้องถิ่น
                  <br />
                  คุณค่าที่ส่งต่อได้
                </p>
              </div>
            )}
            <Link
              href="/shops"
              className="flex items-center justify-between gap-5 rounded-3xl bg-primary p-6 text-white"
            >
              <div>
                <p className="text-xs text-white/80">จากคนในชุมชน ถึงคุณ</p>
                <h2 className="mt-2 text-xl font-bold">
                  รู้จักคนเบื้องหลังสินค้า
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  แวะชมร้านค้าและเรื่องราวในพื้นที่
                </p>
              </div>
              <ArrowUpRight aria-hidden="true" className="size-6 shrink-0" />
            </Link>
          </div>
        </div>
      </section>
      {discoveryCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <SectionHeader
            title="วันนี้อยากค้นพบอะไร?"
            description="เลือกหมวดหมู่ที่สนใจ แล้วเริ่มสำรวจของดีในชุมชน"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {discoveryCategories.map((category) => {
              const Icon = /อาหาร|เครื่องดื่ม/.test(category.name)
                ? Utensils
                : /เสื้อ|แต่งกาย/.test(category.name)
                  ? Shirt
                  : /เกษตร/.test(category.name)
                    ? Sprout
                    : /ตกแต่ง|ของใช้/.test(category.name)
                      ? Armchair
                      : Shapes;
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="surface group flex items-center gap-3 p-4 transition hover:border-primary/40 sm:flex-col sm:py-6 sm:text-center"
                >
                  <span className="rounded-xl bg-primary-soft p-3 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="text-xs font-semibold leading-6 sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader
          title="สินค้าล่าสุดจากชุมชน"
          description="ของกิน ของใช้ และความตั้งใจจากผู้ประกอบการท้องถิ่น"
          href="/products"
          linkLabel="ดูสินค้าทั้งหมด"
        />
        {latestProducts.length ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="เรื่องราวใหม่กำลังเริ่มต้น"
            description="สินค้าจากชุมชนจะมาอยู่ที่นี่เร็ว ๆ นี้ ระหว่างนี้แวะชมร้านค้าของเราได้"
            href="/shops"
            label="สำรวจร้านค้า"
          />
        )}
      </section>
      <section className="border-y border-border bg-[#eeece4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">มากกว่าสินค้า คือความตั้งใจ</p>
            <h2 className="mt-4 text-3xl font-bold leading-relaxed">
              ทุกการเลือกซื้อ
              <br />
              เชื่อมเราเข้ากับชุมชน
            </h2>
          </div>
          <div>
            <p className="text-sm leading-8 text-muted-foreground sm:text-base">
              ตลาดวิสาหกิจชุมชน อำเภอนิคมพัฒนา จังหวัดระยอง
              เป็นพื้นที่ให้คุณได้รู้จักผู้ประกอบการในท้องถิ่น
              ผ่านสินค้าและเรื่องราวของแต่ละร้าน เลือกซื้อสิ่งที่ชอบ
              และส่งต่อโอกาสให้ชุมชนเติบโตไปด้วยกัน
            </p>
            <Link href="/shops" className="btn btn-secondary mt-5">
              สำรวจร้านค้า
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader
          title="แวะทักทายร้านค้าในชุมชน"
          description="ทำความรู้จักร้านค้า ผู้คน และสินค้าของพวกเขา"
          href="/shops"
          linkLabel="ดูร้านค้าทั้งหมด"
        />
        {activeShops.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {activeShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="พื้นที่สำหรับร้านค้าของชุมชน"
            description="ร้านค้าที่พร้อมให้บริการจะแสดงที่นี่"
          />
        )}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-primary p-6 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold text-white/80">
              เติบโตไปกับชุมชน
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              มีของดี อยากให้คนได้รู้จัก?
            </h2>
            <p className="mt-3 text-sm text-white/80">
              เริ่มต้นเปิดร้าน และนำสินค้าของคุณมาพบกับลูกค้าใหม่
            </p>
          </div>
          <Link href="/seller/apply" className="btn btn-secondary shrink-0">
            สมัครเปิดร้าน
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

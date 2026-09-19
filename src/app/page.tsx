import Image from "next/image";
import {
  MapPin,
  Search,
  ArrowUpRight,
  ArrowRight,
  Heart,
  Store,
  Banknote,
  Sparkles,
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
  return (
    <main>
      <section className="market-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="editorial-kicker">
            <span className="size-2 rounded-full bg-current" /> LOCAL GOODS.
            GOOD STORIES.
          </p>
          <h1 id="hero-title" className="hero-title">
            ของดีใกล้ตัว
            <br />
            <span>ความสุขใกล้ใจ</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-8 text-foreground/75 sm:text-base">
            ค้นพบรสชาติ งานฝีมือ และความตั้งใจ
            <br className="hidden sm:block" />
            จากคนในชุมชนระยอง สู่วันดี ๆ ของคุณ
          </p>
          <Link
            href="/products"
            className="btn btn-primary mt-8 w-fit px-7 py-3.5"
          >
            ออกไปค้นพบของดี{" "}
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </Link>
          <div className="mt-10 flex items-center gap-3 border-t border-foreground/15 pt-5 text-xs text-foreground/70">
            <MapPin aria-hidden="true" className="size-4" /> นิคมพัฒนา · ระยอง{" "}
            <span className="ml-auto font-mono text-[10px] tracking-widest">
              MADE WITH HEART
            </span>
          </div>
        </div>
        <div className="hero-art">
          <span className="hero-orbit" aria-hidden="true" />
          <span className="hero-art-word" aria-hidden="true">
            LOCAL
            <br />
            FLAVOUR.
          </span>
          <div className="hero-product hero-product-back">
            <Image
              src="/images/editorial/banana-chips.webp"
              alt="ขนมกล้วยอบกรอบจากภาพอ้างอิง"
              fill
              sizes="(min-width: 1024px) 330px, 48vw"
              loading="eager"
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div className="hero-product hero-product-front">
            <Image
              src="/images/editorial/durian-chips.webp"
              alt="ทุเรียนทอดกรอบจากภาพอ้างอิง"
              fill
              sizes="(min-width: 1024px) 330px, 48vw"
              loading="eager"
              className="object-contain mix-blend-multiply"
            />
          </div>
          <span className="hero-stamp">
            <Sparkles aria-hidden="true" className="size-5" />
            <span>
              เล็ก ๆ จากชุมชน
              <br />
              มากมายด้วยใจ
            </span>
          </span>
          <p className="hero-caption">
            A TASTE OF RAYONG <span>ภาพบรรยากาศสินค้าชุมชน</span>
          </p>
        </div>
      </section>

      <div className="market-ribbon" aria-hidden="true">
        <span>LOCAL ROOTS</span>
        <span>✳</span>
        <span>ของดีที่มีเรื่องราว</span>
        <span>✳</span>
        <span>MADE WITH HEART</span>
        <span>✳</span>
        <span>เลือกซื้อ ส่งต่อความสุข</span>
        <span>✳</span>
      </div>

      <section
        className="market-section pb-0!"
        aria-labelledby="discover-title"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="editorial-kicker text-accent">
              FIND YOUR EVERYDAY FAVOURITES
            </p>
            <h2
              id="discover-title"
              className="mt-3 text-2xl font-bold sm:text-3xl"
            >
              วันนี้อยากค้นพบอะไร?
            </h2>
          </div>
          <form
            action="/products"
            method="GET"
            className="market-search md:w-96"
          >
            <Search aria-hidden="true" className="size-5 shrink-0" />
            <label htmlFor="home-search" className="sr-only">
              ค้นหาสินค้าหรือร้านค้า
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="ลองค้นหาของดีที่คุณชอบ…"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="ค้นหา"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-white hover:bg-primary"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
        {discoveryCategories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {discoveryCategories.map((category) => {
              const Icon = /อาหาร|เครื่องดื่ม/.test(category.name)
                ? Utensils
                : /เสื้อ|ผ้า/.test(category.name)
                  ? Shirt
                  : /เกษตร/.test(category.name)
                    ? Sprout
                    : /บ้าน/.test(category.name)
                      ? Armchair
                      : Shapes;
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="category-chip"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {category.name}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="ml-2 size-3.5 opacity-50"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="market-section">
        <p className="editorial-kicker mb-4 text-accent">
          FRESH FROM THE COMMUNITY
        </p>
        <SectionHeader
          title="ของดีมาใหม่ น่าลองทุกชิ้น"
          description="เลือกสิ่งที่ชอบ แล้วให้ทุกการซื้อเป็นส่วนหนึ่งของเรื่องราวดี ๆ"
          href="/products"
          linkLabel="เลือกดูทั้งหมด"
        />
        {latestProducts.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
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

      <section className="story-band" aria-labelledby="story-title">
        <div className="story-photo">
          <Image
            src="/images/editorial/local-snacks.webp"
            alt="ขนมท้องถิ่นในบรรจุภัณฑ์ จากภาพอ้างอิงชุมชน"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="story-photo-label">SMALL MAKERS. BIG HEART.</span>
        </div>
        <div className="story-copy">
          <p className="editorial-kicker">BEHIND EVERY GOOD THING</p>
          <h2
            id="story-title"
            className="mt-6 text-3xl font-bold leading-relaxed sm:text-4xl"
          >
            ไม่ใช่แค่ของดี
            <br />
            แต่มีเรื่องราวดี ๆ อยู่ด้วย
          </h2>
          <p className="mt-6 max-w-md text-sm leading-8 text-white/80">
            จากวัตถุดิบที่คุ้นเคย สู่ความตั้งใจของคนในท้องถิ่น ทุกชิ้นมีที่มา
            ทุกการเลือกซื้อช่วยส่งต่อโอกาสให้ชุมชนนิคมพัฒนาเติบโตไปด้วยกัน
          </p>
          <Link
            href="/shops"
            className="btn mt-8 w-fit border-white/40 text-white hover:bg-white/10"
          >
            รู้จักร้านค้าและคนเบื้องหลัง{" "}
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </Link>
          <span className="story-number" aria-hidden="true">
            ระยอง.
          </span>
        </div>
      </section>

      <section className="market-section">
        <p className="editorial-kicker mb-4 text-accent">
          MEET YOUR LOCAL MAKERS
        </p>
        <SectionHeader
          title="ร้านเล็ก ๆ ที่อยากให้รู้จัก"
          description="แวะทักทายผู้คน แล้วค้นพบของโปรดร้านใหม่ของคุณ"
          href="/shops"
          linkLabel="สำรวจทุกร้าน"
        />
        {activeShops.length ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
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

      <section className="market-values" aria-label="ซื้อสินค้าจากชุมชน">
        <div>
          <Store aria-hidden="true" />
          <span>
            <strong>ใกล้ชุมชน ใกล้คุณ</strong>
            <small>รู้จักร้านค้าและผู้ประกอบการท้องถิ่น</small>
          </span>
        </div>
        <div>
          <Heart aria-hidden="true" />
          <span>
            <strong>ทุกชิ้นมีความตั้งใจ</strong>
            <small>เลือกซื้อ ส่งต่อโอกาสให้ชุมชน</small>
          </span>
        </div>
        <div>
          <Banknote aria-hidden="true" />
          <span>
            <strong>ชำระเงินเมื่อได้รับสินค้า</strong>
            <small>สั่งซื้อด้วยบริการเก็บเงินปลายทาง</small>
          </span>
        </div>
      </section>
      <section className="seller-invite">
        <div>
          <p className="editorial-kicker">GROW TOGETHER</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-4xl">
            ของดีของคุณ ให้ชุมชนได้รู้จัก
          </h2>
          <p className="mt-4 text-sm text-foreground/70">
            เริ่มต้นเรื่องราวบทใหม่ เปิดร้านและเติบโตไปด้วยกัน
          </p>
        </div>
        <Link
          href="/seller/apply"
          className="btn btn-primary shrink-0 px-7 py-4"
        >
          มาเป็นร้านค้าของเรา{" "}
          <ArrowUpRight aria-hidden="true" className="size-5" />
        </Link>
      </section>
    </main>
  );
}

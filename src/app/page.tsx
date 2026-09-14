import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
              Community Enterprise Market
            </p>

            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              ตลาดวิสาหกิจชุมชน
              <br />
              อำเภอนิคมพัฒนา
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              พื้นที่สำหรับค้นหาและเลือกซื้อผลิตภัณฑ์จากผู้ประกอบการ
              และวิสาหกิจชุมชนในอำเภอนิคมพัฒนา จังหวัดระยอง
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
              >
                เลือกซื้อสินค้า
              </Link>

              <Link
                href="/shops"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium transition hover:bg-gray-100"
              >
                ดูร้านค้าชุมชน
              </Link>
            </div>
          </div>

          <div className="flex min-h-[340px] items-center justify-center rounded-3xl bg-white p-10 shadow-sm">
            <div className="text-center">
              <div className="text-7xl">
                🛍️
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                Local Products
              </h2>

              <p className="mt-2 text-gray-500">
                สนับสนุนสินค้าและผู้ประกอบการในชุมชน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Categories
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            หมวดหมู่สินค้า
          </h2>

          <p className="mt-3 text-gray-500">
            ค้นหาผลิตภัณฑ์ชุมชนตามหมวดหมู่ที่คุณสนใจ
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryCard
            icon="🍜"
            title="อาหาร"
            description="อาหารและผลิตภัณฑ์แปรรูป"
          />

          <CategoryCard
            icon="🥤"
            title="เครื่องดื่ม"
            description="เครื่องดื่มและผลิตภัณฑ์ชุมชน"
          />

          <CategoryCard
            icon="🧺"
            title="หัตถกรรม"
            description="งานฝีมือและของใช้ในชุมชน"
          />

          <CategoryCard
            icon="🌿"
            title="ผลิตภัณฑ์เกษตร"
            description="ผลผลิตและสินค้าเกษตร"
          />
        </div>
      </section>

      {/* Products */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                Featured Products
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                สินค้าแนะนำ
              </h2>
            </div>

            <Link
              href="/products"
              className="font-medium hover:underline"
            >
              ดูสินค้าทั้งหมด →
            </Link>
          </div>

          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">
              สินค้าจากฐานข้อมูลจะแสดงบริเวณนี้
            </p>
          </div>
        </div>
      </section>

      {/* Shops */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Community Shops
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              ร้านค้าวิสาหกิจชุมชน
            </h2>
          </div>

          <Link
            href="/shops"
            className="font-medium hover:underline"
          >
            ดูร้านค้าทั้งหมด →
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">
            ร้านค้าจากฐานข้อมูลจะแสดงบริเวณนี้
          </p>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            มีผลิตภัณฑ์จากชุมชนของคุณเอง?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            เข้าร่วมตลาดวิสาหกิจชุมชนและนำเสนอผลิตภัณฑ์ของคุณ
            ให้ผู้บริโภครู้จักมากขึ้น
          </p>

          <Link
            href="/seller"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-black transition hover:bg-gray-200"
          >
            เริ่มต้นเปิดร้าน
          </Link>
        </div>
      </section>
    </main>
  );
}

function CategoryCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="text-4xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}
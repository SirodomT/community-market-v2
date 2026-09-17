import Link from "next/link";
import {
  and,
  count,
  eq,
  gt,
  lte,
} from "drizzle-orm";

import { db } from "@/db";
import {
  orderShops,
  products,
  shops,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  const user = await requireRole([
    "SELLER",
  ]);

  const [shop] = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
      status: shops.status,
    })
    .from(shops)
    .where(
      eq(
        shops.ownerId,
        user.id
      )
    )
    .limit(1);

  if (!shop) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              ไม่พบร้านค้า
            </h1>

            <p className="mt-3 text-gray-500">
              บัญชีนี้เป็นผู้ขายแต่ยังไม่พบข้อมูลร้านค้า
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-medium text-white"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const [
    totalProductsResult,
    lowStockResult,
    outOfStockResult,
    pendingOrdersResult,
    shippedOrdersResult,
  ] = await Promise.all([
    // สินค้าทั้งหมด
    db
      .select({
        total: count(),
      })
      .from(products)
      .where(
        eq(
          products.shopId,
          shop.id
        )
      ),

    // สินค้าใกล้หมด 1 - 5 ชิ้น
    db
      .select({
        total: count(),
      })
      .from(products)
      .where(
        and(
          eq(
            products.shopId,
            shop.id
          ),
          eq(
            products.status,
            "ACTIVE"
          ),
          gt(
            products.stock,
            0
          ),
          lte(
            products.stock,
            5
          )
        )
      ),

    // สินค้าหมด
    db
      .select({
        total: count(),
      })
      .from(products)
      .where(
        and(
          eq(
            products.shopId,
            shop.id
          ),
          eq(
            products.status,
            "ACTIVE"
          ),
          eq(
            products.stock,
            0
          )
        )
      ),

    // Order รอยืนยัน
    db
      .select({
        total: count(),
      })
      .from(orderShops)
      .where(
        and(
          eq(
            orderShops.shopId,
            shop.id
          ),
          eq(
            orderShops.status,
            "PENDING"
          )
        )
      ),

    // Order ที่จัดส่งแล้ว รอลูกค้ายืนยัน
    db
      .select({
        total: count(),
      })
      .from(orderShops)
      .where(
        and(
          eq(
            orderShops.shopId,
            shop.id
          ),
          eq(
            orderShops.status,
            "SHIPPED"
          )
        )
      ),
  ]);

  const totalProducts =
    totalProductsResult[0]?.total ?? 0;

  const lowStock =
    lowStockResult[0]?.total ?? 0;

  const outOfStock =
    outOfStockResult[0]?.total ?? 0;

  const pendingOrders =
    pendingOrdersResult[0]?.total ?? 0;

  const shippedOrders =
    shippedOrdersResult[0]?.total ?? 0;

  const hasStockWarning =
    lowStock > 0 ||
    outOfStock > 0;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Seller Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {shop.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-gray-500">
                เจ้าของร้าน: {user.username}
              </p>

              <span
                className={
                  shop.status === "ACTIVE"
                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                    : "rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
                }
              >
                {shop.status === "ACTIVE"
                  ? "ร้านเปิดใช้งาน"
                  : "ร้านถูกปิด"}
              </span>
            </div>
          </div>

          {shop.status === "ACTIVE" && (
            <Link
              href={`/shops/${shop.id}`}
              className="w-fit rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-gray-100"
            >
              ดูหน้าร้าน →
            </Link>
          )}
        </div>

        {/* STOCK WARNING */}
        {hasStockWarning && (
          <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="font-bold text-yellow-800">
              ตรวจสอบ Stock สินค้า
            </h2>

            <p className="mt-2 text-sm leading-6 text-yellow-700">
              {lowStock > 0 && (
                <>
                  มีสินค้าใกล้หมด{" "}
                  <strong>{lowStock}</strong>{" "}
                  รายการ
                </>
              )}

              {lowStock > 0 &&
                outOfStock > 0 &&
                " และ "}

              {outOfStock > 0 && (
                <>
                  สินค้าหมด{" "}
                  <strong>{outOfStock}</strong>{" "}
                  รายการ
                </>
              )}
            </p>

            <Link
              href="/seller/products"
              className="mt-4 inline-block text-sm font-bold text-yellow-800 hover:underline"
            >
              ไปจัดการสินค้า →
            </Link>
          </section>
        )}

        {/* SUMMARY */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              สินค้าทั้งหมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {totalProducts}
            </p>

            <Link
              href="/seller/products"
              className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
            >
              จัดการสินค้า →
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              สินค้าใกล้หมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {lowStock}
            </p>

            <p className="mt-5 text-sm text-gray-400">
              เหลือ 1 - 5 ชิ้น
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Order รอยืนยัน
            </p>

            <p className="mt-3 text-4xl font-bold">
              {pendingOrders}
            </p>

            <Link
              href="/seller/orders"
              className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
            >
              ตรวจสอบ Order →
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              จัดส่งแล้ว
            </p>

            <p className="mt-3 text-4xl font-bold">
              {shippedOrders}
            </p>

            <p className="mt-5 text-sm text-gray-400">
              รอลูกค้ายืนยันรับสินค้า
            </p>
          </div>
        </section>

        {/* MANAGEMENT */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">
            จัดการร้านค้า
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/seller/products"
              className="rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-bold">
                สินค้าของร้าน
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                เพิ่ม แก้ไข เปิด/ปิด และจัดการ Stock สินค้า
              </p>
            </Link>

            <Link
              href="/seller/products/new"
              className="rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-bold">
                เพิ่มสินค้าใหม่
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                เพิ่มสินค้าใหม่เข้าสู่ร้านค้า
              </p>
            </Link>

            <Link
              href="/seller/orders"
              className="rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-bold">
                คำสั่งซื้อ
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                ยืนยันคำสั่งซื้อและอัปเดตสถานะการจัดส่ง
              </p>
            </Link>
          </div>
        </section>

        {/* SHOP INFO */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">
            ข้อมูลร้านค้า
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                ชื่อร้าน
              </p>

              <p className="mt-2 font-medium">
                {shop.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                เบอร์โทรศัพท์
              </p>

              <p className="mt-2 font-medium">
                {shop.phone}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">
                รายละเอียด
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7">
                {shop.description}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">
                ที่อยู่
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7">
                {shop.address}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
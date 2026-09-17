import DashboardNav from "@/components/DashboardNav";
import { Package, TriangleAlert, ShoppingBag, Truck } from "lucide-react";
import { EmptyState, StatCard } from "@/components/ui/primitives";
import Link from "next/link";
import { and, count, eq, gt, lte } from "drizzle-orm";

import { db } from "@/db";
import { orderShops, products, shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  const user = await requireRole(["SELLER"]);

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
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (!shop) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-4xl">
          <div className="mt-6">
            <EmptyState
              title="บัญชีนี้เป็นผู้ขายแต่ยังไม่พบข้อมูลร้านค้า"
              description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
              href="/"
              label="กลับหน้าหลัก"
            />
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
      .where(eq(products.shopId, shop.id)),

    // สินค้าใกล้หมด 1 - 5 ชิ้น
    db
      .select({
        total: count(),
      })
      .from(products)
      .where(
        and(
          eq(products.shopId, shop.id),
          eq(products.status, "ACTIVE"),
          gt(products.stock, 0),
          lte(products.stock, 5),
        ),
      ),

    // สินค้าหมด
    db
      .select({
        total: count(),
      })
      .from(products)
      .where(
        and(
          eq(products.shopId, shop.id),
          eq(products.status, "ACTIVE"),
          eq(products.stock, 0),
        ),
      ),

    // คำสั่งซื้อรอยืนยัน
    db
      .select({
        total: count(),
      })
      .from(orderShops)
      .where(
        and(eq(orderShops.shopId, shop.id), eq(orderShops.status, "PENDING")),
      ),

    // Order ที่จัดส่งแล้ว รอลูกค้ายืนยัน
    db
      .select({
        total: count(),
      })
      .from(orderShops)
      .where(
        and(eq(orderShops.shopId, shop.id), eq(orderShops.status, "SHIPPED")),
      ),
  ]);

  const totalProducts = totalProductsResult[0]?.total ?? 0;

  const lowStock = lowStockResult[0]?.total ?? 0;

  const outOfStock = outOfStockResult[0]?.total ?? 0;

  const pendingOrders = pendingOrdersResult[0]?.total ?? 0;

  const shippedOrders = shippedOrdersResult[0]?.total ?? 0;

  const hasStockWarning = lowStock > 0 || outOfStock > 0;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        <DashboardNav mode="seller" />
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              ภาพรวมร้าน
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-3xl sm:text-4xl">
              {shop.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground">
                เจ้าของร้าน: {user.username}
              </p>

              <span
                className={
                  shop.status === "ACTIVE"
                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                    : "rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
                }
              >
                {shop.status === "ACTIVE" ? "ร้านเปิดใช้งาน" : "ร้านถูกปิด"}
              </span>
            </div>
          </div>

          {shop.status === "ACTIVE" && (
            <Link href={`/shops/${shop.id}`} className="btn btn-secondary">
              ดูหน้าร้าน →
            </Link>
          )}
        </div>

        {/* STOCK WARNING */}
        {hasStockWarning && (
          <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="font-bold text-yellow-800">ตรวจสอบสินค้าคงเหลือ</h2>

            <p className="mt-2 text-sm leading-6 text-yellow-700">
              {lowStock > 0 && (
                <>
                  มีสินค้าใกล้หมด <strong>{lowStock}</strong> รายการ
                </>
              )}

              {lowStock > 0 && outOfStock > 0 && " และ "}

              {outOfStock > 0 && (
                <>
                  สินค้าหมด <strong>{outOfStock}</strong> รายการ
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
          <StatCard
            label="สินค้าทั้งหมด"
            value={totalProducts}
            icon={<Package aria-hidden="true" className="size-5" />}
            href="/seller/products"
          />

          <StatCard
            label="สินค้าใกล้หมด"
            value={lowStock}
            icon={<TriangleAlert aria-hidden="true" className="size-5" />}
            description="เหลือ 1 - 5 ชิ้น"
          />

          <StatCard
            label="คำสั่งซื้อรอยืนยัน"
            value={pendingOrders}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
            href="/seller/orders"
          />

          <StatCard
            label="จัดส่งแล้ว"
            value={shippedOrders}
            icon={<Truck aria-hidden="true" className="size-5" />}
            description="รอลูกค้ายืนยันรับสินค้า"
          />
        </section>

        {/* MANAGEMENT */}
        <section className="mt-8 surface p-6 sm:p-5 sm:p-8">
          <h2 className="text-2xl font-bold">จัดการร้านค้า</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/seller/products"
              className="rounded-2xl border border-border p-5 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-bold">สินค้าของร้าน</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                เพิ่ม แก้ไข เปิด/ปิด และจัดการ Stock สินค้า
              </p>
            </Link>

            <Link
              href="/seller/products/new"
              className="rounded-2xl border border-border p-5 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-bold">เพิ่มสินค้าใหม่</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                เพิ่มสินค้าใหม่เข้าสู่ร้านค้า
              </p>
            </Link>

            <Link
              href="/seller/orders"
              className="rounded-2xl border border-border p-5 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-bold">คำสั่งซื้อ</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ยืนยันคำสั่งซื้อและอัปเดตสถานะการจัดส่ง
              </p>
            </Link>
          </div>
        </section>

        {/* SHOP INFO */}
        <section className="mt-8 surface p-6 sm:p-5 sm:p-8">
          <h2 className="text-2xl font-bold">ข้อมูลร้านค้า</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">ชื่อร้าน</p>

              <p className="mt-2 font-medium">{shop.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>

              <p className="mt-2 font-medium">{shop.phone}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">รายละเอียด</p>

              <p className="mt-2 whitespace-pre-wrap leading-7">
                {shop.description}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">ที่อยู่</p>

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

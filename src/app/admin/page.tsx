import { PageHeader } from "@/components/ui/primitives";
import { Users, Store, Package, ShoppingBag, CircleCheck } from "lucide-react";
import { StatCard, EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, shopRequests, shops, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function AdminPage() {
  const admin = await requireRole(["ADMIN"]);

  // Avoid pipelining this batch through the single-connection transaction pooler:
  // concurrent counts can leave replies pending and stall subsequent requests.
  const usersResult = await db
    .select({
      total: count(),
    })
    .from(users);

  const shopsResult = await db
    .select({
      total: count(),
    })
    .from(shops);

  const productsResult = await db
    .select({
      total: count(),
    })
    .from(products);

  const ordersResult = await db
    .select({
      total: count(),
    })
    .from(orders);

  const pendingRequestsResult = await db
    .select({
      total: count(),
    })
    .from(shopRequests)
    .where(eq(shopRequests.status, "PENDING"));

  const recentOrders = await db
    .select({
      id: orders.id,
      shippingName: orders.shippingName,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const totalUsers = usersResult[0]?.total ?? 0;

  const totalShops = shopsResult[0]?.total ?? 0;

  const totalProducts = productsResult[0]?.total ?? 0;

  const totalOrders = ordersResult[0]?.total ?? 0;

  const pendingRequests = pendingRequestsResult[0]?.total ?? 0;

  const completedOrders = await db
    .select({
      total: count(),
    })
    .from(orders)
    .where(eq(orders.status, "COMPLETED"));

  const totalCompletedOrders = completedOrders[0]?.total ?? 0;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <PageHeader
            eyebrow="Administrator"
            title={<>ภาพรวมระบบ</>}
            description={
              <>
                {" "}
                ยินดีต้อนรับ{" "}
                <span className="font-medium text-foreground">
                  {admin.username}
                </span>{" "}
              </>
            }
          />

          <Link href="/" className="btn btn-secondary">
            ← กลับหน้าหลัก
          </Link>
        </div>

        {/* STATS */}
        {/* STATS */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* USERS */}
          <StatCard
            label="ผู้ใช้งานทั้งหมด"
            value={totalUsers}
            icon={<Users aria-hidden="true" className="size-5" />}
            href="/admin/users"
          />

          {/* SHOPS */}
          <StatCard
            label="ร้านค้าทั้งหมด"
            value={totalShops}
            icon={<Store aria-hidden="true" className="size-5" />}
            href="/admin/shops"
          />

          {/* PRODUCTS */}
          <StatCard
            label="สินค้าทั้งหมด"
            value={totalProducts}
            icon={<Package aria-hidden="true" className="size-5" />}
            description="สินค้าจากร้านค้าทั้งหมด"
          />

          {/* ORDERS */}
          <StatCard
            label="คำสั่งซื้อทั้งหมด"
            value={totalOrders}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
            href="/admin/orders"
          />

          {/* COMPLETED ORDERS */}
          <StatCard
            label="คำสั่งซื้อสำเร็จ"
            value={totalCompletedOrders}
            icon={<CircleCheck aria-hidden="true" className="size-5" />}
            description="ลูกค้ายืนยันรับสินค้าแล้ว"
          />

          {/* SHOP REQUESTS */}
          <StatCard
            label="คำขอเปิดร้านที่รอตรวจสอบ"
            value={pendingRequests}
            icon={<Store aria-hidden="true" className="size-5" />}
            href="/admin/shop-requests"
          />
        </section>

        {/* MANAGEMENT */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">จัดการระบบ</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="surface border border-border p-6 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">ผู้ใช้งาน</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ตรวจสอบบัญชี Role และสถานะผู้ใช้งาน
              </p>
            </Link>

            <Link
              href="/admin/shops"
              className="surface border border-border p-6 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">ร้านค้า</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ตรวจสอบร้านค้าและสถานะการเปิดใช้งาน
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="surface border border-border p-6 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">คำสั่งซื้อ</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ดูภาพรวมคำสั่งซื้อในระบบ
              </p>
            </Link>

            <Link
              href="/admin/shop-requests"
              className="surface border border-border p-6 transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">คำขอเปิดร้าน</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                อนุมัติหรือปฏิเสธคำขอจากผู้ใช้งาน
              </p>
            </Link>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="mt-10 surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">คำสั่งซื้อล่าสุด</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                5 รายการล่าสุดในระบบ
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="ยังไม่มีคำสั่งซื้อ"
                description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
              />
            </div>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-label="ตารางข้อมูล เลื่อนแนวนอนเพื่อดูเพิ่มเติม"
              className="mt-6 table-scroll"
            >
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th scope="col" className="pb-4 font-medium">
                      Order
                    </th>

                    <th scope="col" className="pb-4 font-medium">
                      ผู้รับ
                    </th>

                    <th scope="col" className="pb-4 font-medium">
                      ยอดรวม
                    </th>

                    <th scope="col" className="pb-4 font-medium">
                      สถานะ
                    </th>

                    <th scope="col" className="pb-4 font-medium">
                      วันที่
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-5 font-medium">#{order.id}</td>

                      <td className="py-5">{order.shippingName}</td>

                      <td className="py-5 font-medium">
                        ฿
                        {Number(order.totalAmount).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-5">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-5 text-sm text-muted-foreground">
                        {order.createdAt.toLocaleString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

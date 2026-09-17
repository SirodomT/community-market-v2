import { ShoppingBag, CircleCheck, TriangleAlert } from "lucide-react";
import { StatCard, EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, orderShops, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function AdminOrdersPage() {
  await requireRole(["ADMIN"]);

  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,

      username: users.username,
      email: users.email,

      shippingName: orders.shippingName,
      shippingPhone: orders.shippingPhone,

      totalAmount: orders.totalAmount,

      status: orders.status,

      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

  const allShopOrders = await db
    .select({
      id: orderShops.id,
      orderId: orderShops.orderId,
      shopName: orderShops.shopName,
      subtotal: orderShops.subtotal,
      status: orderShops.status,
    })
    .from(orderShops);

  const pendingCount = allOrders.filter(
    (order) => order.status === "PENDING",
  ).length;

  const completedCount = allOrders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  const cancelledCount = allOrders.filter(
    (order) => order.status === "CANCELLED",
  ).length;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← กลับภาพรวมระบบ
          </Link>

          <h1 className="mt-5 text-3xl sm:text-4xl font-bold">
            คำสั่งซื้อทั้งหมด
          </h1>

          <p className="mt-3 text-muted-foreground">
            ตรวจสอบคำสั่งซื้อ ลูกค้า ร้านค้า และสถานะการจัดส่ง
          </p>
        </div>

        {/* STATS */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="คำสั่งซื้อทั้งหมด"
            value={allOrders.length}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="รอดำเนินการ"
            value={pendingCount}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="สำเร็จ"
            value={completedCount}
            icon={<CircleCheck aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="ยกเลิก"
            value={cancelledCount}
            icon={<TriangleAlert aria-hidden="true" className="size-5" />}
          />
        </section>

        {/* ORDERS */}
        <section className="mt-10 space-y-5">
          {allOrders.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="ยังไม่มีคำสั่งซื้อในระบบ"
                description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
              />
            </div>
          ) : (
            allOrders.map((order) => {
              const shopsForOrder = allShopOrders.filter(
                (shopOrder) => shopOrder.orderId === order.id,
              );

              return (
                <div key={order.id} className="surface p-6">
                  <div className="flex flex-col justify-between gap-6 lg:flex-row">
                    {/* LEFT */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          Order #{order.id}
                        </h2>

                        <StatusBadge status={order.status} />
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">
                        {order.createdAt.toLocaleString("th-TH")}
                      </p>

                      <div className="mt-5">
                        <p className="text-sm text-muted-foreground">
                          ผู้สั่งซื้อ
                        </p>

                        <p className="mt-1 font-medium">{order.username}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.email}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          User #{order.userId}
                        </p>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm text-muted-foreground">
                          ผู้รับสินค้า
                        </p>

                        <p className="mt-1 font-medium">{order.shippingName}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.shippingPhone}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="lg:text-right">
                      <p className="text-sm text-muted-foreground">ยอดรวม</p>

                      <p className="mt-2 text-3xl font-bold">
                        ฿
                        {Number(order.totalAmount).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn btn-primary mt-5"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>

                  {/* SHOP STATUS */}
                  <div className="mt-6 border-t pt-6">
                    <p className="font-medium">ร้านค้าในคำสั่งซื้อ</p>

                    {shopsForOrder.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Order เก่า ไม่มีข้อมูลสถานะแยกร้าน
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {shopsForOrder.map((shopOrder) => (
                          <div
                            key={shopOrder.id}
                            className="rounded-xl border border-border px-4 py-3"
                          >
                            <p className="text-sm font-medium">
                              {shopOrder.shopName}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <StatusBadge status={shopOrder.status} />

                              <span className="text-xs text-muted-foreground">
                                ฿
                                {Number(shopOrder.subtotal).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

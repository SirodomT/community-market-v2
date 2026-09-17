import { PageHeader } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { orderItems, orders, orderShops, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  await requireRole(["ADMIN"]);

  const { id } = await params;

  const orderId = Number(id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,

      username: users.username,
      email: users.email,

      shippingName: orders.shippingName,
      shippingPhone: orders.shippingPhone,
      shippingAddress: orders.shippingAddress,

      totalAmount: orders.totalAmount,

      status: orders.status,

      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));

  const shopOrders = await db
    .select()
    .from(orderShops)
    .where(eq(orderShops.orderId, order.id))
    .orderBy(asc(orderShops.id));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับรายการคำสั่งซื้อ
        </Link>

        {/* HEADER */}
        <section className="mt-8 surface p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <PageHeader
              eyebrow="Order"
              title={<>คำสั่งซื้อ #{order.id}</>}
              description={<> {order.createdAt.toLocaleString("th-TH")} </>}
            />

            <div className="md:text-right">
              <p className="text-sm text-muted-foreground">สถานะรวม</p>

              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* CUSTOMER */}
          <div className="mt-8 grid gap-6 border-t pt-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold">บัญชีผู้สั่งซื้อ</h2>

              <p className="mt-4 font-medium">{order.username}</p>

              <p className="mt-1 text-muted-foreground">{order.email}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                User #{order.userId}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold">ข้อมูลจัดส่ง</h2>

              <p className="mt-4 font-medium">{order.shippingName}</p>

              <p className="mt-1 text-muted-foreground">
                {order.shippingPhone}
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-muted-foreground">
                {order.shippingAddress}
              </p>

              <div className="mt-4 rounded-xl bg-background p-4">
                <p className="text-sm text-muted-foreground">วิธีชำระเงิน</p>

                <p className="mt-1 font-medium">เก็บเงินปลายทาง</p>
              </div>
            </div>
          </div>
        </section>

        {/* SHOPS */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold">รายการแยกตามร้าน</h2>

          {shopOrders.length === 0 ? (
            <div className="mt-5 surface p-5 sm:p-8 text-muted-foreground">
              Order นี้เป็นข้อมูลเก่าที่ไม่มีสถานะแยกร้าน
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {shopOrders.map((shopOrder) => {
                const shopItems = items.filter((item) => {
                  if (shopOrder.shopId !== null && item.shopId !== null) {
                    return item.shopId === shopOrder.shopId;
                  }

                  return item.shopName === shopOrder.shopName;
                });

                return (
                  <div key={shopOrder.id} className="surface p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">ร้านค้า</p>

                        <h3 className="mt-1 text-xl font-bold">
                          {shopOrder.shopName}
                        </h3>
                      </div>

                      <StatusBadge status={shopOrder.status} />
                    </div>

                    {/* PRODUCTS */}
                    <div className="mt-5 border-t pt-5">
                      {shopItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-5 border-b py-4 first:pt-0 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              ฿
                              {Number(item.price).toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              × {item.quantity}
                            </p>
                          </div>

                          <p className="font-bold">
                            ฿
                            {Number(item.subtotal).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-between border-t pt-5">
                      <span className="font-medium">ยอดรวมร้านนี้</span>

                      <span className="font-bold">
                        ฿
                        {Number(shopOrder.subtotal).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TOTAL */}
        <section className="mt-8 surface p-5 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">ยอดรวมคำสั่งซื้อ</span>

            <span className="text-3xl font-bold">
              ฿
              {Number(order.totalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

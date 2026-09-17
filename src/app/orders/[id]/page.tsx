import { PageHeader } from "@/components/ui/primitives";
import { SuccessToast } from "@/components/Feedback";
import SubmitButton from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { orderItems, orders, orderShops } from "@/db/schema";
import { requireUser } from "@/lib/auth";

import CancelOrderShopButton from "@/components/CancelOrderShopButton";
import { confirmReceived } from "./actions";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
  }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  const query = await searchParams;

  const orderId = Number(id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
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
          href="/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับไปคำสั่งซื้อของฉัน
        </Link>

        {query.success === "1" && (
          <SuccessToast message="สั่งซื้อเรียบร้อยแล้ว" />
        )}
        {query.success === "1" && (
          <div className="mt-6 rounded-xl bg-green-100 p-4 text-green-700">
            สั่งซื้อเรียบร้อยแล้ว
          </div>
        )}

        <section className="mt-8 surface p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <PageHeader
              eyebrow="Order"
              title={<>คำสั่งซื้อ #{order.id}</>}
              description={<> {order.createdAt.toLocaleString("th-TH")} </>}
            />

            <div>
              <p className="text-sm text-muted-foreground">สถานะรวม</p>

              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* SHOP STATUS */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold">สถานะการจัดส่ง</h2>

            {shopOrders.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                คำสั่งซื้อนี้เป็นข้อมูลเก่าที่ไม่มีสถานะแยกร้าน
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {shopOrders.map((shopOrder) => {
                  const shopItems = items.filter((item) => {
                    if (shopOrder.shopId !== null && item.shopId !== null) {
                      return item.shopId === shopOrder.shopId;
                    }

                    return item.shopName === shopOrder.shopName;
                  });

                  return (
                    <div
                      key={shopOrder.id}
                      className="rounded-2xl border border-border bg-background p-4 sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            ร้านค้า
                          </p>

                          <h3 className="mt-1 text-xl font-bold">
                            {shopOrder.shopName}
                          </h3>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <StatusBadge status={shopOrder.status} />

                          {/* ยกเลิกได้เฉพาะตอน PENDING */}
                          {shopOrder.status === "PENDING" && (
                            <CancelOrderShopButton
                              orderShopId={shopOrder.id}
                              shopName={shopOrder.shopName}
                            />
                          )}

                          {/* ยืนยันรับสินค้าได้เฉพาะตอน SHIPPED */}
                          {shopOrder.status === "SHIPPED" && (
                            <form action={confirmReceived}>
                              <input
                                type="hidden"
                                name="orderShopId"
                                value={shopOrder.id}
                              />

                              <SubmitButton
                                type="submit"
                                variant="primary"
                                className=""
                              >
                                ได้รับสินค้าแล้ว
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* ITEMS */}
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

                      {/* SHOP TOTAL */}
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
          </div>

          {/* ORDER TOTAL */}
          <div className="mt-8 flex items-center justify-between border-t pt-8">
            <span className="text-lg font-medium">ยอดรวมคำสั่งซื้อ</span>

            <span className="text-3xl font-bold">
              ฿
              {Number(order.totalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* SHIPPING */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold">ข้อมูลจัดส่ง</h2>

            <div className="mt-5">
              <p className="font-medium">{order.shippingName}</p>

              <p className="mt-2 text-muted-foreground">
                {order.shippingPhone}
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-muted-foreground">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

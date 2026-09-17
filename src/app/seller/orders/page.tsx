import { PageHeader } from "@/components/ui/primitives";
import DashboardNav from "@/components/DashboardNav";
import SubmitButton from "@/components/ui/submit-button";
import { EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { orderItems, orders, orderShops, shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { advanceSellerOrder } from "./actions";

type OrderStatus =
  "PENDING" | "CONFIRMED" | "SHIPPED" | "COMPLETED" | "CANCELLED";

function getNextAction(status: OrderStatus): {
  status: "CONFIRMED" | "SHIPPED";
  label: string;
} | null {
  switch (status) {
    case "PENDING":
      return {
        status: "CONFIRMED",
        label: "ยืนยันคำสั่งซื้อ",
      };

    case "CONFIRMED":
      return {
        status: "SHIPPED",
        label: "แจ้งจัดส่งแล้ว",
      };

    default:
      return null;
  }
}

export default async function SellerOrdersPage() {
  const user = await requireRole(["SELLER"]);

  const [shop] = await db
    .select({
      id: shops.id,
      name: shops.name,
    })
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (!shop) {
    redirect("/seller");
  }

  const rows = await db
    .select({
      orderShopId: orderShops.id,

      orderId: orders.id,
      orderStatus: orderShops.status,
      createdAt: orders.createdAt,

      shippingName: orders.shippingName,
      shippingPhone: orders.shippingPhone,
      shippingAddress: orders.shippingAddress,

      subtotal: orderShops.subtotal,

      orderItemId: orderItems.id,
      productName: orderItems.productName,
      price: orderItems.price,
      quantity: orderItems.quantity,
      itemSubtotal: orderItems.subtotal,
    })
    .from(orderShops)
    .innerJoin(orders, eq(orderShops.orderId, orders.id))
    .innerJoin(
      orderItems,
      and(eq(orderItems.orderId, orders.id), eq(orderItems.shopId, shop.id)),
    )
    .where(eq(orderShops.shopId, shop.id))
    .orderBy(desc(orders.createdAt));

  const grouped = new Map<
    number,
    {
      orderShopId: number;
      orderId: number;
      status: OrderStatus;
      createdAt: Date;

      shippingName: string;
      shippingPhone: string;
      shippingAddress: string;

      subtotal: string;

      items: {
        id: number;
        productName: string;
        price: string;
        quantity: number;
        subtotal: string;
      }[];
    }
  >();

  for (const row of rows) {
    const existing = grouped.get(row.orderShopId);

    const item = {
      id: row.orderItemId,
      productName: row.productName,
      price: row.price,
      quantity: row.quantity,
      subtotal: row.itemSubtotal,
    };

    if (existing) {
      existing.items.push(item);
    } else {
      grouped.set(row.orderShopId, {
        orderShopId: row.orderShopId,

        orderId: row.orderId,

        status: row.orderStatus,

        createdAt: row.createdAt,

        shippingName: row.shippingName,

        shippingPhone: row.shippingPhone,

        shippingAddress: row.shippingAddress,

        subtotal: row.subtotal,

        items: [item],
      });
    }
  }

  const sellerOrders = Array.from(grouped.values());

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <DashboardNav mode="seller" />
        <Link
          href="/seller"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← ภาพรวมร้าน
        </Link>

        <PageHeader
          eyebrow="Seller Orders"
          title={<>คำสั่งซื้อของร้าน</>}
          description={<> จัดการคำสั่งซื้อของ {shop.name} </>}
        />

        {sellerOrders.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="ยังไม่มีคำสั่งซื้อ"
              description="เมื่อมีลูกค้าสั่งสินค้า\r\n              รายการจะแสดงที่นี่"
            />
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {sellerOrders.map((order) => {
              const nextAction = getNextAction(order.status);

              return (
                <section key={order.orderShopId} className="surface p-6">
                  <div className="flex flex-col justify-between gap-6 border-b pb-6 md:flex-row md:items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        คำสั่งซื้อ
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        #{order.orderId}
                      </h2>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {order.createdAt.toLocaleString("th-TH")}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <StatusBadge status={order.status} />

                      {nextAction && (
                        <form action={advanceSellerOrder}>
                          <input
                            type="hidden"
                            name="orderShopId"
                            value={order.orderShopId}
                          />

                          <input
                            type="hidden"
                            name="nextStatus"
                            value={nextAction.status}
                          />

                          <SubmitButton
                            type="submit"
                            variant="primary"
                            className=""
                          >
                            {nextAction.label}
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-bold">รายการสินค้า</h3>

                    <div className="mt-4 space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-5 border-b pb-4 last:border-0"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              ฿{item.price} × {item.quantity}
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
                      <span className="font-medium">ยอดรวมของร้าน</span>

                      <span className="text-xl font-bold">
                        ฿
                        {Number(order.subtotal).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-bold">ข้อมูลจัดส่ง</h3>

                    <p className="mt-3">{order.shippingName}</p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.shippingPhone}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {order.shippingAddress}
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

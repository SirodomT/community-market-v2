import Link from "next/link";
import {
  asc,
  eq,
} from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  orderItems,
  orders,
  orderShops,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

const statusLabels: Record<
  OrderStatus,
  string
> = {
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันแล้ว",
  SHIPPED: "จัดส่งแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
};

function getStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";

    case "SHIPPED":
      return "bg-purple-100 text-purple-700";

    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";
  }
}

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

  if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0
  ) {
    notFound();
  }

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,

      username: users.username,
      email: users.email,

      shippingName:
        orders.shippingName,
      shippingPhone:
        orders.shippingPhone,
      shippingAddress:
        orders.shippingAddress,

      totalAmount:
        orders.totalAmount,

      status: orders.status,

      createdAt:
        orders.createdAt,
    })
    .from(orders)
    .innerJoin(
      users,
      eq(
        orders.userId,
        users.id
      )
    )
    .where(
      eq(
        orders.id,
        orderId
      )
    )
    .limit(1);

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(
      eq(
        orderItems.orderId,
        order.id
      )
    )
    .orderBy(
      asc(orderItems.id)
    );

  const shopOrders = await db
    .select()
    .from(orderShops)
    .where(
      eq(
        orderShops.orderId,
        order.id
      )
    )
    .orderBy(
      asc(orderShops.id)
    );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/orders"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← กลับรายการคำสั่งซื้อ
        </Link>

        {/* HEADER */}
        <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div>
              <p className="text-sm text-gray-500">
                Order
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                คำสั่งซื้อ #{order.id}
              </h1>

              <p className="mt-3 text-sm text-gray-500">
                {order.createdAt.toLocaleString(
                  "th-TH"
                )}
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-gray-500">
                สถานะรวม
              </p>

              <span
                className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(
                  order.status as OrderStatus
                )}`}
              >
                {
                  statusLabels[
                    order.status as OrderStatus
                  ]
                }
              </span>
            </div>
          </div>

          {/* CUSTOMER */}
          <div className="mt-8 grid gap-6 border-t pt-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold">
                บัญชีผู้สั่งซื้อ
              </h2>

              <p className="mt-4 font-medium">
                {order.username}
              </p>

              <p className="mt-1 text-gray-500">
                {order.email}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                User #{order.userId}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold">
                ข้อมูลจัดส่ง
              </h2>

              <p className="mt-4 font-medium">
                {order.shippingName}
              </p>

              <p className="mt-1 text-gray-500">
                {order.shippingPhone}
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-500">
                {order.shippingAddress}
              </p>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  วิธีชำระเงิน
                </p>

                <p className="mt-1 font-medium">
                  เก็บเงินปลายทาง
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SHOPS */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold">
            รายการแยกตามร้าน
          </h2>

          {shopOrders.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white p-8 text-gray-500 shadow-sm">
              Order นี้เป็นข้อมูลเก่าที่ไม่มีสถานะแยกร้าน
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {shopOrders.map(
                (shopOrder) => {
                  const shopItems =
                    items.filter(
                      (item) => {
                        if (
                          shopOrder.shopId !==
                            null &&
                          item.shopId !==
                            null
                        ) {
                          return (
                            item.shopId ===
                            shopOrder.shopId
                          );
                        }

                        return (
                          item.shopName ===
                          shopOrder.shopName
                        );
                      }
                    );

                  return (
                    <div
                      key={
                        shopOrder.id
                      }
                      className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm text-gray-500">
                            ร้านค้า
                          </p>

                          <h3 className="mt-1 text-xl font-bold">
                            {
                              shopOrder.shopName
                            }
                          </h3>
                        </div>

                        <span
                          className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(
                            shopOrder.status as OrderStatus
                          )}`}
                        >
                          {
                            statusLabels[
                              shopOrder.status as OrderStatus
                            ]
                          }
                        </span>
                      </div>

                      {/* PRODUCTS */}
                      <div className="mt-5 border-t pt-5">
                        {shopItems.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex justify-between gap-5 border-b py-4 first:pt-0 last:border-0 last:pb-0"
                            >
                              <div>
                                <p className="font-medium">
                                  {
                                    item.productName
                                  }
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  ฿
                                  {Number(
                                    item.price
                                  ).toLocaleString(
                                    "th-TH",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}{" "}
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </p>
                              </div>

                              <p className="font-bold">
                                ฿
                                {Number(
                                  item.subtotal
                                ).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex justify-between border-t pt-5">
                        <span className="font-medium">
                          ยอดรวมร้านนี้
                        </span>

                        <span className="font-bold">
                          ฿
                          {Number(
                            shopOrder.subtotal
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* TOTAL */}
        <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">
              ยอดรวมคำสั่งซื้อ
            </span>

            <span className="text-3xl font-bold">
              ฿
              {Number(
                order.totalAmount
              ).toLocaleString(
                "th-TH",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
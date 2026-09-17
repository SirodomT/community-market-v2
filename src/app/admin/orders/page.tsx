import Link from "next/link";
import {
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
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

export default async function AdminOrdersPage() {
  await requireRole(["ADMIN"]);

  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,

      username: users.username,
      email: users.email,

      shippingName:
        orders.shippingName,
      shippingPhone:
        orders.shippingPhone,

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
    .orderBy(
      desc(orders.createdAt)
    );

  const allShopOrders = await db
    .select({
      id: orderShops.id,
      orderId:
        orderShops.orderId,
      shopName:
        orderShops.shopName,
      subtotal:
        orderShops.subtotal,
      status:
        orderShops.status,
    })
    .from(orderShops);

  const pendingCount =
    allOrders.filter(
      (order) =>
        order.status === "PENDING"
    ).length;

  const completedCount =
    allOrders.filter(
      (order) =>
        order.status ===
        "COMPLETED"
    ).length;

  const cancelledCount =
    allOrders.filter(
      (order) =>
        order.status ===
        "CANCELLED"
    ).length;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← กลับ Admin Dashboard
          </Link>

          <h1 className="mt-5 text-4xl font-bold">
            คำสั่งซื้อทั้งหมด
          </h1>

          <p className="mt-3 text-gray-500">
            ตรวจสอบคำสั่งซื้อ ลูกค้า ร้านค้า และสถานะการจัดส่ง
          </p>
        </div>

        {/* STATS */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              คำสั่งซื้อทั้งหมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {allOrders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              รอดำเนินการ
            </p>

            <p className="mt-3 text-4xl font-bold">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              สำเร็จ
            </p>

            <p className="mt-3 text-4xl font-bold">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ยกเลิก
            </p>

            <p className="mt-3 text-4xl font-bold">
              {cancelledCount}
            </p>
          </div>
        </section>

        {/* ORDERS */}
        <section className="mt-10 space-y-5">
          {allOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
              ยังไม่มีคำสั่งซื้อในระบบ
            </div>
          ) : (
            allOrders.map((order) => {
              const shopsForOrder =
                allShopOrders.filter(
                  (shopOrder) =>
                    shopOrder.orderId ===
                    order.id
                );

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row">
                    {/* LEFT */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          Order #{order.id}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-2 text-xs font-medium ${getStatusClass(
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

                      <p className="mt-3 text-sm text-gray-500">
                        {order.createdAt.toLocaleString(
                          "th-TH"
                        )}
                      </p>

                      <div className="mt-5">
                        <p className="text-sm text-gray-500">
                          ผู้สั่งซื้อ
                        </p>

                        <p className="mt-1 font-medium">
                          {order.username}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {order.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          User #{order.userId}
                        </p>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm text-gray-500">
                          ผู้รับสินค้า
                        </p>

                        <p className="mt-1 font-medium">
                          {order.shippingName}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {order.shippingPhone}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="lg:text-right">
                      <p className="text-sm text-gray-500">
                        ยอดรวม
                      </p>

                      <p className="mt-2 text-3xl font-bold">
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
                      </p>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="mt-5 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>

                  {/* SHOP STATUS */}
                  <div className="mt-6 border-t pt-6">
                    <p className="font-medium">
                      ร้านค้าในคำสั่งซื้อ
                    </p>

                    {shopsForOrder.length ===
                    0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        Order เก่า ไม่มีข้อมูลสถานะแยกร้าน
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {shopsForOrder.map(
                          (shopOrder) => (
                            <div
                              key={
                                shopOrder.id
                              }
                              className="rounded-xl border border-gray-200 px-4 py-3"
                            >
                              <p className="text-sm font-medium">
                                {
                                  shopOrder.shopName
                                }
                              </p>

                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                    shopOrder.status as OrderStatus
                                  )}`}
                                >
                                  {
                                    statusLabels[
                                      shopOrder.status as OrderStatus
                                    ]
                                  }
                                </span>

                                <span className="text-xs text-gray-500">
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
                          )
                        )}
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
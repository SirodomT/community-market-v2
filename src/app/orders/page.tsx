import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const statusLabels = {
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันคำสั่งซื้อแล้ว",
  SHIPPED: "จัดส่งแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
} as const;

export default async function OrdersPage() {
  const user = await requireUser();

  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            My Orders
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            คำสั่งซื้อของฉัน
          </h1>

          <p className="mt-3 text-gray-500">
            ตรวจสอบประวัติและสถานะคำสั่งซื้อ
          </p>
        </div>

        {orderList.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              ยังไม่มีคำสั่งซื้อ
            </h2>

            <p className="mt-2 text-gray-500">
              เมื่อสั่งซื้อสินค้า รายการจะแสดงที่นี่
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white"
            >
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orderList.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      คำสั่งซื้อ
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      #{order.id}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      {order.createdAt.toLocaleString("th-TH")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-sm text-gray-500">
                        สถานะ
                      </p>

                      <p className="mt-1 font-medium">
                        {statusLabels[order.status]}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        ยอดรวม
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        ฿
                        {Number(order.totalAmount).toLocaleString(
                          "th-TH",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    <span className="text-gray-400">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
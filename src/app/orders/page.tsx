import { PageHeader } from "@/components/ui/primitives";
import { EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export default async function OrdersPage() {
  const user = await requireUser();

  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="My Orders"
          title={<>คำสั่งซื้อของฉัน</>}
          description={<> ตรวจสอบประวัติและสถานะคำสั่งซื้อ </>}
        />

        {orderList.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="ยังไม่มีคำสั่งซื้อ"
              description="เมื่อสั่งซื้อสินค้า รายการจะแสดงที่นี่"
              href="/products"
              label="เลือกซื้อสินค้า"
            />
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orderList.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block surface p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">คำสั่งซื้อ</p>

                    <h2 className="mt-1 text-xl font-bold">#{order.id}</h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.createdAt.toLocaleString("th-TH")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">สถานะ</p>

                      <StatusBadge status={order.status} />
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ยอดรวม</p>

                      <p className="mt-1 text-xl font-bold">
                        ฿
                        {Number(order.totalAmount).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <span className="text-muted-foreground">→</span>
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

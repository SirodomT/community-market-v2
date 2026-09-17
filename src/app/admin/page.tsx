import Link from "next/link";
import {
  count,
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
  orders,
  products,
  shopRequests,
  shops,
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

export default async function AdminPage() {
  const admin = await requireRole([
    "ADMIN",
  ]);

  const [
  usersResult,
  shopsResult,
  productsResult,
  ordersResult,
  pendingRequestsResult,
] = await Promise.all([
  db
    .select({
      total: count(),
    })
    .from(users),

  db
    .select({
      total: count(),
    })
    .from(shops),

  db
    .select({
      total: count(),
    })
    .from(products),

  db
    .select({
      total: count(),
    })
    .from(orders),

  db
    .select({
      total: count(),
    })
    .from(shopRequests)
    .where(
      eq(
        shopRequests.status,
        "PENDING"
      )
    ),
]);

  const recentOrders = await db
    .select({
      id: orders.id,
      shippingName:
        orders.shippingName,
      totalAmount:
        orders.totalAmount,
      status: orders.status,
      createdAt:
        orders.createdAt,
    })
    .from(orders)
    .orderBy(
      desc(orders.createdAt)
    )
    .limit(5);

  const totalUsers =
  usersResult[0]?.total ?? 0;

const totalShops =
  shopsResult[0]?.total ?? 0;

const totalProducts =
  productsResult[0]?.total ?? 0;

const totalOrders =
  ordersResult[0]?.total ?? 0;

const pendingRequests =
  pendingRequestsResult[0]?.total ?? 0;

const completedOrders = await db
  .select({
    total: count(),
  })
  .from(orders)
  .where(
    eq(
      orders.status,
      "COMPLETED"
    )
  );

const totalCompletedOrders =
  completedOrders[0]?.total ?? 0;

return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Administrator
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-gray-500">
              ยินดีต้อนรับ{" "}
              <span className="font-medium text-black">
                {admin.username}
              </span>
            </p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-gray-100"
          >
            ← กลับหน้าหลัก
          </Link>
        </div>

        {/* STATS */}
        {/* STATS */}
<section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
  {/* USERS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      ผู้ใช้งานทั้งหมด
    </p>

    <p className="mt-3 text-4xl font-bold">
      {totalUsers}
    </p>

    <Link
      href="/admin/users"
      className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
    >
      จัดการผู้ใช้งาน →
    </Link>
  </div>

  {/* SHOPS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      ร้านค้าทั้งหมด
    </p>

    <p className="mt-3 text-4xl font-bold">
      {totalShops}
    </p>

    <Link
      href="/admin/shops"
      className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
    >
      จัดการร้านค้า →
    </Link>
  </div>

  {/* PRODUCTS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      สินค้าทั้งหมด
    </p>

    <p className="mt-3 text-4xl font-bold">
      {totalProducts}
    </p>

    <p className="mt-5 text-sm text-gray-400">
      สินค้าจากร้านค้าทั้งหมด
    </p>
  </div>

  {/* ORDERS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      คำสั่งซื้อทั้งหมด
    </p>

    <p className="mt-3 text-4xl font-bold">
      {totalOrders}
    </p>

    <Link
      href="/admin/orders"
      className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
    >
      ดูคำสั่งซื้อ →
    </Link>
  </div>

  {/* COMPLETED ORDERS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      คำสั่งซื้อสำเร็จ
    </p>

    <p className="mt-3 text-4xl font-bold">
      {totalCompletedOrders}
    </p>

    <p className="mt-5 text-sm text-gray-400">
      ลูกค้ายืนยันรับสินค้าแล้ว
    </p>
  </div>

  {/* SHOP REQUESTS */}
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      คำขอเปิดร้านที่รอตรวจสอบ
    </p>

    <p className="mt-3 text-4xl font-bold">
      {pendingRequests}
    </p>

    <Link
      href="/admin/shop-requests"
      className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
    >
      ตรวจสอบคำขอ →
    </Link>
  </div>
</section>

        {/* MANAGEMENT */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            จัดการระบบ
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">
                ผู้ใช้งาน
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                ตรวจสอบบัญชี Role และสถานะผู้ใช้งาน
              </p>
            </Link>

            <Link
              href="/admin/shops"
              className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">
                ร้านค้า
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                ตรวจสอบร้านค้าและสถานะการเปิดใช้งาน
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">
                คำสั่งซื้อ
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                ดูภาพรวมคำสั่งซื้อในระบบ
              </p>
            </Link>

            <Link
              href="/admin/shop-requests"
              className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-bold">
                คำขอเปิดร้าน
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                อนุมัติหรือปฏิเสธคำขอจากผู้ใช้งาน
              </p>
            </Link>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                คำสั่งซื้อล่าสุด
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                5 รายการล่าสุดในระบบ
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-medium text-gray-500 hover:text-black"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              ยังไม่มีคำสั่งซื้อ
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-4 font-medium">
                      Order
                    </th>

                    <th className="pb-4 font-medium">
                      ผู้รับ
                    </th>

                    <th className="pb-4 font-medium">
                      ยอดรวม
                    </th>

                    <th className="pb-4 font-medium">
                      สถานะ
                    </th>

                    <th className="pb-4 font-medium">
                      วันที่
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-5 font-medium">
                          #{order.id}
                        </td>

                        <td className="py-5">
                          {
                            order.shippingName
                          }
                        </td>

                        <td className="py-5 font-medium">
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
                        </td>

                        <td className="py-5">
                          <span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-medium">
                            {
                              statusLabels[
                                order.status as OrderStatus
                              ]
                            }
                          </span>
                        </td>

                        <td className="py-5 text-sm text-gray-500">
                          {order.createdAt.toLocaleString(
                            "th-TH"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
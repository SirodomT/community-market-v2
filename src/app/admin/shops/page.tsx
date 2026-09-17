import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  shops,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

import {
  toggleShopStatus,
} from "./actions";

type ShopStatus =
  | "ACTIVE"
  | "INACTIVE";

type UserStatus =
  | "ACTIVE"
  | "SUSPENDED";

const shopStatusLabels: Record<
  ShopStatus,
  string
> = {
  ACTIVE: "เปิดใช้งาน",
  INACTIVE: "ปิดใช้งาน",
};

const userStatusLabels: Record<
  UserStatus,
  string
> = {
  ACTIVE: "ปกติ",
  SUSPENDED: "ถูกระงับ",
};

export default async function AdminShopsPage() {
  await requireRole(["ADMIN"]);

  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description:
        shops.description,
      phone: shops.phone,
      address: shops.address,
      status: shops.status,
      createdAt: shops.createdAt,

      ownerId: users.id,
      ownerUsername:
        users.username,
      ownerEmail: users.email,
      ownerStatus:
        users.status,
    })
    .from(shops)
    .innerJoin(
      users,
      eq(
        shops.ownerId,
        users.id
      )
    )
    .orderBy(
      desc(shops.createdAt)
    );

  const activeCount =
    allShops.filter(
      (shop) =>
        shop.status === "ACTIVE"
    ).length;

  const inactiveCount =
    allShops.filter(
      (shop) =>
        shop.status ===
        "INACTIVE"
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
            จัดการร้านค้า
          </h1>

          <p className="mt-3 text-gray-500">
            ตรวจสอบร้านค้า เจ้าของร้าน และสถานะการเปิดใช้งาน
          </p>
        </div>

        {/* STAT */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ร้านค้าทั้งหมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {allShops.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              เปิดใช้งาน
            </p>

            <p className="mt-3 text-4xl font-bold">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ปิดใช้งาน
            </p>

            <p className="mt-3 text-4xl font-bold">
              {inactiveCount}
            </p>
          </div>
        </section>

        {/* TABLE */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold">
              ร้านค้าในระบบ
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              การปิดร้านจะไม่ลบร้านหรือสินค้าออกจากฐานข้อมูล
            </p>
          </div>

          {allShops.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              ยังไม่มีร้านค้าในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">
                      ID
                    </th>

                    <th className="px-6 py-4 font-medium">
                      ร้านค้า
                    </th>

                    <th className="px-6 py-4 font-medium">
                      เจ้าของร้าน
                    </th>

                    <th className="px-6 py-4 font-medium">
                      ติดต่อ
                    </th>

                    <th className="px-6 py-4 font-medium">
                      สถานะเจ้าของ
                    </th>

                    <th className="px-6 py-4 font-medium">
                      สถานะร้าน
                    </th>

                    <th className="px-6 py-4 font-medium">
                      วันที่เปิดร้าน
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {allShops.map(
                    (shop) => (
                      <tr
                        key={shop.id}
                        className="border-b align-top last:border-0"
                      >
                        <td className="px-6 py-5 text-sm text-gray-500">
                          #{shop.id}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold">
                            {shop.name}
                          </p>

                          <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                            {
                              shop.description
                            }
                          </p>

                          {shop.status ===
                            "ACTIVE" && (
                            <Link
                              href={`/shops/${shop.id}`}
                              className="mt-3 inline-block text-sm font-medium text-gray-500 hover:text-black"
                            >
                              ดูหน้าร้าน →
                            </Link>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium">
                            {
                              shop.ownerUsername
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              shop.ownerEmail
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            User #
                            {
                              shop.ownerId
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm">
                            {shop.phone}
                          </p>

                          <p className="mt-2 max-w-xs whitespace-pre-wrap text-sm leading-6 text-gray-500">
                            {
                              shop.address
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              shop.ownerStatus ===
                              "ACTIVE"
                                ? "rounded-full bg-green-100 px-3 py-2 text-xs font-medium text-green-700"
                                : "rounded-full bg-red-100 px-3 py-2 text-xs font-medium text-red-700"
                            }
                          >
                            {
                              userStatusLabels[
                                shop.ownerStatus as UserStatus
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              shop.status ===
                              "ACTIVE"
                                ? "rounded-full bg-green-100 px-3 py-2 text-xs font-medium text-green-700"
                                : "rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600"
                            }
                          >
                            {
                              shopStatusLabels[
                                shop.status as ShopStatus
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-500">
                          {shop.createdAt.toLocaleString(
                            "th-TH"
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <form
                            action={
                              toggleShopStatus
                            }
                          >
                            <input
                              type="hidden"
                              name="shopId"
                              value={
                                shop.id
                              }
                            />

                            <button
                              type="submit"
                              className={
                                shop.status ===
                                "ACTIVE"
                                  ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  : "rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                              }
                            >
                              {shop.status ===
                              "ACTIVE"
                                ? "ปิดร้าน"
                                : "เปิดร้าน"}
                            </button>
                          </form>
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
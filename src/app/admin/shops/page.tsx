import { Store, ShoppingBag } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { StatCard, EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { shops, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { toggleShopStatus } from "./actions";

export default async function AdminShopsPage() {
  await requireRole(["ADMIN"]);

  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      description: shops.description,
      phone: shops.phone,
      address: shops.address,
      status: shops.status,
      createdAt: shops.createdAt,

      ownerId: users.id,
      ownerUsername: users.username,
      ownerEmail: users.email,
      ownerStatus: users.status,
    })
    .from(shops)
    .innerJoin(users, eq(shops.ownerId, users.id))
    .orderBy(desc(shops.createdAt));

  const activeCount = allShops.filter(
    (shop) => shop.status === "ACTIVE",
  ).length;

  const inactiveCount = allShops.filter(
    (shop) => shop.status === "INACTIVE",
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

          <h1 className="mt-5 text-3xl sm:text-4xl font-bold">จัดการร้านค้า</h1>

          <p className="mt-3 text-muted-foreground">
            ตรวจสอบร้านค้า เจ้าของร้าน และสถานะการเปิดใช้งาน
          </p>
        </div>

        {/* STAT */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="ร้านค้าทั้งหมด"
            value={allShops.length}
            icon={<Store aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="เปิดใช้งาน"
            value={activeCount}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="ปิดใช้งาน"
            value={inactiveCount}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
          />
        </section>

        {/* TABLE */}
        <section className="mt-10 overflow-hidden surface">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold">ร้านค้าในระบบ</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              การปิดร้านจะไม่ลบร้านหรือสินค้าออกจากฐานข้อมูล
            </p>
          </div>

          {allShops.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="ยังไม่มีร้านค้าในระบบ"
                description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
              />
            </div>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-label="ตารางข้อมูล เลื่อนแนวนอนเพื่อดูเพิ่มเติม"
              className="table-scroll"
            >
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr className="border-b bg-background text-sm text-muted-foreground">
                    <th scope="col" className="px-6 py-4 font-medium">
                      ID
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      ร้านค้า
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      เจ้าของร้าน
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      ติดต่อ
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      สถานะเจ้าของ
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      สถานะร้าน
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      วันที่เปิดร้าน
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-4 text-right font-medium"
                    >
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {allShops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="border-b align-top last:border-0"
                    >
                      <td className="px-6 py-5 text-sm text-muted-foreground">
                        #{shop.id}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold">{shop.name}</p>

                        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                          {shop.description}
                        </p>

                        {shop.status === "ACTIVE" && (
                          <Link
                            href={`/shops/${shop.id}`}
                            className="mt-3 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            ดูหน้าร้าน →
                          </Link>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium">{shop.ownerUsername}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {shop.ownerEmail}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          User #{shop.ownerId}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm">{shop.phone}</p>

                        <p className="mt-2 max-w-xs whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {shop.address}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={shop.ownerStatus} />
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={shop.status} />
                      </td>

                      <td className="px-6 py-5 text-sm text-muted-foreground">
                        {shop.createdAt.toLocaleString("th-TH")}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <form action={toggleShopStatus}>
                          <input type="hidden" name="shopId" value={shop.id} />

                          <SubmitButton
                            variant="secondary"
                            type="submit"
                            className={
                              shop.status === "ACTIVE"
                                ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                : "rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                            }
                          >
                            {shop.status === "ACTIVE" ? "ปิดร้าน" : "เปิดร้าน"}
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

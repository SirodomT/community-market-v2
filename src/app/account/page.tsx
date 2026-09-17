import { PageHeader } from "@/components/ui/primitives";
import { ShoppingBag, CircleCheck } from "lucide-react";
import { StatusBadge, StatCard } from "@/components/ui/primitives";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";

type UserRole = "USER" | "SELLER" | "ADMIN";

const roleLabels: Record<UserRole, string> = {
  USER: "ผู้ใช้งาน",
  SELLER: "ผู้ขาย",
  ADMIN: "ผู้ดูแลระบบ",
};

export default async function AccountPage() {
  const user = await requireUser();

  const [allOrdersResult, completedOrdersResult] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(orders)
      .where(eq(orders.userId, user.id)),

    db
      .select({
        total: count(),
      })
      .from(orders)
      .where(and(eq(orders.userId, user.id), eq(orders.status, "COMPLETED"))),
  ]);

  const totalOrders = allOrdersResult[0]?.total ?? 0;

  const completedOrders = completedOrdersResult[0]?.total ?? 0;

  let sellerShop:
    | {
        id: number;
        name: string;
        status: "ACTIVE" | "INACTIVE";
      }
    | undefined;

  if (user.role === "SELLER") {
    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        status: shops.status,
      })
      .from(shops)
      .where(eq(shops.ownerId, user.id))
      .limit(1);

    sellerShop = shop;
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <PageHeader
          eyebrow="Account"
          title={<>บัญชีของฉัน</>}
          description={<> ข้อมูลบัญชีและการใช้งานของคุณ </>}
        />

        {/* PROFILE */}
        <section className="mt-10 surface p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-bold">{user.username}</h2>

                <p className="mt-1 text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
                {roleLabels[user.role as UserRole]}
              </span>

              <StatusBadge status={user.status} />
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Username</p>

              <p className="mt-2 font-medium">{user.username}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email</p>

              <p className="mt-2 font-medium">{user.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Role</p>

              <p className="mt-2 font-medium">
                {roleLabels[user.role as UserRole]}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">สถานะบัญชี</p>

              <StatusBadge status={user.status} />
            </div>
          </div>
        </section>

        {/* ORDER STATS */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          <StatCard
            label="คำสั่งซื้อทั้งหมด"
            value={totalOrders}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
            href="/orders"
          />

          <StatCard
            label="คำสั่งซื้อสำเร็จ"
            value={completedOrders}
            icon={<CircleCheck aria-hidden="true" className="size-5" />}
            description="รายการที่ยืนยันรับสินค้าแล้ว"
          />
        </section>

        {/* ROLE ACTION */}
        <section className="mt-6 surface p-5 sm:p-8">
          <h2 className="text-2xl font-bold">การจัดการ</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              href="/orders"
              className="rounded-xl border border-border p-5 transition hover:bg-background"
            >
              <p className="font-bold">คำสั่งซื้อของฉัน</p>

              <p className="mt-2 text-sm text-muted-foreground">
                ตรวจสอบสถานะและประวัติคำสั่งซื้อ
              </p>
            </Link>

            {user.role === "USER" && (
              <Link
                href="/seller/apply"
                className="rounded-xl border border-border p-5 transition hover:bg-background"
              >
                <p className="font-bold">สมัครเปิดร้าน</p>

                <p className="mt-2 text-sm text-muted-foreground">
                  ส่งคำขอเพื่อสมัครเป็นผู้ขาย
                </p>
              </Link>
            )}

            {user.role === "SELLER" && (
              <>
                <Link
                  href="/seller"
                  className="rounded-xl border border-border p-5 transition hover:bg-background"
                >
                  <p className="font-bold">จัดการร้านค้า</p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    สินค้าและคำสั่งซื้อของร้าน
                  </p>
                </Link>

                {sellerShop && (
                  <Link
                    href={`/shops/${sellerShop.id}`}
                    className="rounded-xl border border-border p-5 transition hover:bg-background"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{sellerShop.name}</p>

                      <span
                        className={
                          sellerShop.status === "ACTIVE"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        }
                      >
                        {sellerShop.status === "ACTIVE"
                          ? "เปิดใช้งาน"
                          : "ปิดใช้งาน"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      ดูหน้าร้านของคุณ
                    </p>
                  </Link>
                )}
              </>
            )}

            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-xl border border-border p-5 transition hover:bg-background"
              >
                <p className="font-bold">ภาพรวมระบบ</p>

                <p className="mt-2 text-sm text-muted-foreground">
                  จัดการข้อมูลและตรวจสอบระบบ
                </p>
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

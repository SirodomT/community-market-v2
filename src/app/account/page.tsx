import Link from "next/link";
import {
  and,
  count,
  eq,
} from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  shops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

type UserRole =
  | "USER"
  | "SELLER"
  | "ADMIN";

type UserStatus =
  | "ACTIVE"
  | "SUSPENDED";

const roleLabels: Record<
  UserRole,
  string
> = {
  USER: "ผู้ใช้งาน",
  SELLER: "ผู้ขาย",
  ADMIN: "ผู้ดูแลระบบ",
};

const statusLabels: Record<
  UserStatus,
  string
> = {
  ACTIVE: "ใช้งานปกติ",
  SUSPENDED: "ถูกระงับ",
};

export default async function AccountPage() {
  const user = await requireUser();

  const [
    allOrdersResult,
    completedOrdersResult,
  ] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(orders)
      .where(
        eq(
          orders.userId,
          user.id
        )
      ),

    db
      .select({
        total: count(),
      })
      .from(orders)
      .where(
        and(
          eq(
            orders.userId,
            user.id
          ),
          eq(
            orders.status,
            "COMPLETED"
          )
        )
      ),
  ]);

  const totalOrders =
    allOrdersResult[0]?.total ?? 0;

  const completedOrders =
    completedOrdersResult[0]?.total ?? 0;

  let sellerShop:
    | {
        id: number;
        name: string;
        status:
          | "ACTIVE"
          | "INACTIVE";
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
      .where(
        eq(
          shops.ownerId,
          user.id
        )
      )
      .limit(1);

    sellerShop = shop;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            บัญชีของฉัน
          </h1>

          <p className="mt-3 text-gray-500">
            ข้อมูลบัญชีและการใช้งานของคุณ
          </p>
        </div>

        {/* PROFILE */}
        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl font-bold text-white">
                {user.username
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {user.username}
                </h2>

                <p className="mt-1 text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                {
                  roleLabels[
                    user.role as UserRole
                  ]
                }
              </span>

              <span
                className={
                  user.status === "ACTIVE"
                    ? "rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700"
                    : "rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700"
                }
              >
                {
                  statusLabels[
                    user.status as UserStatus
                  ]
                }
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t pt-8 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Username
              </p>

              <p className="mt-2 font-medium">
                {user.username}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="mt-2 font-medium">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Role
              </p>

              <p className="mt-2 font-medium">
                {
                  roleLabels[
                    user.role as UserRole
                  ]
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                สถานะบัญชี
              </p>

              <p className="mt-2 font-medium">
                {
                  statusLabels[
                    user.status as UserStatus
                  ]
                }
              </p>
            </div>
          </div>
        </section>

        {/* ORDER STATS */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              คำสั่งซื้อทั้งหมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {totalOrders}
            </p>

            <Link
              href="/orders"
              className="mt-5 inline-block text-sm font-medium text-gray-500 hover:text-black"
            >
              ดูประวัติคำสั่งซื้อ →
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              คำสั่งซื้อสำเร็จ
            </p>

            <p className="mt-3 text-4xl font-bold">
              {completedOrders}
            </p>

            <p className="mt-5 text-sm text-gray-400">
              รายการที่ยืนยันรับสินค้าแล้ว
            </p>
          </div>
        </section>

        {/* ROLE ACTION */}
        <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">
            การจัดการ
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              href="/orders"
              className="rounded-xl border border-gray-200 p-5 transition hover:bg-gray-50"
            >
              <p className="font-bold">
                คำสั่งซื้อของฉัน
              </p>

              <p className="mt-2 text-sm text-gray-500">
                ตรวจสอบสถานะและประวัติคำสั่งซื้อ
              </p>
            </Link>

            {user.role === "USER" && (
              <Link
                href="/seller/apply"
                className="rounded-xl border border-gray-200 p-5 transition hover:bg-gray-50"
              >
                <p className="font-bold">
                  สมัครเปิดร้าน
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  ส่งคำขอเพื่อสมัครเป็นผู้ขาย
                </p>
              </Link>
            )}

            {user.role === "SELLER" && (
              <>
                <Link
                  href="/seller"
                  className="rounded-xl border border-gray-200 p-5 transition hover:bg-gray-50"
                >
                  <p className="font-bold">
                    จัดการร้านค้า
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    สินค้าและคำสั่งซื้อของร้าน
                  </p>
                </Link>

                {sellerShop && (
                  <Link
                    href={`/shops/${sellerShop.id}`}
                    className="rounded-xl border border-gray-200 p-5 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">
                        {sellerShop.name}
                      </p>

                      <span
                        className={
                          sellerShop.status ===
                          "ACTIVE"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        }
                      >
                        {sellerShop.status ===
                        "ACTIVE"
                          ? "เปิดใช้งาน"
                          : "ปิดใช้งาน"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      ดูหน้าร้านของคุณ
                    </p>
                  </Link>
                )}
              </>
            )}

            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-xl border border-gray-200 p-5 transition hover:bg-gray-50"
              >
                <p className="font-bold">
                  Admin Dashboard
                </p>

                <p className="mt-2 text-sm text-gray-500">
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
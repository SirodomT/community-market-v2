import { Users, ShoppingBag, TriangleAlert } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { StatCard, EmptyState, StatusBadge } from "@/components/ui/primitives";
import Link from "next/link";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { toggleUserStatus } from "./actions";

type UserRole = "USER" | "SELLER" | "ADMIN";

const roleLabels: Record<UserRole, string> = {
  USER: "ผู้ใช้งาน",
  SELLER: "ผู้ขาย",
  ADMIN: "ผู้ดูแลระบบ",
};

export default async function AdminUsersPage() {
  const admin = await requireRole(["ADMIN"]);

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const activeCount = allUsers.filter(
    (user) => user.status === "ACTIVE",
  ).length;

  const suspendedCount = allUsers.filter(
    (user) => user.status === "SUSPENDED",
  ).length;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← กลับภาพรวมระบบ
            </Link>

            <h1 className="mt-5 text-3xl sm:text-4xl font-bold">
              จัดการผู้ใช้งาน
            </h1>

            <p className="mt-3 text-muted-foreground">
              ตรวจสอบบัญชี Role และสถานะผู้ใช้งานในระบบ
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            เข้าสู่ระบบเป็น{" "}
            <span className="font-medium text-foreground">
              {admin.username}
            </span>
          </div>
        </div>

        {/* STAT */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="ผู้ใช้งานทั้งหมด"
            value={allUsers.length}
            icon={<Users aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="ใช้งานปกติ"
            value={activeCount}
            icon={<ShoppingBag aria-hidden="true" className="size-5" />}
          />

          <StatCard
            label="ถูกระงับ"
            value={suspendedCount}
            icon={<TriangleAlert aria-hidden="true" className="size-5" />}
          />
        </section>

        {/* USERS */}
        <section className="mt-10 overflow-hidden surface">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold">บัญชีผู้ใช้งาน</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Admin สามารถระงับหรือปลดระงับบัญชี USER และ SELLER ได้
            </p>
          </div>

          {allUsers.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="ไม่พบผู้ใช้งาน"
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
                      ผู้ใช้งาน
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Email
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Role
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      สถานะ
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      สมัครเมื่อ
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
                  {allUsers.map((user) => {
                    const isCurrentAdmin = user.id === admin.id;

                    const isProtected = user.role === "ADMIN";

                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="px-6 py-5 text-sm text-muted-foreground">
                          #{user.id}
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-medium">{user.username}</div>

                          {isCurrentAdmin && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              บัญชีของคุณ
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm">{user.email}</td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-muted px-3 py-2 text-xs font-medium">
                            {roleLabels[user.role as UserRole]}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge status={user.status} />
                        </td>

                        <td className="px-6 py-5 text-sm text-muted-foreground">
                          {user.createdAt.toLocaleString("th-TH")}
                        </td>

                        <td className="px-6 py-5 text-right">
                          {isProtected ? (
                            <span className="text-sm text-muted-foreground">
                              Protected
                            </span>
                          ) : (
                            <form action={toggleUserStatus}>
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />

                              <SubmitButton
                                variant="secondary"
                                type="submit"
                                className={
                                  user.status === "ACTIVE"
                                    ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    : "rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                                }
                              >
                                {user.status === "ACTIVE"
                                  ? "ระงับบัญชี"
                                  : "ปลดระงับ"}
                              </SubmitButton>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

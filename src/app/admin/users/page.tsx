import Link from "next/link";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import {
  toggleUserStatus,
} from "./actions";

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

export default async function AdminUsersPage() {
  const admin = await requireRole([
    "ADMIN",
  ]);

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
    .orderBy(
      desc(users.createdAt)
    );

  const activeCount =
    allUsers.filter(
      (user) =>
        user.status === "ACTIVE"
    ).length;

  const suspendedCount =
    allUsers.filter(
      (user) =>
        user.status ===
        "SUSPENDED"
    ).length;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-black"
            >
              ← กลับ Admin Dashboard
            </Link>

            <h1 className="mt-5 text-4xl font-bold">
              จัดการผู้ใช้งาน
            </h1>

            <p className="mt-3 text-gray-500">
              ตรวจสอบบัญชี Role และสถานะผู้ใช้งานในระบบ
            </p>
          </div>

          <div className="text-sm text-gray-500">
            เข้าสู่ระบบเป็น{" "}
            <span className="font-medium text-black">
              {admin.username}
            </span>
          </div>
        </div>

        {/* STAT */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ผู้ใช้งานทั้งหมด
            </p>

            <p className="mt-3 text-4xl font-bold">
              {allUsers.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ใช้งานปกติ
            </p>

            <p className="mt-3 text-4xl font-bold">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              ถูกระงับ
            </p>

            <p className="mt-3 text-4xl font-bold">
              {suspendedCount}
            </p>
          </div>
        </section>

        {/* USERS */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold">
              บัญชีผู้ใช้งาน
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Admin สามารถระงับหรือปลดระงับบัญชี USER และ SELLER ได้
            </p>
          </div>

          {allUsers.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              ไม่พบผู้ใช้งาน
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">
                      ID
                    </th>

                    <th className="px-6 py-4 font-medium">
                      ผู้ใช้งาน
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Email
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Role
                    </th>

                    <th className="px-6 py-4 font-medium">
                      สถานะ
                    </th>

                    <th className="px-6 py-4 font-medium">
                      สมัครเมื่อ
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {allUsers.map(
                    (user) => {
                      const isCurrentAdmin =
                        user.id ===
                        admin.id;

                      const isProtected =
                        user.role ===
                        "ADMIN";

                      return (
                        <tr
                          key={user.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-6 py-5 text-sm text-gray-500">
                            #{user.id}
                          </td>

                          <td className="px-6 py-5">
                            <div className="font-medium">
                              {
                                user.username
                              }
                            </div>

                            {isCurrentAdmin && (
                              <p className="mt-1 text-xs text-gray-400">
                                บัญชีของคุณ
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-5 text-sm">
                            {user.email}
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-medium">
                              {
                                roleLabels[
                                  user.role as UserRole
                                ]
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={
                                user.status ===
                                "ACTIVE"
                                  ? "rounded-full bg-green-100 px-3 py-2 text-xs font-medium text-green-700"
                                  : "rounded-full bg-red-100 px-3 py-2 text-xs font-medium text-red-700"
                              }
                            >
                              {
                                statusLabels[
                                  user.status as UserStatus
                                ]
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {user.createdAt.toLocaleString(
                              "th-TH"
                            )}
                          </td>

                          <td className="px-6 py-5 text-right">
                            {isProtected ? (
                              <span className="text-sm text-gray-400">
                                Protected
                              </span>
                            ) : (
                              <form
                                action={
                                  toggleUserStatus
                                }
                              >
                                <input
                                  type="hidden"
                                  name="userId"
                                  value={
                                    user.id
                                  }
                                />

                                <button
                                  type="submit"
                                  className={
                                    user.status ===
                                    "ACTIVE"
                                      ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                      : "rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                                  }
                                >
                                  {user.status ===
                                  "ACTIVE"
                                    ? "ระงับบัญชี"
                                    : "ปลดระงับ"}
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    }
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
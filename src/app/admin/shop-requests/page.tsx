import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  shopRequests,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

import {
  approveShopRequest,
  rejectShopRequest,
} from "./actions";

export default async function ShopRequestsPage() {
  await requireRole(["ADMIN"]);

  const requests = await db
    .select({
      id: shopRequests.id,

      shopName: shopRequests.shopName,
      description: shopRequests.description,
      phone: shopRequests.phone,
      address: shopRequests.address,

      status: shopRequests.status,
      createdAt: shopRequests.createdAt,

      userId: users.id,
      username: users.username,
      email: users.email,
    })
    .from(shopRequests)
    .innerJoin(
      users,
      eq(shopRequests.userId, users.id)
    )
    .orderBy(
      desc(shopRequests.createdAt)
    );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            คำขอเปิดร้าน
          </h1>

          <p className="mt-2 text-gray-500">
            ตรวจสอบคำขอเปิดร้านจากผู้ใช้งาน
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              ยังไม่มีคำขอเปิดร้าน
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-6 md:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {request.shopName}
                      </h2>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-4 leading-7 text-gray-600">
                      {request.description}
                    </p>

                    <div className="mt-6 space-y-2 text-sm">
                      <p>
                        <strong>ผู้สมัคร:</strong>{" "}
                        {request.username}
                      </p>

                      <p>
                        <strong>อีเมล:</strong>{" "}
                        {request.email}
                      </p>

                      <p>
                        <strong>เบอร์โทร:</strong>{" "}
                        {request.phone}
                      </p>

                      <p>
                        <strong>ที่อยู่:</strong>{" "}
                        {request.address}
                      </p>
                    </div>
                  </div>

                  {request.status === "PENDING" && (
                    <div className="flex min-w-[180px] flex-col gap-3">
                      <form action={approveShopRequest}>
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                        >
                          อนุมัติ
                        </button>
                      </form>

                      <form action={rejectShopRequest}>
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-lg border border-gray-300 px-5 py-3 font-medium hover:bg-gray-100"
                        >
                          ปฏิเสธ
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
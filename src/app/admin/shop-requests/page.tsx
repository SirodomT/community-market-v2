import { PageHeader } from "@/components/ui/primitives";
import SubmitButton from "@/components/ui/submit-button";
import { EmptyState, StatusBadge } from "@/components/ui/primitives";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { shopRequests, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

import { approveShopRequest, rejectShopRequest } from "./actions";

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
    .innerJoin(users, eq(shopRequests.userId, users.id))
    .orderBy(desc(shopRequests.createdAt));

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Administration"
          title={<>คำขอเปิดร้าน</>}
          description={<> ตรวจสอบคำขอเปิดร้านจากผู้ใช้งาน </>}
        />

        {requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="ยังไม่มีคำขอเปิดร้าน"
              description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
            />
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="surface p-6">
                <div className="flex flex-col justify-between gap-6 md:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{request.shopName}</h2>

                      <StatusBadge status={request.status} />
                    </div>

                    <p className="mt-4 leading-7 text-muted-foreground">
                      {request.description}
                    </p>

                    <div className="mt-6 space-y-2 text-sm">
                      <p>
                        <strong>ผู้สมัคร:</strong> {request.username}
                      </p>

                      <p>
                        <strong>อีเมล:</strong> {request.email}
                      </p>

                      <p>
                        <strong>เบอร์โทร:</strong> {request.phone}
                      </p>

                      <p>
                        <strong>ที่อยู่:</strong> {request.address}
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

                        <SubmitButton
                          type="submit"
                          variant="primary"
                          className="w-full"
                        >
                          อนุมัติ
                        </SubmitButton>
                      </form>

                      <form action={rejectShopRequest}>
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />

                        <SubmitButton
                          type="submit"
                          variant="secondary"
                          className="w-full"
                        >
                          ปฏิเสธ
                        </SubmitButton>
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

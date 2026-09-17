import SubmitButton from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/primitives";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { submitShopRequest } from "./actions";

export default async function SellerApplyPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const user = await requireUser();

  if (user.role === "SELLER" || user.role === "ADMIN") {
    redirect("/seller");
  }

  const params = await searchParams;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-2xl surface p-5 sm:p-8">
        <h1 className="text-3xl font-bold">สมัครเปิดร้านค้า</h1>

        <p className="mt-2 text-muted-foreground">
          ส่งข้อมูลร้านค้าเพื่อให้ผู้ดูแลระบบตรวจสอบ
        </p>

        {params.success === "1" && (
          <p className="mt-6 rounded-lg bg-green-100 p-4 text-green-700">
            ส่งคำขอเปิดร้านเรียบร้อยแล้ว
          </p>
        )}

        {params.error === "missing" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {params.error === "name" && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            ชื่อร้านต้องมีอย่างน้อย 3 ตัวอักษร
          </p>
        )}

        {params.error === "pending" && (
          <p className="mt-6 rounded-lg bg-yellow-100 p-4 text-yellow-700">
            คุณมีคำขอเปิดร้านที่กำลังรอตรวจสอบอยู่แล้ว
          </p>
        )}

        <form action={submitShopRequest} className="mt-8 space-y-5">
          <div>
            <label htmlFor="shopName" className="field-label">
              ชื่อร้าน
            </label>

            <Input
              id="shopName"
              name="shopName"
              type="text"
              required
              minLength={3}
              placeholder="กรอกชื่อร้าน"
              className=""
            />
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              รายละเอียดร้าน
            </label>

            <Textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="อธิบายเกี่ยวกับร้านและสินค้าของคุณ"
              className="resize-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="field-label">
              เบอร์โทรศัพท์
            </label>

            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="08xxxxxxxx"
              className=""
            />
          </div>

          <div>
            <label htmlFor="address" className="field-label">
              ที่อยู่ร้าน
            </label>

            <Textarea
              id="address"
              name="address"
              required
              rows={4}
              placeholder="กรอกที่อยู่ร้าน"
              className="resize-none"
            />
          </div>

          <SubmitButton type="submit" variant="primary" className="w-full">
            ส่งคำขอเปิดร้าน
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}

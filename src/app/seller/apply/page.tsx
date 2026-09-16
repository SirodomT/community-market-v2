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
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          สมัครเปิดร้านค้า
        </h1>

        <p className="mt-2 text-gray-500">
          ส่งข้อมูลร้านค้าเพื่อให้ผู้ดูแลระบบตรวจสอบ
        </p>

        {params.success === "1" && (
          <p className="mt-6 rounded-lg bg-green-100 p-4 text-green-700">
            ส่งคำขอเปิดร้านเรียบร้อยแล้ว
          </p>
        )}

        {params.error === "missing" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {params.error === "name" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
            ชื่อร้านต้องมีอย่างน้อย 3 ตัวอักษร
          </p>
        )}

        {params.error === "pending" && (
          <p className="mt-6 rounded-lg bg-yellow-100 p-4 text-yellow-700">
            คุณมีคำขอเปิดร้านที่กำลังรอตรวจสอบอยู่แล้ว
          </p>
        )}

        <form
          action={submitShopRequest}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="shopName"
              className="mb-2 block font-medium"
            >
              ชื่อร้าน
            </label>

            <input
              id="shopName"
              name="shopName"
              type="text"
              required
              minLength={3}
              placeholder="กรอกชื่อร้าน"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block font-medium"
            >
              รายละเอียดร้าน
            </label>

            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="อธิบายเกี่ยวกับร้านและสินค้าของคุณ"
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block font-medium"
            >
              เบอร์โทรศัพท์
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="08xxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block font-medium"
            >
              ที่อยู่ร้าน
            </label>

            <textarea
              id="address"
              name="address"
              required
              rows={4}
              placeholder="กรอกที่อยู่ร้าน"
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            ส่งคำขอเปิดร้าน
          </button>
        </form>
      </div>
    </main>
  );
}
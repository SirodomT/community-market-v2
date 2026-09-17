import Link from "next/link";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  cartItems,
  products,
  shops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

import { checkout } from "./actions";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const user = await requireUser();

  const query = await searchParams;

  const items = await db
    .select({
      quantity: cartItems.quantity,

      productId: products.id,
      productName: products.name,
      price: products.price,
      stock: products.stock,

      productStatus: products.status,

      shopName: shops.name,
      shopStatus: shops.status,
    })
    .from(cartItems)
    .innerJoin(
      products,
      eq(
        cartItems.productId,
        products.id
      )
    )
    .innerJoin(
      shops,
      eq(
        products.shopId,
        shops.id
      )
    )
    .where(
      eq(
        cartItems.userId,
        user.id
      )
    );

  /*
   * ไม่มีสินค้าในตะกร้า
   */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-14 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
            🛒
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            ไม่มีสินค้าในตะกร้า
          </h1>

          <p className="mt-2 text-gray-500">
            กรุณาเลือกสินค้าก่อนดำเนินการสั่งซื้อ
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            เลือกซื้อสินค้า
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ยอดรวม
   */
  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

  /*
   * จำนวนสินค้าทั้งหมด
   */
  const totalItems = items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  /*
   * เช็กก่อนแสดงปุ่ม Checkout
   *
   * Server Action ต้องตรวจซ้ำอีกครั้งอยู่ดี
   * ส่วนนี้มีไว้ช่วย UX
   */
  const hasUnavailableItems =
    items.some(
      (item) =>
        item.productStatus !==
          "ACTIVE" ||
        item.shopStatus !==
          "ACTIVE" ||
        item.stock <= 0 ||
        item.quantity >
          item.stock
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {/* BACK */}
        <Link
          href="/cart"
          className="text-sm font-medium text-gray-500 transition hover:text-black"
        >
          ← กลับตะกร้า
        </Link>

        {/* HEADER */}
        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            ยืนยันคำสั่งซื้อ
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            ตรวจสอบรายการสินค้าและกรอกข้อมูลสำหรับจัดส่ง
          </p>
        </div>

        {/* ERROR */}
        {query.error === "missing" && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base">
            กรุณากรอกข้อมูลจัดส่งให้ครบ
          </div>
        )}

        {query.error === "stock" && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base">
            สินค้าบางรายการมีจำนวนคงเหลือไม่เพียงพอ
            กรุณาตรวจสอบตะกร้าอีกครั้ง
          </div>
        )}

        {query.error ===
          "unavailable" && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base">
            สินค้าบางรายการไม่พร้อมจำหน่ายแล้ว
            กรุณาตรวจสอบตะกร้าอีกครั้ง
          </div>
        )}

        {/* CONTENT */}
        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          {/* SHIPPING FORM */}
          <form
            action={checkout}
            className="h-fit rounded-2xl bg-white p-5 shadow-sm sm:p-7"
          >
            <div>
              <h2 className="text-2xl font-bold">
                ข้อมูลจัดส่ง
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน
              </p>
            </div>

            <div className="mt-7 space-y-6">
              {/* NAME */}
              <div>
                <label
                  htmlFor="shippingName"
                  className="mb-2 block text-sm font-medium"
                >
                  ชื่อผู้รับ
                </label>

                <input
                  id="shippingName"
                  name="shippingName"
                  type="text"
                  required
                  autoComplete="name"
                  defaultValue={
                    user.username
                  }
                  placeholder="ชื่อ-นามสกุล ผู้รับสินค้า"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="shippingPhone"
                  className="mb-2 block text-sm font-medium"
                >
                  เบอร์โทรศัพท์
                </label>

                <input
                  id="shippingPhone"
                  name="shippingPhone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="เช่น 0812345678"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label
                  htmlFor="shippingAddress"
                  className="mb-2 block text-sm font-medium"
                >
                  ที่อยู่จัดส่ง
                </label>

                <textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  required
                  autoComplete="street-address"
                  rows={5}
                  placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 leading-7 outline-none transition focus:border-black"
                />
              </div>

              {/* PAYMENT */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                    ฿
                  </div>

                  <div>
                    <p className="font-bold">
                      วิธีชำระเงิน
                    </p>

                    <p className="mt-1 font-medium">
                      เก็บเงินปลายทาง
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      ชำระเงินเมื่อได้รับสินค้า
                      ระบบเวอร์ชัน Beta ยังไม่รองรับการชำระเงินออนไลน์
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* UNAVAILABLE WARNING */}
            {hasUnavailableItems && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-600">
                มีสินค้าบางรายการไม่พร้อมจำหน่าย
                หรือมีจำนวนมากกว่าสต็อกที่เหลือ
                กรุณากลับไปตรวจสอบตะกร้าก่อน
              </div>
            )}

            {/* SUBMIT */}
            {hasUnavailableItems ? (
              <div className="mt-7 w-full cursor-not-allowed rounded-xl bg-gray-200 px-6 py-3.5 text-center font-medium text-gray-500">
                ยังไม่สามารถยืนยันคำสั่งซื้อได้
              </div>
            ) : (
              <button
                type="submit"
                className="mt-7 w-full rounded-xl bg-black px-6 py-3.5 font-medium text-white transition hover:bg-gray-800"
              >
                ยืนยันคำสั่งซื้อ
              </button>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-gray-400">
              เมื่อยืนยันคำสั่งซื้อ
              สินค้าจะถูกหักออกจากสต็อกตามจำนวนที่สั่ง
            </p>
          </form>

          {/* SUMMARY */}
          <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold">
              สรุปคำสั่งซื้อ
            </h2>

            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>
                {items.length} รายการ
              </span>

              <span>
                {totalItems} ชิ้น
              </span>
            </div>

            {/* PRODUCTS */}
            <div className="mt-6 space-y-5">
              {items.map((item) => {
                const subtotal =
                  Number(
                    item.price
                  ) *
                  item.quantity;

                const available =
                  item.productStatus ===
                    "ACTIVE" &&
                  item.shopStatus ===
                    "ACTIVE" &&
                  item.stock > 0 &&
                  item.quantity <=
                    item.stock;

                return (
                  <div
                    key={
                      item.productId
                    }
                    className="border-b pb-5 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-medium">
                          {
                            item.productName
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          ร้าน{" "}
                          {
                            item.shopName
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          ฿
                          {Number(
                            item.price
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          ×{" "}
                          {
                            item.quantity
                          }
                        </p>

                        {!available && (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            ไม่พร้อมจำหน่าย
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 font-bold">
                        ฿
                        {subtotal.toLocaleString(
                          "th-TH",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  ยอดรวม
                </span>

                <span className="text-2xl font-bold">
                  ฿
                  {total.toLocaleString(
                    "th-TH",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    การชำระเงิน
                  </span>

                  <span className="font-medium">
                    เก็บเงินปลายทาง
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/cart"
              className="mt-5 block text-center text-sm font-medium text-gray-500 hover:text-black"
            >
              ← แก้ไขตะกร้าสินค้า
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
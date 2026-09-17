import { PageHeader } from "@/components/ui/primitives";
import CommerceSteps from "@/components/CommerceSteps";
import SubmitButton from "@/components/ui/submit-button";
import { Input, Textarea, EmptyState } from "@/components/ui/primitives";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cartItems, products, shops } from "@/db/schema";
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
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(eq(cartItems.userId, user.id));

  /*
   * ไม่มีสินค้าในตะกร้า
   */
  if (items.length === 0) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-3xl surface px-6 py-14 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
            🛒
          </div>

          <h1 className="mt-5 text-2xl font-bold">ไม่มีสินค้าในตะกร้า</h1>

          <p className="mt-2 text-muted-foreground">
            กรุณาเลือกสินค้าก่อนดำเนินการสั่งซื้อ
          </p>

          <Link href="/products" className="btn btn-primary mt-6">
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
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  /*
   * จำนวนสินค้าทั้งหมด
   */
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  /*
   * เช็กก่อนแสดงปุ่ม Checkout
   *
   * Server Action ต้องตรวจซ้ำอีกครั้งอยู่ดี
   * ส่วนนี้มีไว้ช่วย UX
   */
  const hasUnavailableItems = items.some(
    (item) =>
      item.productStatus !== "ACTIVE" ||
      item.shopStatus !== "ACTIVE" ||
      item.stock <= 0 ||
      item.quantity > item.stock,
  );

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <CommerceSteps step="checkout" />
        {/* BACK */}
        <Link
          href="/cart"
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← กลับตะกร้า
        </Link>

        {/* HEADER */}
        <PageHeader
          eyebrow="Checkout"
          title={<>ยืนยันคำสั่งซื้อ</>}
          description={<> ตรวจสอบรายการสินค้าและกรอกข้อมูลสำหรับจัดส่ง </>}
        />

        {/* ERROR */}
        {query.error === "missing" && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base"
          >
            กรุณากรอกข้อมูลจัดส่งให้ครบ
          </div>
        )}

        {query.error === "stock" && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base"
          >
            สินค้าบางรายการมีจำนวนคงเหลือไม่เพียงพอ กรุณาตรวจสอบตะกร้าอีกครั้ง
          </div>
        )}

        {query.error === "unavailable" && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base"
          >
            สินค้าบางรายการไม่พร้อมจำหน่ายแล้ว กรุณาตรวจสอบตะกร้าอีกครั้ง
          </div>
        )}

        {/* CONTENT */}
        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          {/* SHIPPING FORM */}
          <form action={checkout} className="h-fit surface p-5 sm:p-7">
            <div>
              <h2 className="text-2xl font-bold">ข้อมูลจัดส่ง</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน
              </p>
            </div>

            <div className="mt-7 space-y-6">
              {/* NAME */}
              <div>
                <label htmlFor="shippingName" className="field-label">
                  ชื่อผู้รับ
                </label>

                <Input
                  id="shippingName"
                  name="shippingName"
                  type="text"
                  required
                  autoComplete="name"
                  defaultValue={user.username}
                  placeholder="ชื่อ-นามสกุล ผู้รับสินค้า"
                  className=""
                />
              </div>

              {/* PHONE */}
              <div>
                <label htmlFor="shippingPhone" className="field-label">
                  เบอร์โทรศัพท์
                </label>

                <Input
                  id="shippingPhone"
                  name="shippingPhone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="เช่น 0812345678"
                  className=""
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label htmlFor="shippingAddress" className="field-label">
                  ที่อยู่จัดส่ง
                </label>

                <Textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  required
                  autoComplete="street-address"
                  rows={5}
                  placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="resize-none leading-7"
                />
              </div>

              {/* PAYMENT */}
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                    ฿
                  </div>

                  <div>
                    <p className="font-bold">วิธีชำระเงิน</p>

                    <p className="mt-1 font-medium">เก็บเงินปลายทาง</p>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      ชำระเงินเมื่อได้รับสินค้า
                      เก็บเงินปลายทางสำหรับคำสั่งซื้อนี้
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* UNAVAILABLE WARNING */}
            {hasUnavailableItems && (
              <div
                role="alert"
                className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-600"
              >
                มีสินค้าบางรายการไม่พร้อมจำหน่าย หรือมีจำนวนมากกว่าสต็อกที่เหลือ
                กรุณากลับไปตรวจสอบตะกร้าก่อน
              </div>
            )}

            {/* Total remains visible immediately before confirmation on every screen. */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
              <span className="font-medium">ยอดรวม ({totalItems} ชิ้น)</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                ฿
                {total.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {/* SUBMIT */}
            {hasUnavailableItems ? (
              <div className="mt-6">
                <EmptyState
                  title="ยังไม่สามารถยืนยันคำสั่งซื้อได้"
                  description="ข้อมูลจะแสดงที่นี่เมื่อมีรายการใหม่"
                />
              </div>
            ) : (
              <SubmitButton
                type="submit"
                variant="primary"
                className="mt-7 w-full"
              >
                ยืนยันคำสั่งซื้อ
              </SubmitButton>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              เมื่อยืนยันคำสั่งซื้อ โปรดตรวจสอบที่อยู่จัดส่งและยอดรวมให้ถูกต้อง
            </p>
          </form>

          {/* SUMMARY */}
          <aside className="h-fit surface p-5 sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold">สรุปคำสั่งซื้อ</h2>

            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{items.length} รายการ</span>

              <span>{totalItems} ชิ้น</span>
            </div>

            {/* PRODUCTS */}
            <div className="mt-6 space-y-5">
              {items.map((item) => {
                const subtotal = Number(item.price) * item.quantity;

                const available =
                  item.productStatus === "ACTIVE" &&
                  item.shopStatus === "ACTIVE" &&
                  item.stock > 0 &&
                  item.quantity <= item.stock;

                return (
                  <div
                    key={item.productId}
                    className="border-b pb-5 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-medium">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          ร้าน {item.shopName}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          ฿
                          {Number(item.price).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          × {item.quantity}
                        </p>

                        {!available && (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            ไม่พร้อมจำหน่าย
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 font-bold">
                        ฿
                        {subtotal.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">ยอดรวม</span>

                <span className="text-2xl font-bold">
                  ฿
                  {total.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-background p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">การชำระเงิน</span>

                  <span className="font-medium">เก็บเงินปลายทาง</span>
                </div>
              </div>
            </div>

            <Link
              href="/cart"
              className="mt-5 block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← แก้ไขตะกร้าสินค้า
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  cartItems,
  products,
  shops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

import {
  changeCartQuantity,
  removeCartItem,
} from "./actions";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser();

  const query = await searchParams;

  const items = await db
    .select({
      cartItemId: cartItems.id,
      quantity: cartItems.quantity,

      productId: products.id,
      productName: products.name,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
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
    )
    .orderBy(
      desc(cartItems.createdAt)
    );

  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

  const totalItems = items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

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
        {/* HEADER */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            Shopping Cart
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            ตะกร้าสินค้า
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            ตรวจสอบสินค้าก่อนดำเนินการสั่งซื้อ
          </p>
        </div>

        {/* SUCCESS */}
        {query.added === "1" && (
          <div className="mt-6 rounded-xl bg-green-100 p-4 text-sm text-green-700 sm:text-base">
            เพิ่มสินค้าลงตะกร้าแล้ว
          </div>
        )}

        {/* STOCK ERROR */}
        {query.error ===
          "stock" && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-sm text-red-700 sm:text-base">
            ไม่สามารถเพิ่มจำนวนได้
            เนื่องจากสินค้าในสต็อกไม่เพียงพอ
          </div>
        )}

        {items.length === 0 ? (
          /* EMPTY CART */
          <div className="mt-8 rounded-2xl bg-white px-6 py-14 text-center shadow-sm sm:mt-10 sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              🛒
            </div>

            <h2 className="mt-5 text-xl font-bold">
              ตะกร้าของคุณยังว่าง
            </h2>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              เลือกสินค้าที่สนใจแล้วเพิ่มลงตะกร้า
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            {/* CART ITEMS */}
            <section className="min-w-0 space-y-4">
              {items.map(
                (item) => {
                  const available =
                    item.productStatus ===
                      "ACTIVE" &&
                    item.shopStatus ===
                      "ACTIVE" &&
                    item.stock > 0;

                  const enoughStock =
                    item.quantity <=
                    item.stock;

                  const subtotal =
                    Number(
                      item.price
                    ) *
                    item.quantity;

                  return (
                    <article
                      key={
                        item.cartItemId
                      }
                      className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                        {/* IMAGE */}
                        <Link
                          href={`/products/${item.productId}`}
                          className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-44"
                        >
                          {item.imageUrl ? (
                            <img
                              src={
                                item.imageUrl
                              }
                              alt={
                                item.productName
                              }
                              className="h-full w-full object-cover transition hover:scale-105"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">
                              ไม่มีรูป
                            </span>
                          )}
                        </Link>

                        {/* DETAIL */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-sm text-gray-500">
                            ร้าน{" "}
                            {
                              item.shopName
                            }
                          </p>

                          <Link
                            href={`/products/${item.productId}`}
                            className="mt-1 line-clamp-2 text-lg font-bold hover:underline sm:text-xl"
                          >
                            {
                              item.productName
                            }
                          </Link>

                          {!available && (
                            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                              สินค้านี้ไม่พร้อมจำหน่าย
                            </p>
                          )}

                          {available &&
                            !enoughStock && (
                              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                จำนวนสินค้าในตะกร้ามากกว่าสต็อกที่เหลือ
                              </p>
                            )}

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <p className="font-medium">
                              ฿
                              {Number(
                                item.price
                              ).toLocaleString(
                                "th-TH",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>

                            <span className="text-xs text-gray-400">
                              คงเหลือ{" "}
                              {
                                item.stock
                              }{" "}
                              ชิ้น
                            </span>
                          </div>

                          {/* CONTROL */}
                          <div className="mt-5 flex flex-col gap-4 border-t pt-4 sm:mt-auto sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="mb-2 text-xs text-gray-400">
                                จำนวน
                              </p>

                              <div className="flex items-center gap-2">
                                <form
                                  action={
                                    changeCartQuantity
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="cartItemId"
                                    value={
                                      item.cartItemId
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="action"
                                    value="decrease"
                                  />

                                  <button
                                    type="submit"
                                    disabled={
                                      item.quantity <=
                                      1
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    −
                                  </button>
                                </form>

                                <span className="min-w-10 text-center font-semibold">
                                  {
                                    item.quantity
                                  }
                                </span>

                                <form
                                  action={
                                    changeCartQuantity
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="cartItemId"
                                    value={
                                      item.cartItemId
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="action"
                                    value="increase"
                                  />

                                  <button
                                    type="submit"
                                    disabled={
                                      !available ||
                                      item.quantity >=
                                        item.stock
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    +
                                  </button>
                                </form>
                              </div>
                            </div>

                            <div className="flex items-end justify-between gap-5 sm:block sm:text-right">
                              <div>
                                <p className="text-xs text-gray-400">
                                  รวม
                                </p>

                                <p className="mt-1 text-lg font-bold">
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

                              <form
                                action={
                                  removeCartItem
                                }
                                className="sm:mt-2"
                              >
                                <input
                                  type="hidden"
                                  name="cartItemId"
                                  value={
                                    item.cartItemId
                                  }
                                />

                                <button
                                  type="submit"
                                  className="text-sm font-medium text-red-600 hover:underline"
                                >
                                  ลบออก
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>

            {/* ORDER SUMMARY */}
            <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold">
                สรุปคำสั่งซื้อ
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    จำนวนสินค้า
                  </span>

                  <span className="font-medium text-black">
                    {totalItems} ชิ้น
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    จำนวนรายการ
                  </span>

                  <span className="font-medium text-black">
                    {
                      items.length
                    }{" "}
                    รายการ
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between border-t pt-5">
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

              {hasUnavailableItems ? (
                <>
                  <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-600">
                    มีสินค้าบางรายการที่ไม่พร้อมจำหน่ายหรือมีจำนวนเกินสต็อก
                    กรุณาตรวจสอบก่อนสั่งซื้อ
                  </div>

                  <div className="mt-4 block w-full cursor-not-allowed rounded-xl bg-gray-200 px-5 py-3 text-center font-medium text-gray-500">
                    ยังไม่สามารถสั่งซื้อได้
                  </div>
                </>
              ) : (
                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-xl bg-black px-5 py-3.5 text-center font-medium text-white transition hover:bg-gray-800"
                >
                  ดำเนินการสั่งซื้อ
                </Link>
              )}

              <Link
                href="/products"
                className="mt-4 block text-center text-sm text-gray-500 hover:text-black"
              >
                ← เลือกซื้อสินค้าต่อ
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
"use server";

import {
  and,
  eq,
  gte,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  cartItems,
  orderItems,
  orders,
  orderShops,
  products,
  shops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function checkout(
  formData: FormData
) {
  const user = await requireUser();

  const shippingName = formData
    .get("shippingName")
    ?.toString()
    .trim();

  const shippingPhone = formData
    .get("shippingPhone")
    ?.toString()
    .trim();

  const shippingAddress = formData
    .get("shippingAddress")
    ?.toString()
    .trim();

  // ตรวจข้อมูลจัดส่ง
  if (
    !shippingName ||
    !shippingPhone ||
    !shippingAddress
  ) {
    redirect(
      "/checkout?error=missing"
    );
  }

  let orderId: number;

  try {
    orderId = await db.transaction(
      async (tx) => {
        // อ่านตะกร้าจาก Database ใหม่
        const items = await tx
          .select({
            cartItemId:
              cartItems.id,

            productId:
              products.id,

            shopId:
              shops.id,

            productName:
              products.name,

            shopName:
              shops.name,

            price:
              products.price,

            stock:
              products.stock,

            quantity:
              cartItems.quantity,

            productStatus:
              products.status,

            shopStatus:
              shops.status,
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

        // Cart ว่าง
        if (items.length === 0) {
          throw new Error(
            "CART_EMPTY"
          );
        }

        // ตรวจสินค้า / ร้าน / Stock
        for (const item of items) {
          if (
            item.productStatus !==
              "ACTIVE" ||
            item.shopStatus !==
              "ACTIVE"
          ) {
            throw new Error(
              "PRODUCT_UNAVAILABLE"
            );
          }

          if (
            item.quantity <= 0 ||
            item.quantity >
              item.stock
          ) {
            throw new Error(
              "INSUFFICIENT_STOCK"
            );
          }
        }

        // คำนวณยอดรวม
        const total = items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.price
            ) *
              item.quantity,
          0
        );

        // สร้าง Order
        const insertedOrders =
          await tx
            .insert(orders)
            .values({
              userId:
                user.id,

              shippingName,

              shippingPhone,

              shippingAddress,

              totalAmount:
                total.toFixed(2),
            })
            .returning({ id: orders.id });

        const newOrderId =
          insertedOrders[0]?.id;

        if (!newOrderId) {
          throw new Error(
            "ORDER_CREATE_FAILED"
          );
        }

        // Snapshot สินค้าเข้า order_items
        await tx
          .insert(orderItems)
          .values(
            items.map(
              (item) => ({
                orderId:
                  newOrderId,

                productId:
                  item.productId,

                shopId:
                  item.shopId,

                productName:
                  item.productName,

                shopName:
                  item.shopName,

                price:
                  item.price,

                quantity:
                  item.quantity,

                subtotal: (
                  Number(
                    item.price
                  ) *
                  item.quantity
                ).toFixed(2),
              })
            )
          );

        // รวมยอดแยกตามร้าน
        const shopGroups =
          new Map<
            number,
            {
              shopId: number;
              shopName: string;
              subtotal: number;
            }
          >();

        for (const item of items) {
          const itemSubtotal =
            Number(
              item.price
            ) *
            item.quantity;

          const existing =
            shopGroups.get(
              item.shopId
            );

          if (existing) {
            existing.subtotal +=
              itemSubtotal;
          } else {
            shopGroups.set(
              item.shopId,
              {
                shopId:
                  item.shopId,

                shopName:
                  item.shopName,

                subtotal:
                  itemSubtotal,
              }
            );
          }
        }

        // สร้าง Order แยกร้าน
        // status ไม่ต้องใส่
        // Database จะใช้ default PENDING
        await tx
          .insert(orderShops)
          .values(
            Array.from(
              shopGroups.values()
            ).map(
              (shop) => ({
                orderId:
                  newOrderId,

                shopId:
                  shop.shopId,

                shopName:
                  shop.shopName,

                subtotal:
                  shop.subtotal.toFixed(
                    2
                  ),
              })
            )
          );

        // ตัด Stock
        for (const item of items) {
          const updateResult =
            await tx
              .update(products)
              .set({
                stock: sql`
                  ${products.stock}
                  - ${item.quantity}
                `,

                updatedAt:
                  new Date(),
              })
              .where(
                and(
                  eq(
                    products.id,
                    item.productId
                  ),

                  eq(
                    products.status,
                    "ACTIVE"
                  ),

                  gte(
                    products.stock,
                    item.quantity
                  )
                )
              ).returning({ id: products.id });

          if (
            updateResult.length !== 1
          ) {
            throw new Error(
              "INSUFFICIENT_STOCK"
            );
          }
        }

        // Checkout สำเร็จ → ล้าง Cart
        await tx
          .delete(cartItems)
          .where(
            eq(
              cartItems.userId,
              user.id
            )
          );

        return newOrderId;
      }
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "CART_EMPTY"
      ) {
        redirect("/cart");
      }

      if (
        error.message ===
        "INSUFFICIENT_STOCK"
      ) {
        redirect(
          "/checkout?error=stock"
        );
      }

      if (
        error.message ===
        "PRODUCT_UNAVAILABLE"
      ) {
        redirect(
          "/checkout?error=unavailable"
        );
      }
    }

    throw error;
  }

  // Refresh Cart
  revalidatePath("/cart");

  // Refresh Root Layout / Navbar
  // เลขตะกร้าจะหายหลัง Checkout
  revalidatePath(
    "/",
    "layout"
  );

  // Refresh Products
  revalidatePath("/products");
  revalidatePath("/");

  // Refresh Seller
  revalidatePath(
    "/seller/products"
  );

  revalidatePath(
    "/seller/orders"
  );

  // Refresh Customer Orders
  revalidatePath("/orders");

  // ไปหน้า Order ที่เพิ่งสร้าง
  redirect(
    `/orders/${orderId}?success=1`
  );
}

"use server";

import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  orderItems,
  orders,
  orderShops,
  products,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

import {
  calculateMainOrderStatus,
} from "@/lib/order-status";

export async function confirmReceived(
  formData: FormData
) {
  const user = await requireUser();

  const orderShopId = Number(
    formData.get("orderShopId")
  );

  if (
    !Number.isInteger(orderShopId) ||
    orderShopId <= 0
  ) {
    throw new Error("Invalid order shop ID");
  }

  let affectedOrderId: number | null = null;

  await db.transaction(async (tx) => {
    const [shopOrder] = await tx
      .select({
        id: orderShops.id,
        orderId: orderShops.orderId,
        status: orderShops.status,
      })
      .from(orderShops)
      .innerJoin(
        orders,
        eq(orderShops.orderId, orders.id)
      )
      .where(
        and(
          eq(orderShops.id, orderShopId),
          eq(orders.userId, user.id)
        )
      )
      .limit(1);

    if (!shopOrder) {
      throw new Error("Order not found");
    }

    if (shopOrder.status !== "SHIPPED") {
      throw new Error("Order is not shipped");
    }

    affectedOrderId = shopOrder.orderId;

    await tx
      .update(orderShops)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderShops.id, shopOrder.id),
          eq(orderShops.status, "SHIPPED")
        )
      );

    const statuses = await tx
      .select({
        status: orderShops.status,
      })
      .from(orderShops)
      .where(
        eq(
          orderShops.orderId,
          shopOrder.orderId
        )
      );

    const mainStatus =
      calculateMainOrderStatus(
        statuses.map(
          (row) => row.status
        )
      );

    await tx
      .update(orders)
      .set({
        status: mainStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, shopOrder.orderId),
          eq(orders.userId, user.id)
        )
      );
  });

  revalidatePath("/orders");

  if (affectedOrderId) {
    revalidatePath(
      `/orders/${affectedOrderId}`
    );
  }

  revalidatePath("/seller/orders");
}

export async function cancelOrderShop(
  formData: FormData
) {
  const user = await requireUser();

  const orderShopId = Number(
    formData.get("orderShopId")
  );

  if (
    !Number.isInteger(orderShopId) ||
    orderShopId <= 0
  ) {
    throw new Error("Invalid order shop ID");
  }

  let affectedOrderId: number | null = null;

  await db.transaction(async (tx) => {
    const [shopOrder] = await tx
      .select({
        id: orderShops.id,
        orderId: orderShops.orderId,
        shopId: orderShops.shopId,
        shopName: orderShops.shopName,
        status: orderShops.status,
      })
      .from(orderShops)
      .innerJoin(
        orders,
        eq(orderShops.orderId, orders.id)
      )
      .where(
        and(
          eq(orderShops.id, orderShopId),
          eq(orders.userId, user.id)
        )
      )
      .limit(1);

    if (!shopOrder) {
      throw new Error("Order not found");
    }

    // ยกเลิกได้เฉพาะก่อนร้านยืนยัน
    if (shopOrder.status !== "PENDING") {
      throw new Error(
        "Order can no longer be cancelled"
      );
    }

    /*
     * เปลี่ยนเป็น CANCELLED ก่อน
     * และบังคับเงื่อนไขว่าเดิมต้องยัง PENDING
     * ป้องกันการกดยกเลิกซ้ำ
     */
    const updateResult = await tx
      .update(orderShops)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderShops.id, shopOrder.id),
          eq(orderShops.status, "PENDING")
        )
      );

    if (
      updateResult[0].affectedRows !== 1
    ) {
      throw new Error(
        "Order status has already changed"
      );
    }

    /*
     * หา Item ของร้านนี้
     */
    const allItems = await tx
      .select({
        productId: orderItems.productId,
        shopId: orderItems.shopId,
        shopName: orderItems.shopName,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(
        eq(
          orderItems.orderId,
          shopOrder.orderId
        )
      );

    const shopItems = allItems.filter(
      (item) => {
        if (
          shopOrder.shopId !== null &&
          item.shopId !== null
        ) {
          return (
            item.shopId === shopOrder.shopId
          );
        }

        return (
          item.shopName ===
          shopOrder.shopName
        );
      }
    );

    /*
     * คืน Stock
     */
    for (const item of shopItems) {
      if (item.productId === null) {
        continue;
      }

      await tx
        .update(products)
        .set({
          stock: sql`
            ${products.stock}
            + ${item.quantity}
          `,
          updatedAt: new Date(),
        })
        .where(
          eq(
            products.id,
            item.productId
          )
        );
    }

    /*
     * คำนวณสถานะ Order รวม
     * และยอดรวมใหม่หลังหักร้านที่ยกเลิก
     */
    const shopOrders = await tx
      .select({
        status: orderShops.status,
        subtotal: orderShops.subtotal,
      })
      .from(orderShops)
      .where(
        eq(
          orderShops.orderId,
          shopOrder.orderId
        )
      );

    const mainStatus =
      calculateMainOrderStatus(
        shopOrders.map(
          (row) => row.status
        )
      );

    const newTotal = shopOrders
      .filter(
        (row) =>
          row.status !== "CANCELLED"
      )
      .reduce(
        (sum, row) =>
          sum + Number(row.subtotal),
        0
      );

    await tx
      .update(orders)
      .set({
        status: mainStatus,
        totalAmount:
          newTotal.toFixed(2),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            orders.id,
            shopOrder.orderId
          ),
          eq(
            orders.userId,
            user.id
          )
        )
      );

    affectedOrderId =
      shopOrder.orderId;
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/orders");
  revalidatePath("/seller/products");
  revalidatePath("/seller/orders");

  if (affectedOrderId) {
    revalidatePath(
      `/orders/${affectedOrderId}`
    );
  }
}
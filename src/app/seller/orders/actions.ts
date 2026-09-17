"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  orders,
  orderShops,
  shops,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus | null
> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: null,
  COMPLETED: null,
  CANCELLED: null,
};

function calculateMainOrderStatus(
  statuses: OrderStatus[]
): OrderStatus {
  if (
    statuses.length > 0 &&
    statuses.every(
      (status) => status === "COMPLETED"
    )
  ) {
    return "COMPLETED";
  }

  if (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status === "SHIPPED" ||
        status === "COMPLETED"
    )
  ) {
    return "SHIPPED";
  }

  if (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status === "CONFIRMED" ||
        status === "SHIPPED" ||
        status === "COMPLETED"
    )
  ) {
    return "CONFIRMED";
  }

  return "PENDING";
}

export async function advanceSellerOrder(
  formData: FormData
) {
  const user = await requireRole(["SELLER"]);

  const orderShopId = Number(
    formData.get("orderShopId")
  );

  const requestedStatus = formData
    .get("nextStatus")
    ?.toString() as OrderStatus | undefined;

  if (
    !Number.isInteger(orderShopId) ||
    orderShopId <= 0
  ) {
    throw new Error("Invalid order shop ID");
  }

  if (!requestedStatus) {
    throw new Error("Invalid status");
  }

  const [shop] = await db
    .select({
      id: shops.id,
    })
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (!shop) {
    throw new Error("Shop not found");
  }

  await db.transaction(async (tx) => {
    const [orderShop] = await tx
      .select({
        id: orderShops.id,
        orderId: orderShops.orderId,
        status: orderShops.status,
      })
      .from(orderShops)
      .where(
        and(
          eq(orderShops.id, orderShopId),
          eq(orderShops.shopId, shop.id)
        )
      )
      .limit(1);

    if (!orderShop) {
      throw new Error("Order not found");
    }

    const expectedNextStatus =
      allowedTransitions[orderShop.status];

    if (
      expectedNextStatus === null ||
      expectedNextStatus !== requestedStatus
    ) {
      throw new Error(
        "Invalid order status transition"
      );
    }

    await tx
      .update(orderShops)
      .set({
        status: requestedStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orderShops.id, orderShop.id),
          eq(orderShops.shopId, shop.id),
          eq(
            orderShops.status,
            orderShop.status
          )
        )
      );

    /*
     * คำนวณสถานะ Order หลักใหม่
     * จากสถานะของทุกร้านใน Order
     */
    const shopStatuses = await tx
      .select({
        status: orderShops.status,
      })
      .from(orderShops)
      .where(
        eq(
          orderShops.orderId,
          orderShop.orderId
        )
      );

    const mainStatus =
      calculateMainOrderStatus(
        shopStatuses.map(
          (item) => item.status
        )
      );

    await tx
      .update(orders)
      .set({
        status: mainStatus,
        updatedAt: new Date(),
      })
      .where(
        eq(
          orders.id,
          orderShop.orderId
        )
      );
  });

  revalidatePath("/seller/orders");
  revalidatePath("/orders");
}
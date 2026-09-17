"use server";

import {
  and,
  eq,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  orders,
  orderShops,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

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
    throw new Error(
      "Invalid order shop ID"
    );
  }

  let affectedOrderId: number | null =
    null;

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
        eq(
          orderShops.orderId,
          orders.id
        )
      )
      .where(
        and(
          eq(
            orderShops.id,
            orderShopId
          ),
          eq(
            orders.userId,
            user.id
          )
        )
      )
      .limit(1);

    if (!shopOrder) {
      throw new Error(
        "Order not found"
      );
    }

    /*
     * ลูกค้ายืนยันรับได้
     * เฉพาะเมื่อ Seller แจ้งจัดส่งแล้ว
     */
    if (
      shopOrder.status !== "SHIPPED"
    ) {
      throw new Error(
        "Order is not shipped"
      );
    }

    affectedOrderId =
      shopOrder.orderId;

    await tx
      .update(orderShops)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            orderShops.id,
            shopOrder.id
          ),
          eq(
            orderShops.status,
            "SHIPPED"
          )
        )
      );

    /*
     * อ่านสถานะของทุกร้าน
     * แล้วคำนวณสถานะ Order หลักใหม่
     */
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
  });

  revalidatePath("/orders");

  if (affectedOrderId) {
    revalidatePath(
      `/orders/${affectedOrderId}`
    );
  }

revalidatePath("/seller/orders");
}
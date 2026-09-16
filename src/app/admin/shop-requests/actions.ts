"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  shopRequests,
  shops,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export async function approveShopRequest(
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const requestId = Number(
    formData.get("requestId")
  );

  if (!Number.isInteger(requestId) || requestId <= 0) {
    throw new Error("Invalid request ID");
  }

  const result = await db
    .select()
    .from(shopRequests)
    .where(eq(shopRequests.id, requestId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Shop request not found");
  }

  const request = result[0];

  if (request.status !== "PENDING") {
    throw new Error(
      "This request has already been reviewed"
    );
  }

  await db.transaction(async (tx) => {
    await tx.insert(shops).values({
      ownerId: request.userId,
      name: request.shopName,
      description: request.description,
      phone: request.phone,
      address: request.address,
    });

    await tx
      .update(users)
      .set({
        role: "SELLER",
      })
      .where(
        eq(users.id, request.userId)
      );

    await tx
      .update(shopRequests)
      .set({
        status: "APPROVED",
        reviewedAt: new Date(),
      })
      .where(
        eq(shopRequests.id, request.id)
      );
  });

  revalidatePath("/admin/shop-requests");
}

export async function rejectShopRequest(
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const requestId = Number(
    formData.get("requestId")
  );

  if (!Number.isInteger(requestId) || requestId <= 0) {
    throw new Error("Invalid request ID");
  }

  const result = await db
    .select()
    .from(shopRequests)
    .where(eq(shopRequests.id, requestId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Shop request not found");
  }

  const request = result[0];

  if (request.status !== "PENDING") {
    throw new Error(
      "This request has already been reviewed"
    );
  }

  await db
    .update(shopRequests)
    .set({
      status: "REJECTED",
      reviewedAt: new Date(),
    })
    .where(
      eq(shopRequests.id, request.id)
    );

  revalidatePath("/admin/shop-requests");
}
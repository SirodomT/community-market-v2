"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export async function toggleShopStatus(
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const shopId = Number(
    formData.get("shopId")
  );

  if (
    !Number.isInteger(shopId) ||
    shopId <= 0
  ) {
    throw new Error(
      "Invalid shop ID"
    );
  }

  const [shop] = await db
    .select({
      id: shops.id,
      status: shops.status,
    })
    .from(shops)
    .where(
      eq(shops.id, shopId)
    )
    .limit(1);

  if (!shop) {
    throw new Error(
      "Shop not found"
    );
  }

  const newStatus =
    shop.status === "ACTIVE"
      ? "INACTIVE"
      : "ACTIVE";

  await db
    .update(shops)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(
      eq(shops.id, shop.id)
    );

  revalidatePath("/");
  revalidatePath("/shops");
  revalidatePath("/products");

  revalidatePath(
    `/shops/${shop.id}`
  );

  revalidatePath(
    "/admin/shops"
  );

  revalidatePath("/seller");
  revalidatePath(
    "/seller/products"
  );
}
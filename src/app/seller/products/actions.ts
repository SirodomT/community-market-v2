"use server";

import { unlink } from "fs/promises";
import { basename, join } from "path";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products, shops } from "@/db/schema";
import { requireRole } from "@/lib/auth";

async function getSellerShopId(userId: number) {
  const result = await db
    .select({
      id: shops.id,
    })
    .from(shops)
    .where(eq(shops.ownerId, userId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Shop not found");
  }

  return result[0].id;
}

async function deleteProductImage(
  imageUrl: string | null
) {
  if (!imageUrl) return;

  if (!imageUrl.startsWith("/uploads/products/")) {
    return;
  }

  const fileName = basename(imageUrl);

  const filePath = join(
    process.cwd(),
    "public",
    "uploads",
    "products",
    fileName
  );

  try {
    await unlink(filePath);
  } catch {
    // ถ้าไฟล์ไม่มีอยู่แล้ว ไม่ต้องหยุดระบบ
  }
}

export async function toggleProductStatus(
  formData: FormData
) {
  const user = await requireRole(["SELLER"]);

  const productId = Number(
    formData.get("productId")
  );

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new Error("Invalid product ID");
  }

  const shopId = await getSellerShopId(user.id);

  const result = await db
    .select({
      id: products.id,
      status: products.status,
    })
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.shopId, shopId)
      )
    )
    .limit(1);

  if (result.length === 0) {
    throw new Error("Product not found");
  }

  const nextStatus =
    result[0].status === "ACTIVE"
      ? "INACTIVE"
      : "ACTIVE";

  await db
    .update(products)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(products.id, productId),
        eq(products.shopId, shopId)
      )
    );

  revalidatePath("/seller/products");
  revalidatePath("/products");
}

export async function deleteProduct(
  formData: FormData
) {
  const user = await requireRole(["SELLER"]);

  const productId = Number(
    formData.get("productId")
  );

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new Error("Invalid product ID");
  }

  const shopId = await getSellerShopId(user.id);

  const productResult = await db
    .select({
      id: products.id,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.shopId, shopId)
      )
    )
    .limit(1);

  if (productResult.length === 0) {
    throw new Error("Product not found");
  }

  const product = productResult[0];

  await db
    .delete(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.shopId, shopId)
      )
    );

  await deleteProductImage(product.imageUrl);

  revalidatePath("/seller/products");
  revalidatePath("/products");
}
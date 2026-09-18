"use server";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, uploadProductImage, removeUnusedProductImage } from "@/lib/product-images";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export async function updateProduct(
  formData: FormData
) {
  const user = await requireRole(["SELLER"]);

  const productId = Number(
    formData.get("productId")
  );

  const name = formData
    .get("name")
    ?.toString()
    .trim();

  const description = formData
    .get("description")
    ?.toString()
    .trim();

  const priceText = formData
    .get("price")
    ?.toString()
    .trim();

  const stockText = formData
    .get("stock")
    ?.toString()
    .trim();

  const categoryText = formData
    .get("categoryId")
    ?.toString()
    .trim();

  const newImage = formData.get("image");

  const removeImage =
    formData.get("removeImage") === "on";

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new Error("Invalid product ID");
  }

  if (
    !name ||
    !description ||
    !priceText ||
    !stockText
  ) {
    redirect(
      `/seller/products/${productId}/edit?error=missing`
    );
  }

  if (name.length > 150) {
    redirect(
      `/seller/products/${productId}/edit?error=name`
    );
  }

  const price = Number(priceText);
  const stock = Number(stockText);

  if (!Number.isFinite(price) || price < 0) {
    redirect(
      `/seller/products/${productId}/edit?error=price`
    );
  }

  if (!Number.isInteger(stock) || stock < 0) {
    redirect(
      `/seller/products/${productId}/edit?error=stock`
    );
  }

  const shopResult = await db
    .select({
      id: shops.id,
    })
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (shopResult.length === 0) {
    redirect("/seller");
  }

  const shopId = shopResult[0].id;

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
    redirect("/seller/products");
  }

  const currentProduct = productResult[0];

  let categoryId: number | null = null;

  if (categoryText) {
    const parsedCategoryId =
      Number(categoryText);

    if (
      !Number.isInteger(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      redirect(
        `/seller/products/${productId}/edit?error=category`
      );
    }

    const categoryResult = await db
      .select({
        id: categories.id,
      })
      .from(categories)
      .where(
        eq(categories.id, parsedCategoryId)
      )
      .limit(1);

    if (categoryResult.length === 0) {
      redirect(
        `/seller/products/${productId}/edit?error=category`
      );
    }

    categoryId = parsedCategoryId;
  }

  let imageUrl = currentProduct.imageUrl;
  let uploadedImageUrl: string | null = null;

  if (
    newImage instanceof File &&
    newImage.size > 0
  ) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(newImage.type)
    ) {
      redirect(
        `/seller/products/${productId}/edit?error=image`
      );
    }

    if (newImage.size > MAX_IMAGE_SIZE) {
      redirect(
        `/seller/products/${productId}/edit?error=image-size`
      );
    }

    uploadedImageUrl = await uploadProductImage(newImage, shopId);

    imageUrl = uploadedImageUrl;
  } else if (removeImage) {
    imageUrl = null;
  }

  const changesImage = uploadedImageUrl !== null || removeImage;
  try {
    const updated = await db.update(products).set({
      name, description, price: price.toFixed(2), stock, categoryId,
      ...(changesImage ? { imageUrl } : {}), updatedAt: new Date(),
    }).where(and(
      eq(products.id, productId), eq(products.shopId, shopId),
      changesImage
        ? (currentProduct.imageUrl === null ? isNull(products.imageUrl) : eq(products.imageUrl, currentProduct.imageUrl))
        : undefined,
    )).returning({ id: products.id });
    if (updated.length !== 1) throw new Error("Product changed. Reload before replacing its image.");
  } catch (error) {
    if (uploadedImageUrl) await removeUnusedProductImage(uploadedImageUrl, shopId);
    throw error;
  }
  if (changesImage && currentProduct.imageUrl && currentProduct.imageUrl !== imageUrl) {
    await removeUnusedProductImage(currentProduct.imageUrl, shopId);
  }
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/seller/products");
  redirect("/seller/products");
}

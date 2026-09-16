"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { basename, join } from "path";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  categories,
  products,
  shops,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 900 * 1024;

function getImageExtension(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
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
    // ถ้าไฟล์ไม่มีอยู่แล้ว ไม่ต้องทำอะไร
  }
}

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

    const extension =
      getImageExtension(newImage.type);

    if (!extension) {
      redirect(
        `/seller/products/${productId}/edit?error=image`
      );
    }

    const fileName =
      `${randomUUID()}.${extension}`;

    const uploadDirectory = join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = join(
      uploadDirectory,
      fileName
    );

    const bytes =
      await newImage.arrayBuffer();

    await writeFile(
      filePath,
      Buffer.from(bytes)
    );

    uploadedImageUrl =
      `/uploads/products/${fileName}`;

    imageUrl = uploadedImageUrl;
  } else if (removeImage) {
    imageUrl = null;
  }

  try {
    await db
      .update(products)
      .set({
        name,
        description,
        price: price.toFixed(2),
        stock,
        categoryId,
        imageUrl,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.id, productId),
          eq(products.shopId, shopId)
        )
      );
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteProductImage(
        uploadedImageUrl
      );
    }

    throw error;
  }

  if (
    currentProduct.imageUrl &&
    currentProduct.imageUrl !== imageUrl
  ) {
    await deleteProductImage(
      currentProduct.imageUrl
    );
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/seller/products");

  redirect("/seller/products");
}
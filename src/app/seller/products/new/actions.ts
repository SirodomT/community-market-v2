"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import { eq } from "drizzle-orm";
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

const MAX_IMAGE_SIZE = 900 * 1024; // 900 KB

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

export async function createProduct(formData: FormData) {
  const user = await requireRole(["SELLER"]);

  const shopResult = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (shopResult.length === 0) {
    redirect("/seller");
  }

  const shop = shopResult[0];

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

  const image = formData.get("image");

  if (
    !name ||
    !description ||
    !priceText ||
    !stockText
  ) {
    redirect("/seller/products/new?error=missing");
  }

  if (name.length > 150) {
    redirect("/seller/products/new?error=name");
  }

  const price = Number(priceText);
  const stock = Number(stockText);

  if (!Number.isFinite(price) || price < 0) {
    redirect("/seller/products/new?error=price");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    redirect("/seller/products/new?error=stock");
  }

  let categoryId: number | null = null;

  if (categoryText) {
    const parsedCategoryId = Number(categoryText);

    if (
      !Number.isInteger(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      redirect("/seller/products/new?error=category");
    }

    const categoryResult = await db
      .select({
        id: categories.id,
      })
      .from(categories)
      .where(eq(categories.id, parsedCategoryId))
      .limit(1);

    if (categoryResult.length === 0) {
      redirect("/seller/products/new?error=category");
    }

    categoryId = parsedCategoryId;
  }

  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      redirect("/seller/products/new?error=image");
    }

    if (image.size > MAX_IMAGE_SIZE) {
      redirect("/seller/products/new?error=image-size");
    }

    const extension = getImageExtension(image.type);

    if (!extension) {
      redirect("/seller/products/new?error=image");
    }

    const fileName = `${randomUUID()}.${extension}`;

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

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    imageUrl = `/uploads/products/${fileName}`;
  }

  await db.insert(products).values({
    shopId: shop.id,
    categoryId,
    name,
    description,
    price: price.toFixed(2),
    stock,
    imageUrl,
  });

  redirect("/seller/products");
}
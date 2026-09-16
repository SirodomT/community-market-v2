"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { shopRequests, shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function submitShopRequest(formData: FormData) {
  const user = await requireUser();

  // ถ้าเป็น Seller หรือ Admin อยู่แล้ว ไม่ต้องสมัครเปิดร้านอีก
  if (user.role !== "USER") {
    redirect("/seller");
  }

  const shopName = formData
    .get("shopName")
    ?.toString()
    .trim();

  const description = formData
    .get("description")
    ?.toString()
    .trim();

  const phone = formData
    .get("phone")
    ?.toString()
    .trim();

  const address = formData
    .get("address")
    ?.toString()
    .trim();

  if (!shopName || !description || !phone || !address) {
    redirect("/seller/apply?error=missing");
  }

  if (shopName.length < 3) {
    redirect("/seller/apply?error=name");
  }

  // เผื่อ User นี้มีร้านอยู่แล้ว
  const existingShop = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, user.id))
    .limit(1);

  if (existingShop.length > 0) {
    redirect("/seller");
  }

  // ป้องกันคำขอ PENDING ซ้ำ
  const pendingRequest = await db
    .select()
    .from(shopRequests)
    .where(
      and(
        eq(shopRequests.userId, user.id),
        eq(shopRequests.status, "PENDING")
      )
    )
    .limit(1);

  if (pendingRequest.length > 0) {
    redirect("/seller/apply?error=pending");
  }

  await db.insert(shopRequests).values({
    userId: user.id,
    shopName,
    description,
    phone,
    address,
  });

  redirect("/seller/apply?success=1");
}
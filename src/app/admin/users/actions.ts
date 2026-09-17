"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  sessions,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";

export async function toggleUserStatus(
  formData: FormData
) {
  const admin = await requireRole([
    "ADMIN",
  ]);

  const userId = Number(
    formData.get("userId")
  );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    throw new Error(
      "Invalid user ID"
    );
  }

  // ป้องกัน Admin แก้สถานะตัวเอง
  if (userId === admin.id) {
    throw new Error(
      "You cannot suspend your own account"
    );
  }

  const [targetUser] = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(
      eq(users.id, userId)
    )
    .limit(1);

  if (!targetUser) {
    throw new Error(
      "User not found"
    );
  }

  // ป้องกันบัญชี Admin
  if (targetUser.role === "ADMIN") {
    throw new Error(
      "Admin accounts cannot be modified here"
    );
  }

  const newStatus =
    targetUser.status === "ACTIVE"
      ? "SUSPENDED"
      : "ACTIVE";

  await db.transaction(
    async (tx) => {
      await tx
        .update(users)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(
          eq(
            users.id,
            targetUser.id
          )
        );

      /*
       * ถ้าระงับบัญชี
       * ลบ Session ทั้งหมดทันที
       */
      if (
        newStatus === "SUSPENDED"
      ) {
        await tx
          .delete(sessions)
          .where(
            eq(
              sessions.userId,
              targetUser.id
            )
          );
      }
    }
  );

  revalidatePath(
    "/admin/users"
  );
}
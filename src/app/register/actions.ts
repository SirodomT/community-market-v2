"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function registerUser(formData: FormData) {
  const username = formData
    .get("username")
    ?.toString()
    .trim();

  const email = formData
    .get("email")
    ?.toString()
    .trim()
    .toLowerCase();

  const password = formData
    .get("password")
    ?.toString();

  // ตรวจว่ากรอกข้อมูลครบหรือไม่
  if (!username || !email || !password) {
    redirect("/register?error=missing");
  }

  // ตรวจ username
  if (username.length < 3) {
    redirect("/register?error=username");
  }

  // ตรวจรูปแบบ email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    redirect("/register?error=invalid-email");
  }

  // ตรวจ password
  if (password.length < 8) {
    redirect("/register?error=password");
  }

  // ตรวจว่า email มีอยู่แล้วหรือไม่
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    redirect("/register?error=email");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // บันทึก User
  await db.insert(users).values({
    username,
    email,
    passwordHash,
  });

  // สมัครสำเร็จ
  redirect("/register?success=1");
}
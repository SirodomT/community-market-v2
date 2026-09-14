"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function loginUser(formData: FormData) {
  const email = formData
    .get("email")
    ?.toString()
    .trim()
    .toLowerCase();

  const password = formData
    .get("password")
    ?.toString();

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    redirect("/login?error=credentials");
  }

  const user = result[0];

  if (user.status !== "ACTIVE") {
    redirect("/login?error=suspended");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.passwordHash
  );

 if (!passwordMatch) {
  redirect("/login?error=credentials");
}

await createSession(user.id);

redirect("/account");
}
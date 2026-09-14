import "server-only";

import {
  createHash,
  randomBytes,
} from "crypto";

import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE_NAME = "session_token";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + 7
  );

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    }
  );
}
export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(
      users,
      eq(sessions.userId, users.id)
    )
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(
          sessions.expiresAt,
          new Date()
        )
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}
export async function deleteSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (token) {
    const tokenHash = hashToken(token);

    await db
      .delete(sessions)
      .where(
        eq(
          sessions.tokenHash,
          tokenHash
        )
      );
  }

  cookieStore.delete(
    SESSION_COOKIE_NAME
  );
}
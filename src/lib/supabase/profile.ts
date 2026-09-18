import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authIdentities } from "@/db/auth-schema";
import { createClient } from "./server";

// Called only after login/confirmation, never during page rendering.
export async function ensureAuthProfile(): Promise<"ready" | "unlinked" | "invalid"> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return "invalid";
  const subject = data.claims.sub;
  const [linked] = await db.select().from(authIdentities)
    .where(eq(authIdentities.supabaseUserId, subject)).limit(1);
  if (linked) return "ready";

  // Confirmation is checked against Auth, never editable user metadata.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user || user.id !== subject || !user.email || !user.email_confirmed_at) return "invalid";
  const email = user.email.toLowerCase();
  const username = typeof user.user_metadata.username === "string"
    ? user.user_metadata.username.trim().slice(0, 100) : "Member";

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: users.id }).from(users)
        .where(eq(sql`lower(${users.email})`, email)).limit(1);
      // Never claim legacy accounts (especially sellers/admins) by email alone.
      if (existing) return "unlinked" as const;
      const [created] = await tx.insert(users).values({
        username: username || "Member", email,
        passwordHash: "SUPABASE_AUTH_ONLY", role: "USER", status: "ACTIVE",
      }).returning({ id: users.id });
      await tx.insert(authIdentities).values({ supabaseUserId: subject, userId: created.id });
      return "ready" as const;
    });
  } catch (error) {
    // Another login may have completed the same transaction concurrently.
    const [concurrent] = await db.select().from(authIdentities)
      .where(eq(authIdentities.supabaseUserId, subject)).limit(1);
    if (concurrent) return "ready";
    throw error;
  }
}

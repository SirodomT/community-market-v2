import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authIdentities } from "@/db/auth-schema";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function getCurrentUser() {
  // Keep auth-dependent routes dynamic even before Supabase is configured.
  await cookies();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    status: users.status,
  }).from(authIdentities)
    .innerJoin(users, eq(authIdentities.userId, users.id))
    .where(eq(authIdentities.supabaseUserId, data.claims.sub)).limit(1);
  return user ?? null;
}

export async function deleteSession() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Unable to sign out. Please try again.");
  }
  (await cookies()).delete("session_token");
}

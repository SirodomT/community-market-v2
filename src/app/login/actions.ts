"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureAuthProfile } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/session";

export async function loginUser(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  if (!email || !password) redirect("/login?error=missing");
  if (!isSupabaseConfigured()) redirect("/login?error=configuration");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${error.code === "email_not_confirmed" ? "confirmation" : "credentials"}`);
  const profile = await ensureAuthProfile();
  if (profile !== "ready") {
    await supabase.auth.signOut();
    redirect(`/login?error=${profile === "unlinked" ? "unlinked" : "confirmation"}`);
  }
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }
  redirect("/account");
}

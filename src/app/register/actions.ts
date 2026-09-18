"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureAuthProfile } from "@/lib/supabase/profile";

export async function registerUser(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  if (!username || !email || !password) redirect("/register?error=missing");
  if (username.length < 3 || username.length > 100) redirect("/register?error=username");
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/register?error=invalid-email");
  if (password.length < 8) redirect("/register?error=password");
  if (!isSupabaseConfigured()) redirect("/register?error=configuration");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
  if (error) redirect("/register?error=signup");
  if (data.session) {
    const profile = await ensureAuthProfile();
    if (profile === "ready") redirect("/account");
    await supabase.auth.signOut();
    redirect(`/login?error=${profile === "unlinked" ? "unlinked" : "confirmation"}`);
  }
  redirect("/register?success=1");
}

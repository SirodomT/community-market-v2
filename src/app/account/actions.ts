"use server";

import { redirect } from "next/navigation";

import { deleteSession } from "@/lib/session";

export async function logoutUser() {
  await deleteSession();

  redirect("/login");
}
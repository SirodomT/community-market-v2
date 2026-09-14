import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

type UserRole = "USER" | "SELLER" | "ADMIN";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status !== "ACTIVE") {
    redirect("/login?error=suspended");
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[]
) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}
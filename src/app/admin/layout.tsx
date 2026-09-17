import DashboardNav from "@/components/DashboardNav";
import { ShieldCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutUser } from "@/app/account/actions";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireRole(["ADMIN"]);

  return (
    <div className="mx-auto grid max-w-[1536px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="min-w-0 border-b border-border bg-surface p-4 lg:border-b-0 lg:border-r">
        <div className="lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3 px-3">
            <span className="rounded-xl bg-primary-soft p-2.5 text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <Link href="/admin" className="text-sm font-bold">
                ผู้ดูแลระบบ
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {admin.username}
              </p>
            </div>
          </div>
          <DashboardNav mode="admin" />
          <form
            action={logoutUser}
            className="mt-6 hidden border-t border-border pt-4 lg:block"
          >
            <button
              type="submit"
              className="btn btn-ghost w-full justify-start text-muted-foreground"
            >
              <LogOut aria-hidden="true" className="size-4" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

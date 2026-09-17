import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";
import {
  ArrowUpRight,
  PackageOpen,
  Search,
  Store,
  MapPin,
  CircleCheck,
  Clock3,
  Truck,
  Ban,
  ShieldCheck,
} from "lucide-react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />;
}
export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${className}`} {...props} />;
}
export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field min-h-32 ${className}`} {...props} />;
}
export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field ${className}`} {...props} />;
}
export function SearchField({
  id,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3.5 size-5 text-muted-foreground"
        />
        <Input {...props} id={id} type="search" className="pl-10" />
      </div>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "ดูทั้งหมด",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {href && (
        <Link href={href} className="btn btn-ghost text-primary">
          {linkLabel}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  href,
  label = "เลือกซื้อสินค้า",
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="surface flex flex-col items-center px-5 py-12 text-center">
      <span className="mb-5 rounded-2xl bg-primary-soft p-4 text-primary">
        <PackageOpen aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {href && (
        <Link href={href} className="btn btn-primary mt-6">
          {label}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
const states = {
  PENDING: {
    label: "รอดำเนินการ",
    icon: Clock3,
    color: "border-amber-200 bg-amber-50 text-amber-900",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    icon: ShieldCheck,
    color: "border-sky-200 bg-sky-50 text-sky-900",
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    icon: Truck,
    color: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  COMPLETED: {
    label: "สำเร็จ",
    icon: CircleCheck,
    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: Ban,
    color: "border-rose-200 bg-rose-50 text-rose-900",
  },
  ACTIVE: {
    label: "เปิดใช้งาน",
    icon: CircleCheck,
    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  INACTIVE: {
    label: "ปิดใช้งาน",
    icon: Ban,
    color: "border-stone-200 bg-stone-100 text-stone-700",
  },
  SUSPENDED: {
    label: "ถูกระงับ",
    icon: Ban,
    color: "border-rose-200 bg-rose-50 text-rose-900",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    icon: CircleCheck,
    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    icon: Ban,
    color: "border-rose-200 bg-rose-50 text-rose-900",
  },
};
export function StatusBadge({ status }: { status: string }) {
  const state = states[status as keyof typeof states];
  const Icon = state?.icon ?? Clock3;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${state?.color ?? "border-border bg-muted text-foreground"}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {state?.label ?? status}
    </span>
  );
}
export function PriceDisplay({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <span className={`font-semibold tabular-nums text-primary ${className}`}>
      ฿
      {Number(value).toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
export function StockBadge({ stock }: { stock: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${stock > 0 ? "text-primary" : "text-rose-800"}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {stock > 0 ? `เหลือ ${stock} ชิ้น` : "สินค้าหมด"}
    </span>
  );
}
export function StatCard({
  label,
  value,
  description,
  href,
  icon,
}: {
  label: string;
  value: ReactNode;
  description?: string;
  href?: string;
  icon: ReactNode;
}) {
  return (
    <div className="surface flex min-w-0 flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="rounded-xl bg-primary-soft p-2.5 text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums sm:text-4xl">
        {value}
      </p>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
      {href && (
        <Link
          href={href}
          className="mt-auto flex min-h-11 items-center gap-1 pt-4 text-sm font-semibold text-primary"
        >
          ดูรายละเอียด
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
export function ShopCard({
  shop,
}: {
  shop: {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
  };
}) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="surface group flex min-w-0 flex-col p-6 transition duration-200 hover:border-primary/40"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-xl font-bold text-primary">
          {shop.name.charAt(0)}
        </span>
        <Store aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold">{shop.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
        {shop.description || "สินค้าจากผู้ประกอบการในชุมชน"}
      </p>
      <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
        <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
        <span className="line-clamp-2">
          {shop.address || "ดูข้อมูลเพิ่มเติมที่หน้าร้าน"}
        </span>
      </p>
      <span className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold text-primary">
        เยี่ยมชมร้าน
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="page-shell" role="status" aria-label="กำลังโหลด">
      <div className="mx-auto max-w-7xl">
        <span className="sr-only">กำลังโหลดข้อมูล…</span>
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className="h-5 w-28 rounded bg-border" />
          <div className="mt-4 h-10 w-3/4 max-w-md rounded bg-border" />
          <div className="mt-8 h-20 rounded-2xl bg-muted" />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="surface p-3">
                <div className="aspect-[4/3] rounded-xl bg-muted" />
                <div className="mt-4 h-5 w-3/4 rounded bg-muted" />
                <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

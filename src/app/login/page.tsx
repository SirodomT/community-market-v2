import Link from "next/link";
import { Store } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { Input } from "@/components/ui/primitives";
import { loginUser } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell flex items-center justify-center">
      <div className="w-full max-w-md surface p-5 sm:p-8">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Store aria-hidden="true" className="size-6" />
        </span>
        <h1 className="text-center text-3xl font-bold">เข้าสู่ระบบ</h1>

        <p className="mt-2 text-center text-muted-foreground">
          Community Enterprise Market
        </p>

        {params.success === "1" && (
          <p className="mt-4 rounded-lg bg-green-100 p-3 text-center text-green-700">
            เข้าสู่ระบบสำเร็จ
          </p>
        )}

        {params.error === "missing" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            กรุณากรอกข้อมูลให้ครบ
          </p>
        )}

        {params.error === "credentials" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>
        )}

        {params.error === "suspended" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            บัญชีนี้ถูกระงับการใช้งาน
          </p>
        )}

        <form action={loginUser} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="field-label">
              อีเมล
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@email.com"
              className=""
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              รหัสผ่าน
            </label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="กรอกรหัสผ่าน"
              className=""
            />
          </div>

          <SubmitButton type="submit" variant="primary" className="w-full">
            เข้าสู่ระบบ
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline underline-offset-4"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
}

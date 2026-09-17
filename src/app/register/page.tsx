import Link from "next/link";
import { Store } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { Input } from "@/components/ui/primitives";
import { registerUser } from "./actions";

export default async function RegisterPage({
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
        <h1 className="text-center text-3xl font-bold">สมัครสมาชิก</h1>

        <p className="mt-2 text-center text-muted-foreground">
          Community Enterprise Market
        </p>
        {params.success === "1" && (
          <p className="mt-4 rounded-lg bg-green-100 p-3 text-center text-green-700">
            สมัครสมาชิกสำเร็จ
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

        {params.error === "username" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร
          </p>
        )}

        {params.error === "password" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
          </p>
        )}

        {params.error === "email" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            อีเมลนี้ถูกใช้งานแล้ว
          </p>
        )}
        {params.error === "invalid-email" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700"
          >
            รูปแบบอีเมลไม่ถูกต้อง
          </p>
        )}

        <form action={registerUser} className="mt-8 space-y-5">
          <div>
            <label htmlFor="username" className="field-label">
              ชื่อผู้ใช้
            </label>

            <Input
              id="username"
              autoComplete="username"
              name="username"
              type="text"
              required
              minLength={3}
              placeholder="กรอกชื่อผู้ใช้"
              className=""
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="กรอกรหัสผ่าน"
              className=""
            />
          </div>

          <SubmitButton type="submit" variant="primary" className="w-full">
            สมัครสมาชิก
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          มีบัญชีแล้ว?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline underline-offset-4"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}

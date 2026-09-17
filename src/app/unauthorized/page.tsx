import { ShieldAlert } from "lucide-react";
import Link from "next/link";
export default function UnauthorizedPage() {
  return (
    <main className="page-shell flex items-center justify-center">
      <div className="surface max-w-md p-8 text-center">
        <ShieldAlert
          aria-hidden="true"
          className="mx-auto mb-5 size-10 text-accent"
        />
        <h1 className="text-2xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้านี้
          กรุณากลับไปยังหน้าบัญชีเพื่อเลือกเมนูที่ใช้งานได้
        </p>
        <Link href="/account" className="btn btn-primary mt-6">
          กลับหน้าบัญชี
        </Link>
      </div>
    </main>
  );
}

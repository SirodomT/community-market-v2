"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell">
      <div className="surface mx-auto max-w-lg p-8 text-center">
        <TriangleAlert
          aria-hidden="true"
          className="mx-auto mb-5 size-9 text-accent"
        />
        <h1 className="text-2xl font-bold">โหลดข้อมูลไม่สำเร็จ</h1>
        <p className="mt-3 text-muted-foreground">
          กรุณาลองอีกครั้ง หากปัญหายังคงอยู่ โปรดกลับมาใหม่ในภายหลัง
        </p>
        <Button onClick={reset} className="mt-6">
          ลองอีกครั้ง
        </Button>
      </div>
    </main>
  );
}

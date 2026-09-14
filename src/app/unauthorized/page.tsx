import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-3xl font-bold">
          ไม่มีสิทธิ์เข้าถึง
        </h1>

        <p className="mt-4 text-gray-600">
          บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </p>

        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          กลับหน้าบัญชี
        </Link>
      </div>
    </main>
  );
}
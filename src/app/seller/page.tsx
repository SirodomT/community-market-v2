import { requireRole } from "@/lib/auth";

export default async function SellerPage() {
  const user = await requireRole([
    "SELLER",
    "ADMIN",
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          Seller Dashboard
        </h1>

        <p className="mt-4">
          ยินดีต้อนรับ {user.username}
        </p>

        <p className="mt-2">
          Role: {user.role}
        </p>
      </div>
    </main>
  );
}
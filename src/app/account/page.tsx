import { requireUser } from "@/lib/auth";
import { logoutUser } from "./actions";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          บัญชีของฉัน
        </h1>

        <div className="mt-6 space-y-3">
          <p>
            <strong>ID:</strong> {user.id}
          </p>

          <p>
            <strong>ชื่อผู้ใช้:</strong> {user.username}
          </p>

          <p>
            <strong>อีเมล:</strong> {user.email}
          </p>

          <p>
            <strong>Role:</strong> {user.role}
          </p>

          <p>
            <strong>Status:</strong> {user.status}
          </p>
        </div>

        <form
          action={logoutUser}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </main>
  );
}
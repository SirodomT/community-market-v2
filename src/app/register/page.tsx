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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-center text-3xl font-bold">
          สมัครสมาชิก
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Community Enterprise Market
        </p>
        {params.success === "1" && (
  <p className="mt-4 rounded-lg bg-green-100 p-3 text-center text-green-700">
    สมัครสมาชิกสำเร็จ
  </p>
)}

{params.error === "missing" && (
  <p className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    กรุณากรอกข้อมูลให้ครบ
  </p>
)}

{params.error === "username" && (
  <p className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร
  </p>
)}

{params.error === "password" && (
  <p className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
  </p>
)}

{params.error === "email" && (
  <p className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    อีเมลนี้ถูกใช้งานแล้ว
  </p>
)}
{params.error === "invalid-email" && (
  <p className="mt-4 rounded-lg bg-red-100 p-3 text-center text-red-700">
    รูปแบบอีเมลไม่ถูกต้อง
  </p>
)}

        <form
          action={registerUser}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-2 block font-medium"
            >
              ชื่อผู้ใช้
            </label>

            <input
  id="username"
  name="username"
  type="text"
  required
  minLength={3}
  placeholder="กรอกชื่อผู้ใช้"
  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-medium"
            >
              อีเมล
            </label>

            <input
  id="email"
  name="email"
  type="email"
  required
  placeholder="example@email.com"
  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-medium"
            >
              รหัสผ่าน
            </label>

            <input
              id="password"
  name="password"
  type="password"
  required
  minLength={8}
  placeholder="กรอกรหัสผ่าน"
  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            สมัครสมาชิก
          </button>
        </form>
      </div>
    </main>
  );
}
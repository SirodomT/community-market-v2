import { db } from "@/db";
import { users } from "@/db/schema";

export default async function DatabaseTestPage() {
  const allUsers = await db.select().from(users);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">
        Database Test
      </h1>

      <p className="mt-4">
        เชื่อมต่อฐานข้อมูลสำเร็จ
      </p>

      <p className="mt-2">
        จำนวนผู้ใช้: {allUsers.length}
      </p>
    </main>
  );
}
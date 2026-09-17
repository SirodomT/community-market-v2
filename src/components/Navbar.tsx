import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

import MarketplaceNav from "@/components/MarketplaceNav";

export default async function Navbar() {
  const user = await getCurrentUser();

  let cartCount = 0;

  if (user) {
    const [result] = await db
      .select({
        total: sql<number>`
          COALESCE(
            SUM(${cartItems.quantity}),
            0
          )
        `,
      })
      .from(cartItems)
      .where(eq(cartItems.userId, user.id));

    cartCount = Number(result?.total ?? 0);
  }

  return (
    <MarketplaceNav
      username={user?.username}
      role={user?.role}
      cartCount={cartCount}
    />
  );
}

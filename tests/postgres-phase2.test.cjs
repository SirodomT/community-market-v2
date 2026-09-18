/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { eq, ilike } = require("drizzle-orm");

function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports, Error, Date, URL, process,
    require: (name) => name in mocks ? mocks[name] : require(name),
  }, { filename: file });
  return exports;
}

test("PostgreSQL migration and actual marketplace actions (isolated in-memory database)", async (t) => {
  const engine = new PGlite();
  try {
    // Supabase owns auth.users in production; this is a test-only stand-in.
    await engine.exec('CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);');
    const migration = fs.readFileSync("drizzle-postgres/0000_supabase_marketplace.sql", "utf8");
    await engine.exec(migration);
    const db = drizzle(engine);
    const schema = load("src/db/schema.ts");
    const { users, shops, categories, products, cartItems, orders, orderItems, orderShops, shopRequests } = schema;
    const { authIdentities } = load("src/db/auth-schema.ts", { "./schema": schema });
    let actor;
    const mocks = {
      "@/db": { db }, "@/db/schema": schema,
      "@/lib/auth": {
        requireUser: async () => actor,
        requireRole: async (roles) => { assert.ok(roles.includes(actor.role)); return actor; },
      },
      "next/cache": { revalidatePath() {} },
      "next/navigation": { redirect: (path) => { throw new Error(`REDIRECT:${path}`); } },
      "@/lib/order-status": load("src/lib/order-status.ts"),
    };
    const checkout = load("src/app/checkout/actions.ts", mocks).checkout;
    const customer = load("src/app/orders/[id]/actions.ts", mocks);
    const seller = load("src/app/seller/orders/actions.ts", mocks);
    const adminRequests = load("src/app/admin/shop-requests/actions.ts", mocks);
    const adminUsers = load("src/app/admin/users/actions.ts", mocks);
    const cart = load("src/app/cart/actions.ts", mocks);
    const form = (values) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, String(value)); return data; };
    const shipping = () => form({ shippingName: "Buyer", shippingPhone: "0800000000", shippingAddress: "Test address" });

    async function seed() {
      await engine.exec('TRUNCATE auth.users, users, shops, categories, products, cart_items, orders, order_items, order_shops, shop_requests, sessions, auth_identities RESTART IDENTITY CASCADE;');
      const people = await db.insert(users).values([
        { username: "Buyer", email: "buyer@example.com", passwordHash: "SUPABASE_AUTH_ONLY" },
        { username: "Seller", email: "seller@example.com", passwordHash: "SUPABASE_AUTH_ONLY", role: "SELLER" },
        { username: "Admin", email: "admin@example.com", passwordHash: "SUPABASE_AUTH_ONLY", role: "ADMIN" },
      ]).returning();
      actor = people[0];
      const [shop] = await db.insert(shops).values({ ownerId: people[1].id, name: "Shop", description: "Test", phone: "0800000000", address: "Test" }).returning();
      const [category] = await db.insert(categories).values({ name: "Food" }).returning();
      const items = await db.insert(products).values([
        { shopId: shop.id, categoryId: category.id, name: "Rice", description: "Test", price: "12.50", stock: 10 },
        { shopId: shop.id, categoryId: category.id, name: "Tea", description: "Test", price: "20.00", stock: 10 },
      ]).returning();
      return { people, shop, items, category };
    }

    await t.test("schema has all tables, RLS, numeric money, dates, and role defaults", async () => {
      const { items, people } = await seed();
      assert.equal(items[0].price, "12.50");
      assert.ok(items[0].createdAt instanceof Date);
      assert.equal(people[0].role, "USER");
      const result = await engine.query("SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity");
      assert.equal(result.rows[0].n, 11);
      await assert.rejects(db.insert(users).values({ username: "Duplicate", email: "BUYER@example.com", passwordHash: "x" }));
      await assert.rejects(db.insert(categories).values({ name: "FOOD" }));
      assert.equal((await db.select().from(products).where(ilike(products.name, "%RICE%"))).length, 1);
    });

    await t.test("cart actions and COD checkout snapshot prices, deduct stock, and clear cart", async () => {
      const { items } = await seed();
      await assert.rejects(cart.addToCart(form({ productId: items[0].id, quantity: 2 })), /REDIRECT:\/cart\?added=1/);
      const [line] = await db.select().from(cartItems);
      await cart.changeCartQuantity(form({ cartItemId: line.id, action: "increase" }));
      await assert.rejects(checkout(shipping()), /REDIRECT:\/orders\/1\?success=1/);
      const [order] = await db.select().from(orders);
      assert.equal(order.totalAmount, "37.50");
      assert.equal(order.status, "PENDING");
      assert.equal((await db.select().from(orderItems))[0].productName, "Rice");
      assert.equal((await db.select().from(orderShops))[0].subtotal, "37.50");
      assert.equal((await db.select().from(products).where(eq(products.id, items[0].id)))[0].stock, 7);
      assert.equal((await db.select().from(cartItems)).length, 0);
    });

    await t.test("late stock-update failure rolls back orders, snapshots, earlier deductions and cart deletion", async () => {
      const { items } = await seed();
      await db.insert(cartItems).values(items.map((p) => ({ userId: actor.id, productId: p.id, quantity: 1 })));
      // Test-only trigger simulates a failed guarded update after an earlier write.
      await engine.exec(`CREATE FUNCTION test_skip_stock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.id = ${items[1].id} THEN RETURN NULL; END IF; RETURN NEW; END $$;
        CREATE TRIGGER test_skip_stock BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION test_skip_stock();`);
      try {
        await assert.rejects(checkout(shipping()), /REDIRECT:\/checkout\?error=stock/);
        assert.equal((await db.select().from(orders)).length, 0);
        assert.equal((await db.select().from(orderItems)).length, 0);
        assert.equal((await db.select().from(orderShops)).length, 0);
        assert.deepEqual((await db.select().from(products)).map((p) => p.stock), [10, 10]);
        assert.equal((await db.select().from(cartItems)).length, 2);
      } finally {
        await engine.exec("DROP TRIGGER test_skip_stock ON products; DROP FUNCTION test_skip_stock();");
      }
    });

    await t.test("cancellation returns stock once and recalculates total and status", async () => {
      const { items } = await seed();
      await db.insert(cartItems).values({ userId: actor.id, productId: items[0].id, quantity: 2 });
      await assert.rejects(checkout(shipping()), /REDIRECT:/);
      const [shopOrder] = await db.select().from(orderShops);
      await customer.cancelOrderShop(form({ orderShopId: shopOrder.id }));
      await assert.rejects(customer.cancelOrderShop(form({ orderShopId: shopOrder.id })), /no longer be cancelled/);
      assert.equal((await db.select().from(products).where(eq(products.id, items[0].id)))[0].stock, 10);
      const [order] = await db.select().from(orders);
      assert.equal(order.status, "CANCELLED");
      assert.equal(order.totalAmount, "0.00");
    });

    await t.test("multi-shop checkout and partial cancellation preserve remaining subtotal and stock", async () => {
      const { items } = await seed();
      const [owner] = await db.insert(users).values({ username: "Other Seller", email: "other@example.com", passwordHash: "x", role: "SELLER" }).returning();
      const [shop] = await db.insert(shops).values({ ownerId: owner.id, name: "Other Shop", description: "Test", phone: "0800000000", address: "Test" }).returning();
      const [product] = await db.insert(products).values({ shopId: shop.id, name: "Other product", description: "Test", price: "7.25", stock: 5 }).returning();
      await db.insert(cartItems).values([
        { userId: actor.id, productId: items[0].id, quantity: 2 },
        { userId: actor.id, productId: product.id, quantity: 1 },
      ]);
      await assert.rejects(checkout(shipping()), /REDIRECT:/);
      assert.equal((await db.select().from(orders))[0].totalAmount, "32.25");
      const parts = await db.select().from(orderShops);
      assert.equal(parts.length, 2);
      await customer.cancelOrderShop(form({ orderShopId: parts.find((part) => part.shopId !== shop.id).id }));
      const [order] = await db.select().from(orders);
      assert.equal(order.totalAmount, "7.25");
      assert.equal(order.status, "PENDING");
      assert.equal((await db.select().from(products).where(eq(products.id, items[0].id)))[0].stock, 10);
      assert.equal((await db.select().from(products).where(eq(products.id, product.id)))[0].stock, 4);
    });

    await t.test("seller confirms and ships; only buyer completion finishes the order", async () => {
      const { people, items } = await seed();
      await db.insert(cartItems).values({ userId: actor.id, productId: items[0].id, quantity: 1 });
      await assert.rejects(checkout(shipping()), /REDIRECT:/);
      const [shopOrder] = await db.select().from(orderShops);
      actor = people[1];
      await assert.rejects(seller.advanceSellerOrder(form({ orderShopId: shopOrder.id, nextStatus: "COMPLETED" })), /Invalid order status transition/);
      await seller.advanceSellerOrder(form({ orderShopId: shopOrder.id, nextStatus: "CONFIRMED" }));
      await seller.advanceSellerOrder(form({ orderShopId: shopOrder.id, nextStatus: "SHIPPED" }));
      actor = people[0];
      await customer.confirmReceived(form({ orderShopId: shopOrder.id }));
      assert.equal((await db.select().from(orders))[0].status, "COMPLETED");
    });

    await t.test("admin approval preserves role promotion, shop creation and suspension", async () => {
      const { people } = await seed();
      const [request] = await db.insert(shopRequests).values({ userId: people[0].id, shopName: "New Shop", description: "Test", phone: "0800000000", address: "Test" }).returning();
      actor = people[2];
      await adminRequests.approveShopRequest(form({ requestId: request.id }));
      assert.equal((await db.select().from(users).where(eq(users.id, people[0].id)))[0].role, "SELLER");
      assert.equal((await db.select().from(shopRequests))[0].status, "APPROVED");
      await adminUsers.toggleUserStatus(form({ userId: people[0].id }));
      assert.equal((await db.select().from(users).where(eq(users.id, people[0].id)))[0].status, "SUSPENDED");
      await assert.rejects(adminUsers.toggleUserStatus(form({ userId: actor.id })), /cannot suspend your own/);
    });

    await t.test("foreign keys preserve order snapshots and protect ordered users", async () => {
      const { items } = await seed();
      await db.insert(cartItems).values({ userId: actor.id, productId: items[0].id, quantity: 1 });
      await assert.rejects(checkout(shipping()), /REDIRECT:/);
      await assert.rejects(db.delete(users).where(eq(users.id, actor.id)));
      await db.delete(products).where(eq(products.id, items[0].id));
      const [snapshot] = await db.select().from(orderItems);
      assert.equal(snapshot.productId, null);
      assert.equal(snapshot.productName, "Rice");
      assert.equal(snapshot.price, "12.50");
    });

    await t.test("auth mapping requires a real auth UUID and cascades without deleting marketplace user", async () => {
      await seed();
      const uuid = "00000000-0000-4000-8000-000000000001";
      await assert.rejects(db.insert(authIdentities).values({ supabaseUserId: uuid, userId: actor.id }));
      await engine.query("INSERT INTO auth.users(id) VALUES ($1)", [uuid]);
      await db.insert(authIdentities).values({ supabaseUserId: uuid, userId: actor.id });
      await engine.query("DELETE FROM auth.users WHERE id=$1", [uuid]);
      assert.equal((await db.select().from(authIdentities)).length, 0);
      assert.equal((await db.select().from(users)).length, 3);
    });

    await t.test("RLS denies marketplace reads/writes to a browser API role", async () => {
      await seed();
      await engine.exec("CREATE ROLE phase2_browser; GRANT USAGE ON SCHEMA public TO phase2_browser; GRANT SELECT, INSERT ON users TO phase2_browser; SET ROLE phase2_browser;");
      try {
        assert.equal((await engine.query("SELECT * FROM users")).rows.length, 0);
        await assert.rejects(engine.query("INSERT INTO users(id, username, email, password_hash) VALUES (900, 'x', 'x@example.com', 'x')"));
      } finally { await engine.exec("RESET ROLE"); }
    });

    await t.test("mixed-case legacy email stays unlinked rather than creating another profile", async () => {
      await seed();
      await db.update(users).set({ email: "BUYER@example.com" }).where(eq(users.id, actor.id));
      const uuid = "00000000-0000-4000-8000-000000000002";
      const profile = load("src/lib/supabase/profile.ts", {
        "server-only": {}, "@/db": { db }, "@/db/schema": schema,
        "@/db/auth-schema": { authIdentities },
        "./server": { createClient: async () => ({ auth: {
          getClaims: async () => ({ data: { claims: { sub: uuid } } }),
          getUser: async () => ({ data: { user: { id: uuid, email: "buyer@example.com", email_confirmed_at: "now", user_metadata: {} } } }),
        } }) },
      });
      assert.equal(await profile.ensureAuthProfile(), "unlinked");
      assert.equal((await db.select().from(users)).length, 3);
      assert.equal((await db.select().from(authIdentities)).length, 0);
    });
  } finally { await engine.close(); }
});

test("runtime refuses missing, MySQL and non-transaction-pooler URLs without exposing credentials", () => {
  const old = process.env.DATABASE_URL;
  const { getRuntimeDatabaseUrl } = load("src/db/connection.ts");
  try {
    delete process.env.DATABASE_URL;
    assert.throws(getRuntimeDatabaseUrl, /DATABASE_URL is required/);
    process.env.DATABASE_URL = "mysql://name:secret@example.com/db";
    assert.throws(getRuntimeDatabaseUrl, /MySQL\/TiDB connections are retired/);
    process.env.DATABASE_URL = "postgresql://postgres:secret@db.example.supabase.co:5432/postgres";
    assert.throws(getRuntimeDatabaseUrl, /transaction mode/);
    process.env.DATABASE_URL = "postgresql://postgres.ref:secret@aws-0-region.pooler.supabase.com:6543/postgres";
    assert.equal(getRuntimeDatabaseUrl(), process.env.DATABASE_URL);
  } finally {
    if (old === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = old;
  }
});

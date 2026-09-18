import { sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  varchar,
  pgEnum,
  timestamp,
  text,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
export const userRole = pgEnum("user_role", [
    "USER",
    "SELLER",
    "ADMIN",
  ]);
export const userStatus = pgEnum("user_status", [
    "ACTIVE",
    "SUSPENDED",
  ]);
export const shopStatus = pgEnum("shop_status", [
    "ACTIVE",
    "INACTIVE",
  ]);
export const shopRequestStatus = pgEnum("shop_request_status", [
    "PENDING",
    "APPROVED",
    "REJECTED",
  ]);
export const productStatus = pgEnum("product_status", [
    "ACTIVE",
    "INACTIVE",
  ]);
export const orderStatus = pgEnum("order_status", [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ]);
export const orderShopStatus = pgEnum("order_shop_status", [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "COMPLETED",
      "CANCELLED",
    ]);

export const cartItems = pgTable(
  "cart_items",
  {
    id: integer("id")
      .generatedByDefaultAsIdentity()
      .primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    quantity: integer("quantity")
      .notNull()
      .default(1),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cart_items_product_id_idx").on(table.productId),
    uniqueIndex(
      "cart_items_user_product_unique"
    ).on(
      table.userId,
      table.productId
    ),
  ]
).enableRLS();
export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  username: varchar("username", {
    length: 100,
  }).notNull(),

  email: varchar("email", {
    length: 255,
  })
    .notNull()
    .unique(),

  passwordHash: varchar("password_hash", {
    length: 255,
  }).notNull(),

  role: userRole("role")
    .notNull()
    .default("USER"),

  status: userStatus("status")
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
]).enableRLS();
export const sessions = pgTable("sessions", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  tokenHash: varchar("token_hash", {
    length: 64,
  })
    .notNull()
    .unique(),

  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date", precision: 3 }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]).enableRLS();
export const shops = pgTable("shops", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .unique(),

  name: varchar("name", {
    length: 150,
  }).notNull(),

  description: text("description").notNull(),

  phone: varchar("phone", {
    length: 20,
  }).notNull(),

  address: text("address").notNull(),

  status: shopStatus("status")
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const shopRequests = pgTable("shop_requests", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  shopName: varchar("shop_name", {
    length: 150,
  }).notNull(),

  description: text("description").notNull(),

  phone: varchar("phone", {
    length: 20,
  }).notNull(),

  address: text("address").notNull(),

  status: shopRequestStatus("status")
    .notNull()
    .default("PENDING"),

  reviewNote: text("review_note"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date", precision: 3 }),
}, (table) => [
  index("shop_requests_user_id_idx").on(table.userId),
]).enableRLS();
export const categories = pgTable("categories", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  name: varchar("name", {
    length: 100,
  })
    .notNull()
    .unique(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("categories_name_lower_unique").on(sql`lower(${table.name})`),
]).enableRLS();

export const products = pgTable("products", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),

  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, {
      onDelete: "cascade",
    }),

  categoryId: integer("category_id").references(
    () => categories.id,
    {
      onDelete: "set null",
    }
  ),

  name: varchar("name", {
    length: 150,
  }).notNull(),

  description: text("description").notNull(),

  price: numeric("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  stock: integer("stock")
    .notNull()
    .default(0),

  imageUrl: varchar("image_url", {
    length: 500,
  }),

  status: productStatus("status")
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("products_shop_id_idx").on(table.shopId),
  index("products_category_id_idx").on(table.categoryId),
]).enableRLS();
export const orders = pgTable("orders", {
  id: integer("id")
    .generatedByDefaultAsIdentity()
    .primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "restrict",
    }),

  shippingName: varchar("shipping_name", {
    length: 150,
  }).notNull(),

  shippingPhone: varchar("shipping_phone", {
    length: 20,
  }).notNull(),

  shippingAddress: text("shipping_address")
    .notNull(),

  totalAmount: numeric("total_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  status: orderStatus("status")
    .notNull()
    .default("PENDING"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("orders_user_id_idx").on(table.userId),
]).enableRLS();

export const orderItems = pgTable("order_items", {
  id: integer("id")
    .generatedByDefaultAsIdentity()
    .primaryKey(),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, {
      onDelete: "cascade",
    }),

  productId: integer("product_id")
    .references(() => products.id, {
      onDelete: "set null",
    }),

  shopId: integer("shop_id")
    .references(() => shops.id, {
      onDelete: "set null",
    }),

  productName: varchar("product_name", {
    length: 150,
  }).notNull(),

  shopName: varchar("shop_name", {
    length: 150,
  }).notNull(),

  price: numeric("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  quantity: integer("quantity")
    .notNull(),

  subtotal: numeric("subtotal", {
    precision: 10,
    scale: 2,
  }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
  index("order_items_shop_id_idx").on(table.shopId),
]).enableRLS();
export const orderShops = pgTable(
  "order_shops",
  {
    id: integer("id")
      .generatedByDefaultAsIdentity()
      .primaryKey(),

    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    shopId: integer("shop_id")
      .references(() => shops.id, {
        onDelete: "set null",
      }),

    shopName: varchar("shop_name", {
      length: 150,
    }).notNull(),

    subtotal: numeric("subtotal", {
      precision: 10,
      scale: 2,
    }).notNull(),

    status: orderShopStatus("status")
      .notNull()
      .default("PENDING"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex(
      "order_shops_order_shop_unique"
    ).on(
      table.orderId,
      table.shopId
    ),
    index("order_shops_shop_id_idx").on(table.shopId),
  ]
).enableRLS();

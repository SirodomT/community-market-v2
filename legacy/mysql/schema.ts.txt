import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  timestamp,
  text,
  decimal,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
export const cartItems = mysqlTable(
  "cart_items",
  {
    id: int("id")
      .autoincrement()
      .primaryKey(),

    userId: int("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    productId: int("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    quantity: int("quantity")
      .notNull()
      .default(1),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex(
      "cart_items_user_product_unique"
    ).on(
      table.userId,
      table.productId
    ),
  ]
);
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

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

  role: mysqlEnum("role", [
    "USER",
    "SELLER",
    "ADMIN",
  ])
    .notNull()
    .default("USER"),

  status: mysqlEnum("status", [
    "ACTIVE",
    "SUSPENDED",
  ])
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  tokenHash: varchar("token_hash", {
    length: 64,
  })
    .notNull()
    .unique(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
export const shops = mysqlTable("shops", {
  id: int("id").autoincrement().primaryKey(),

  ownerId: int("owner_id")
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

  status: mysqlEnum("status", [
    "ACTIVE",
    "INACTIVE",
  ])
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const shopRequests = mysqlTable("shop_requests", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
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

  status: mysqlEnum("status", [
    "PENDING",
    "APPROVED",
    "REJECTED",
  ])
    .notNull()
    .default("PENDING"),

  reviewNote: text("review_note"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  reviewedAt: timestamp("reviewed_at"),
});
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", {
    length: 100,
  })
    .notNull()
    .unique(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),

  shopId: int("shop_id")
    .notNull()
    .references(() => shops.id, {
      onDelete: "cascade",
    }),

  categoryId: int("category_id").references(
    () => categories.id,
    {
      onDelete: "set null",
    }
  ),

  name: varchar("name", {
    length: 150,
  }).notNull(),

  description: text("description").notNull(),

  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  stock: int("stock")
    .notNull()
    .default(0),

  imageUrl: varchar("image_url", {
    length: 500,
  }),

  status: mysqlEnum("status", [
    "ACTIVE",
    "INACTIVE",
  ])
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});
export const orders = mysqlTable("orders", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  userId: int("user_id")
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

  totalAmount: decimal("total_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  status: mysqlEnum("status", [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ])
    .notNull()
    .default("PENDING"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, {
      onDelete: "cascade",
    }),

  productId: int("product_id")
    .references(() => products.id, {
      onDelete: "set null",
    }),

  shopId: int("shop_id")
    .references(() => shops.id, {
      onDelete: "set null",
    }),

  productName: varchar("product_name", {
    length: 150,
  }).notNull(),

  shopName: varchar("shop_name", {
    length: 150,
  }).notNull(),

  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  quantity: int("quantity")
    .notNull(),

  subtotal: decimal("subtotal", {
    precision: 10,
    scale: 2,
  }).notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
export const orderShops = mysqlTable(
  "order_shops",
  {
    id: int("id")
      .autoincrement()
      .primaryKey(),

    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    shopId: int("shop_id")
      .references(() => shops.id, {
        onDelete: "set null",
      }),

    shopName: varchar("shop_name", {
      length: 150,
    }).notNull(),

    subtotal: decimal("subtotal", {
      precision: 10,
      scale: 2,
    }).notNull(),

    status: mysqlEnum("status", [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "COMPLETED",
      "CANCELLED",
    ])
      .notNull()
      .default("PENDING"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
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
  ]
);

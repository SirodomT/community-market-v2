import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  timestamp,
  text,
} from "drizzle-orm/mysql-core";

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
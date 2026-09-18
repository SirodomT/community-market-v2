import { integer, pgSchema, pgTable, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema";

// Reference only: Supabase owns this table; Drizzle must not create/manage it.
const supabaseUsers = pgSchema("auth").table("users", { id: uuid("id").primaryKey() });

// Marketplace foreign keys continue to use the existing numeric users.id.
export const authIdentities = pgTable("auth_identities", {
  supabaseUserId: uuid("supabase_user_id").primaryKey()
    .references(() => supabaseUsers.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
}).enableRLS();

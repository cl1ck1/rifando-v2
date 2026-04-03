import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const atividadesTable = pgTable("atividades", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Atividade = typeof atividadesTable.$inferSelect;

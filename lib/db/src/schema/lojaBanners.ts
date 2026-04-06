import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const lojaBannersTable = pgTable("loja_banners", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  titulo: text("titulo"),
  linkUrl: text("link_url"),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LojaBanner = typeof lojaBannersTable.$inferSelect;

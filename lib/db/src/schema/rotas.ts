import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const rotasTable = pgTable("rotas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  cor: text("cor").notNull().default("#3b82f6"),
  status: text("status").notNull().default("planejada"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Rota = typeof rotasTable.$inferSelect;

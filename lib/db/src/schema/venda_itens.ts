import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { vendasTable } from "./vendas";

export const vendaItensTable = pgTable("venda_itens", {
  id: serial("id").primaryKey(),
  vendaId: integer("venda_id").notNull().references(() => vendasTable.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id").notNull(),
  produtoNome: text("produto_nome").notNull(),
  quantidade: integer("quantidade").notNull().default(1),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VendaItem = typeof vendaItensTable.$inferSelect;

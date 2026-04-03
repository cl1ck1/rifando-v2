import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { clientesTable } from "./clientes";

export const vendasTable = pgTable("vendas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  clienteId: integer("cliente_id").notNull().references(() => clientesTable.id),
  clienteNome: text("cliente_nome").notNull(),
  valorTotal: numeric("valor_total", { precision: 12, scale: 2 }).notNull(),
  desconto: numeric("desconto", { precision: 10, scale: 2 }).notNull().default("0"),
  valorFinal: numeric("valor_final", { precision: 12, scale: 2 }).notNull(),
  formaPagamento: text("forma_pagamento").notNull().default("parcelado"),
  numeroParcelas: integer("numero_parcelas").notNull().default(1),
  status: text("status").notNull().default("pendente"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Venda = typeof vendasTable.$inferSelect;

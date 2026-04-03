import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { vendasTable } from "./vendas";

export const parcelasTable = pgTable("parcelas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  vendaId: integer("venda_id").notNull().references(() => vendasTable.id, { onDelete: "cascade" }),
  clienteId: integer("cliente_id").notNull(),
  clienteNome: text("cliente_nome").notNull(),
  clienteTelefone: text("cliente_telefone"),
  numero: integer("numero").notNull(),
  totalParcelas: integer("total_parcelas").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: text("data_vencimento").notNull(),
  dataPagamento: text("data_pagamento"),
  metodoPagamento: text("metodo_pagamento"),
  status: text("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Parcela = typeof parcelasTable.$inferSelect;

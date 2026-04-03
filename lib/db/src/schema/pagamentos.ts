import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagamentosTable = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  clienteId: integer("cliente_id").notNull(),
  clienteNome: text("cliente_nome"),
  viagemId: integer("viagem_id"),
  viagemDestino: text("viagem_destino"),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  parcela: integer("parcela").notNull().default(1),
  totalParcelas: integer("total_parcelas").notNull().default(1),
  metodo: text("metodo").notNull().default("pix"),
  status: text("status").notNull().default("pendente"),
  dataVencimento: text("data_vencimento"),
  dataPagamento: text("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPagamentoSchema = createInsertSchema(pagamentosTable).omit({ id: true, createdAt: true, userId: true });
export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentosTable.$inferSelect;

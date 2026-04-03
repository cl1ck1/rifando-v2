import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientesTable = pgTable("clientes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cpf: text("cpf"),
  endereco: text("endereco"),
  dataNascimento: text("data_nascimento"),
  status: text("status").notNull().default("ativo"),
  notas: text("notas"),
  totalGasto: numeric("total_gasto", { precision: 12, scale: 2 }).notNull().default("0"),
  viagensCount: integer("viagens_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClienteSchema = createInsertSchema(clientesTable).omit({ id: true, createdAt: true, userId: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientesTable.$inferSelect;

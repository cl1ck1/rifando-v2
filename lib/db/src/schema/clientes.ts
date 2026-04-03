import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const clientesTable = pgTable("clientes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email"),
  cpf: text("cpf"),
  endereco: text("endereco"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  referencia: text("referencia"),
  observacoes: text("observacoes"),
  status: text("status").notNull().default("ativo"),
  totalCompras: numeric("total_compras", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Cliente = typeof clientesTable.$inferSelect;

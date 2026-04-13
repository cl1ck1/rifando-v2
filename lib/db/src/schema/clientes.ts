import { pgTable, serial, integer, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { rotaParadasTable } from "./rotaParadas";

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
  tagLocalizacao: text("tag_localizacao"),
  rotaParadaId: integer("rota_parada_id").references(() => rotaParadasTable.id, { onDelete: "set null" }),
  tags: jsonb("tags").$type<string[]>().default([]),
  score: integer("score").default(0),
  ultimoContato: text("ultimo_contato"),
  observacoesCrm: text("observacoes_crm"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Cliente = typeof clientesTable.$inferSelect;

import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const notificacoesTable = pgTable("notificacoes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tipo: text("tipo").notNull(), // parcela_vencendo, cobranca_pendente, venda_nova
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  referenciaId: integer("referencia_id"), // parcelaId, vendaId, etc.
  lida: boolean("lida").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoesTable.$inferSelect;

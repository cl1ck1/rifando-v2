import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { parcelasTable } from "./parcelas";

export const cobrancaLogsTable = pgTable("cobranca_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  parcelaId: integer("parcela_id").notNull().references(() => parcelasTable.id, { onDelete: "cascade" }),
  clienteId: integer("cliente_id").notNull(),
  clienteNome: text("cliente_nome").notNull(),
  clienteTelefone: text("cliente_telefone"),
  tipo: text("tipo").notNull().default("whatsapp"), // whatsapp, sms, manual
  status: text("status").notNull().default("enviada"), // enviada, respondida, ignorada
  mensagem: text("mensagem"),
  enviadoEm: timestamp("enviado_em").defaultNow().notNull(),
  resposta: text("resposta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CobrancaLog = typeof cobrancaLogsTable.$inferSelect;

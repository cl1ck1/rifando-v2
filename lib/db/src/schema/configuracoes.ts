import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const configuracoesTable = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  nomeEmpresa: text("nome_empresa"),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  logoUrl: text("logo_url"),
  corPrimaria: text("cor_primaria"),
  mensagemBoasVindas: text("mensagem_boas_vindas"),
  pixChave: text("pix_chave"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConfiguracoesSchema = createInsertSchema(configuracoesTable).omit({ id: true, createdAt: true, userId: true });
export type InsertConfiguracoes = z.infer<typeof insertConfiguracoesSchema>;
export type Configuracoes = typeof configuracoesTable.$inferSelect;

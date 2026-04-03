import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const configuracoesTable = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  nomeNegocio: text("nome_negocio"),
  telefoneWhatsapp: text("telefone_whatsapp"),
  logoUrl: text("logo_url"),
  catalogoSlug: text("catalogo_slug"),
  catalogoAtivo: boolean("catalogo_ativo").notNull().default(false),
  cidade: text("cidade"),
  estado: text("estado"),
  chavePix: text("chave_pix"),
  mensagemBoasVindas: text("mensagem_boas_vindas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Configuracoes = typeof configuracoesTable.$inferSelect;

import { pgTable, serial, text, numeric, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const produtosTable = pgTable("produtos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  precoCusto: numeric("preco_custo", { precision: 10, scale: 2 }),
  precoVenda: numeric("preco_venda", { precision: 10, scale: 2 }).notNull(),
  imagemUrl: text("imagem_url"),
  categoriaId: integer("categoria_id"),
  categoriaNome: text("categoria_nome"),
  estoque: integer("estoque").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Produto = typeof produtosTable.$inferSelect;

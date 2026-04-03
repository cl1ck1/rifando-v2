import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const viagensTable = pgTable("viagens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  destino: text("destino").notNull(),
  descricao: text("descricao"),
  dataPartida: timestamp("data_partida").notNull(),
  dataRetorno: timestamp("data_retorno").notNull(),
  assentosTotal: integer("assentos_total").notNull(),
  assentosVendidos: integer("assentos_vendidos").notNull().default(0),
  precoPorAssento: numeric("preco_por_assento", { precision: 10, scale: 2 }).notNull(),
  paradasRota: text("paradas_rota"),
  status: text("status").notNull().default("planejada"),
  imagemUrl: text("imagem_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertViagemSchema = createInsertSchema(viagensTable).omit({ id: true, createdAt: true, userId: true });
export type InsertViagem = z.infer<typeof insertViagemSchema>;
export type Viagem = typeof viagensTable.$inferSelect;

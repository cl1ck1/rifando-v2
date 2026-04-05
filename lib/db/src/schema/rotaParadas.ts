import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { rotasTable } from "./rotas";

export const rotaParadasTable = pgTable("rota_paradas", {
  id: serial("id").primaryKey(),
  rotaId: integer("rota_id").notNull().references(() => rotasTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  ordem: integer("ordem").notNull().default(0),
  nome: text("nome").notNull(),
  estado: text("estado"),
  enderecoCompleto: text("endereco_completo"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RotaParada = typeof rotaParadasTable.$inferSelect;

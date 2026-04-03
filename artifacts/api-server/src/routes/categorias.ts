import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriasTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  CreateCategoriaBody,
  DeleteCategoriaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categorias", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const categorias = await db.select().from(categoriasTable)
    .where(eq(categoriasTable.userId, userId))
    .orderBy(sql`${categoriasTable.nome} ASC`);

  res.json(categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    createdAt: c.createdAt?.toISOString(),
  })));
});

router.post("/categorias", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateCategoriaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(categoriasTable).values({
    userId,
    nome: parsed.data.nome,
  }).returning();

  res.status(201).json({
    id: created.id,
    nome: created.nome,
    createdAt: created.createdAt?.toISOString(),
  });
});

router.delete("/categorias/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteCategoriaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const existing = await db.select().from(categoriasTable)
    .where(and(eq(categoriasTable.id, id), eq(categoriasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Categoria nao encontrada" });
    return;
  }

  await db.delete(categoriasTable).where(eq(categoriasTable.id, id));
  res.sendStatus(204);
});

export default router;

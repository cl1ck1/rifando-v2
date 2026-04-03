import { Router } from "express";
import { db } from "@workspace/db";
import { categoriasTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/categorias", requireAuth, async (req, res) => {
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

router.post("/categorias", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;

  const [created] = await db.insert(categoriasTable).values({
    userId,
    nome: req.body.nome,
  }).returning();

  res.status(201).json({
    id: created.id,
    nome: created.nome,
    createdAt: created.createdAt?.toISOString(),
  });
});

router.delete("/categorias/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(categoriasTable)
    .where(and(eq(categoriasTable.id, id), eq(categoriasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Categoria nao encontrada" });
    return;
  }

  await db.delete(categoriasTable).where(eq(categoriasTable.id, id));
  res.status(204).send();
});

export default router;

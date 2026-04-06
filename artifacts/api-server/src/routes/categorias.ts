import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriasTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  CreateCategoriaBody,
  UpdateCategoriaBody,
  DeleteCategoriaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categorias", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const categorias = await db.select().from(categoriasTable)
    .where(eq(categoriasTable.userId, userId))
    .orderBy(asc(categoriasTable.ordem));

  res.json(categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    cor: c.cor,
    ordem: c.ordem,
    exibirNoCatalogo: c.exibirNoCatalogo,
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
    cor: parsed.data.cor ?? null,
    ordem: parsed.data.ordem ?? 0,
    exibirNoCatalogo: parsed.data.exibirNoCatalogo ?? true,
  }).returning();

  res.status(201).json({
    id: created.id,
    nome: created.nome,
    cor: created.cor,
    ordem: created.ordem,
    exibirNoCatalogo: created.exibirNoCatalogo,
    createdAt: created.createdAt?.toISOString(),
  });
});

router.patch("/categorias/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteCategoriaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalido" });
    return;
  }
  const { id } = params.data;

  const parsed = UpdateCategoriaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select({ id: categoriasTable.id }).from(categoriasTable)
    .where(and(eq(categoriasTable.id, id), eq(categoriasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Categoria nao encontrada" });
    return;
  }

  const updates: Record<string, string | number | boolean | null> = {};
  if (parsed.data.nome !== undefined) updates.nome = parsed.data.nome;
  if (parsed.data.cor !== undefined) updates.cor = parsed.data.cor ?? null;
  if (parsed.data.ordem !== undefined) updates.ordem = parsed.data.ordem;
  if (parsed.data.exibirNoCatalogo !== undefined) updates.exibirNoCatalogo = parsed.data.exibirNoCatalogo;

  const [updated] = await db.update(categoriasTable)
    .set(updates)
    .where(and(eq(categoriasTable.id, id), eq(categoriasTable.userId, userId)))
    .returning();

  res.json({
    id: updated.id,
    nome: updated.nome,
    cor: updated.cor,
    ordem: updated.ordem,
    exibirNoCatalogo: updated.exibirNoCatalogo,
    createdAt: updated.createdAt?.toISOString(),
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

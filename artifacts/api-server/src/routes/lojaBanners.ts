import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { lojaBannersTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  CreateLojaBannerBody,
  UpdateLojaBannerBody,
  DeleteLojaBannerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/loja-banners", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const banners = await db.select().from(lojaBannersTable)
    .where(eq(lojaBannersTable.userId, userId))
    .orderBy(asc(lojaBannersTable.ordem));

  res.json(banners.map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    titulo: b.titulo,
    linkUrl: b.linkUrl,
    ordem: b.ordem,
    ativo: b.ativo,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.post("/loja-banners", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateLojaBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(lojaBannersTable).values({
    userId,
    imageUrl: parsed.data.imageUrl,
    titulo: parsed.data.titulo ?? null,
    linkUrl: parsed.data.linkUrl ?? null,
    ordem: parsed.data.ordem ?? 0,
    ativo: parsed.data.ativo ?? true,
  }).returning();

  res.status(201).json({
    id: created.id,
    imageUrl: created.imageUrl,
    titulo: created.titulo,
    linkUrl: created.linkUrl,
    ordem: created.ordem,
    ativo: created.ativo,
    createdAt: created.createdAt.toISOString(),
  });
});

router.patch("/loja-banners/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteLojaBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalido" });
    return;
  }

  const parsed = UpdateLojaBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select({ id: lojaBannersTable.id }).from(lojaBannersTable)
    .where(and(eq(lojaBannersTable.id, params.data.id), eq(lojaBannersTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Banner nao encontrado" });
    return;
  }

  const updates: Record<string, string | number | boolean | null> = {};
  if (parsed.data.imageUrl !== undefined) updates.imageUrl = parsed.data.imageUrl;
  if (parsed.data.titulo !== undefined) updates.titulo = parsed.data.titulo ?? null;
  if (parsed.data.linkUrl !== undefined) updates.linkUrl = parsed.data.linkUrl ?? null;
  if (parsed.data.ordem !== undefined) updates.ordem = parsed.data.ordem;
  if (parsed.data.ativo !== undefined) updates.ativo = parsed.data.ativo;

  const [updated] = await db.update(lojaBannersTable)
    .set(updates)
    .where(and(eq(lojaBannersTable.id, params.data.id), eq(lojaBannersTable.userId, userId)))
    .returning();

  res.json({
    id: updated.id,
    imageUrl: updated.imageUrl,
    titulo: updated.titulo,
    linkUrl: updated.linkUrl,
    ordem: updated.ordem,
    ativo: updated.ativo,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/loja-banners/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteLojaBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalido" });
    return;
  }

  const existing = await db.select({ id: lojaBannersTable.id }).from(lojaBannersTable)
    .where(and(eq(lojaBannersTable.id, params.data.id), eq(lojaBannersTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Banner nao encontrado" });
    return;
  }

  await db.delete(lojaBannersTable).where(and(
    eq(lojaBannersTable.id, params.data.id),
    eq(lojaBannersTable.userId, userId)
  ));
  res.sendStatus(204);
});

export default router;

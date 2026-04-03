import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { configuracoesTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  UpdateConfiguracoesBody,
} from "@workspace/api-zod";

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const router: IRouter = Router();

router.get("/configuracoes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  let results = await db.select().from(configuracoesTable)
    .where(eq(configuracoesTable.userId, userId))
    .limit(1);

  if (results.length === 0) {
    const [created] = await db.insert(configuracoesTable).values({ userId }).returning();
    results = [created];
  }

  const c = results[0];
  res.json({
    id: c.id,
    nomeNegocio: c.nomeNegocio,
    telefoneWhatsapp: c.telefoneWhatsapp,
    logoUrl: c.logoUrl,
    catalogoSlug: c.catalogoSlug,
    catalogoAtivo: c.catalogoAtivo,
    cidade: c.cidade,
    estado: c.estado,
    chavePix: c.chavePix,
    mensagemBoasVindas: c.mensagemBoasVindas,
  });
});

router.put("/configuracoes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = UpdateConfiguracoesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(configuracoesTable)
    .where(eq(configuracoesTable.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(configuracoesTable).values({ userId });
  }

  if (parsed.data.catalogoSlug !== undefined && parsed.data.catalogoSlug !== null) {
    const normalized = normalizeSlug(parsed.data.catalogoSlug);
    if (!normalized) {
      res.status(400).json({ error: "Slug do catalogo invalido" });
      return;
    }
    parsed.data.catalogoSlug = normalized;

    const conflict = await db.select({ id: configuracoesTable.id }).from(configuracoesTable)
      .where(and(
        eq(configuracoesTable.catalogoSlug, normalized),
        ne(configuracoesTable.userId, userId)
      ))
      .limit(1);

    if (conflict.length > 0) {
      res.status(409).json({ error: "Este slug ja esta em uso por outra loja" });
      return;
    }
  }

  const updates: Record<string, string | boolean | null> = {};
  if (parsed.data.nomeNegocio !== undefined) updates.nomeNegocio = parsed.data.nomeNegocio ?? null;
  if (parsed.data.telefoneWhatsapp !== undefined) updates.telefoneWhatsapp = parsed.data.telefoneWhatsapp ?? null;
  if (parsed.data.logoUrl !== undefined) updates.logoUrl = parsed.data.logoUrl ?? null;
  if (parsed.data.catalogoSlug !== undefined) updates.catalogoSlug = parsed.data.catalogoSlug ?? null;
  if (parsed.data.catalogoAtivo !== undefined) updates.catalogoAtivo = parsed.data.catalogoAtivo;
  if (parsed.data.cidade !== undefined) updates.cidade = parsed.data.cidade ?? null;
  if (parsed.data.estado !== undefined) updates.estado = parsed.data.estado ?? null;
  if (parsed.data.chavePix !== undefined) updates.chavePix = parsed.data.chavePix ?? null;
  if (parsed.data.mensagemBoasVindas !== undefined) updates.mensagemBoasVindas = parsed.data.mensagemBoasVindas ?? null;

  const [updated] = await db.update(configuracoesTable)
    .set(updates)
    .where(eq(configuracoesTable.userId, userId))
    .returning();

  res.json({
    id: updated.id,
    nomeNegocio: updated.nomeNegocio,
    telefoneWhatsapp: updated.telefoneWhatsapp,
    logoUrl: updated.logoUrl,
    catalogoSlug: updated.catalogoSlug,
    catalogoAtivo: updated.catalogoAtivo,
    cidade: updated.cidade,
    estado: updated.estado,
    chavePix: updated.chavePix,
    mensagemBoasVindas: updated.mensagemBoasVindas,
  });
});

export default router;

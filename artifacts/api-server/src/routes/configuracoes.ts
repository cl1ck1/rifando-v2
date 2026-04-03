import { Router } from "express";
import { db } from "@workspace/db";
import { configuracoesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/configuracoes", requireAuth, async (req, res) => {
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

router.put("/configuracoes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;

  let existing = await db.select().from(configuracoesTable)
    .where(eq(configuracoesTable.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(configuracoesTable).values({ userId });
  }

  const updates: Record<string, string | boolean | null> = {};
  const fields = ["nomeNegocio", "telefoneWhatsapp", "logoUrl", "catalogoSlug", "cidade", "estado", "chavePix", "mensagemBoasVindas"] as const;
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  if (req.body.catalogoAtivo !== undefined) {
    updates.catalogoAtivo = req.body.catalogoAtivo;
  }

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

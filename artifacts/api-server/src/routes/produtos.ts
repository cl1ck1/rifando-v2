import { Router } from "express";
import { db } from "@workspace/db";
import { produtosTable, categoriasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/produtos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { categoriaId, ativo } = req.query;

  let conditions = [eq(produtosTable.userId, userId)];

  if (categoriaId && typeof categoriaId === "string") {
    conditions.push(eq(produtosTable.categoriaId, parseInt(categoriaId, 10)));
  }
  if (ativo !== undefined && typeof ativo === "string") {
    conditions.push(eq(produtosTable.ativo, ativo === "true"));
  }

  const produtos = await db.select().from(produtosTable)
    .where(and(...conditions))
    .orderBy(sql`${produtosTable.nome} ASC`);

  const mapped = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
    precoVenda: Number(p.precoVenda),
    imagemUrl: p.imagemUrl,
    categoriaId: p.categoriaId,
    categoriaNome: p.categoriaNome,
    estoque: p.estoque,
    ativo: p.ativo,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(mapped);
});

router.post("/produtos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;

  let categoriaNome: string | null = null;
  if (req.body.categoriaId) {
    const cat = await db.select().from(categoriasTable)
      .where(and(eq(categoriasTable.id, req.body.categoriaId), eq(categoriasTable.userId, userId)))
      .limit(1);
    if (cat.length > 0) categoriaNome = cat[0].nome;
  }

  const [created] = await db.insert(produtosTable).values({
    userId,
    nome: req.body.nome,
    descricao: req.body.descricao || null,
    precoCusto: req.body.precoCusto ? Number(req.body.precoCusto).toFixed(2) : null,
    precoVenda: Number(req.body.precoVenda).toFixed(2),
    imagemUrl: req.body.imagemUrl || null,
    categoriaId: req.body.categoriaId || null,
    categoriaNome,
    estoque: req.body.estoque || 0,
    ativo: req.body.ativo !== undefined ? req.body.ativo : true,
  }).returning();

  await db.insert(atividadesTable).values({
    userId,
    type: "produto",
    description: `Novo produto cadastrado: ${created.nome}`,
  });

  res.status(201).json({
    id: created.id,
    nome: created.nome,
    descricao: created.descricao,
    precoCusto: created.precoCusto ? Number(created.precoCusto) : null,
    precoVenda: Number(created.precoVenda),
    imagemUrl: created.imagemUrl,
    categoriaId: created.categoriaId,
    categoriaNome: created.categoriaNome,
    estoque: created.estoque,
    ativo: created.ativo,
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const results = await db.select().from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "Produto nao encontrado" });
    return;
  }

  const p = results[0];
  res.json({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
    precoVenda: Number(p.precoVenda),
    imagemUrl: p.imagemUrl,
    categoriaId: p.categoriaId,
    categoriaNome: p.categoriaNome,
    estoque: p.estoque,
    ativo: p.ativo,
    createdAt: p.createdAt.toISOString(),
  });
});

router.patch("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Produto nao encontrado" });
    return;
  }

  const updates: Record<string, string | number | boolean | null> = {};
  if (req.body.nome !== undefined) updates.nome = req.body.nome;
  if (req.body.descricao !== undefined) updates.descricao = req.body.descricao;
  if (req.body.precoCusto !== undefined) updates.precoCusto = Number(req.body.precoCusto).toFixed(2);
  if (req.body.precoVenda !== undefined) updates.precoVenda = Number(req.body.precoVenda).toFixed(2);
  if (req.body.imagemUrl !== undefined) updates.imagemUrl = req.body.imagemUrl;
  if (req.body.categoriaId !== undefined) updates.categoriaId = req.body.categoriaId;
  if (req.body.estoque !== undefined) updates.estoque = req.body.estoque;
  if (req.body.ativo !== undefined) updates.ativo = req.body.ativo;

  if (req.body.categoriaId) {
    const cat = await db.select().from(categoriasTable)
      .where(and(eq(categoriasTable.id, req.body.categoriaId), eq(categoriasTable.userId, userId)))
      .limit(1);
    if (cat.length > 0) updates.categoriaNome = cat[0].nome;
  }

  const [updated] = await db.update(produtosTable).set(updates).where(eq(produtosTable.id, id)).returning();

  res.json({
    id: updated.id,
    nome: updated.nome,
    descricao: updated.descricao,
    precoCusto: updated.precoCusto ? Number(updated.precoCusto) : null,
    precoVenda: Number(updated.precoVenda),
    imagemUrl: updated.imagemUrl,
    categoriaId: updated.categoriaId,
    categoriaNome: updated.categoriaNome,
    estoque: updated.estoque,
    ativo: updated.ativo,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Produto nao encontrado" });
    return;
  }

  await db.delete(produtosTable).where(eq(produtosTable.id, id));
  res.status(204).send();
});

export default router;

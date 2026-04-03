import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { produtosTable, categoriasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListProdutosQueryParams,
  CreateProdutoBody,
  GetProdutoParams,
  UpdateProdutoParams,
  UpdateProdutoBody,
  DeleteProdutoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/produtos", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const query = ListProdutosQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(produtosTable.userId, userId)];

  if (query.data.categoriaId) {
    conditions.push(eq(produtosTable.categoriaId, query.data.categoriaId));
  }
  if (query.data.ativo !== undefined) {
    conditions.push(eq(produtosTable.ativo, query.data.ativo));
  }

  const produtos = await db.select().from(produtosTable)
    .where(and(...conditions))
    .orderBy(sql`${produtosTable.nome} ASC`);

  res.json(produtos.map((p) => ({
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
  })));
});

router.post("/produtos", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateProdutoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let categoriaNome: string | null = null;
  if (parsed.data.categoriaId) {
    const cat = await db.select().from(categoriasTable)
      .where(and(eq(categoriasTable.id, parsed.data.categoriaId), eq(categoriasTable.userId, userId)))
      .limit(1);
    if (cat.length > 0) categoriaNome = cat[0].nome;
  }

  const [created] = await db.insert(produtosTable).values({
    userId,
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    precoCusto: parsed.data.precoCusto ? Number(parsed.data.precoCusto).toFixed(2) : null,
    precoVenda: Number(parsed.data.precoVenda).toFixed(2),
    imagemUrl: parsed.data.imagemUrl || null,
    categoriaId: parsed.data.categoriaId || null,
    categoriaNome,
    estoque: parsed.data.estoque || 0,
    ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
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

router.get("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

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

router.patch("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const parsed = UpdateProdutoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Produto nao encontrado" });
    return;
  }

  const updates: Record<string, string | number | boolean | null> = {};
  if (parsed.data.nome !== undefined) updates.nome = parsed.data.nome;
  if (parsed.data.descricao !== undefined) updates.descricao = parsed.data.descricao ?? null;
  if (parsed.data.precoCusto !== undefined) updates.precoCusto = Number(parsed.data.precoCusto).toFixed(2);
  if (parsed.data.precoVenda !== undefined) updates.precoVenda = Number(parsed.data.precoVenda).toFixed(2);
  if (parsed.data.imagemUrl !== undefined) updates.imagemUrl = parsed.data.imagemUrl ?? null;
  if (parsed.data.categoriaId !== undefined) updates.categoriaId = parsed.data.categoriaId ?? null;
  if (parsed.data.estoque !== undefined) updates.estoque = parsed.data.estoque;
  if (parsed.data.ativo !== undefined) updates.ativo = parsed.data.ativo;

  if (parsed.data.categoriaId) {
    const cat = await db.select().from(categoriasTable)
      .where(and(eq(categoriasTable.id, parsed.data.categoriaId), eq(categoriasTable.userId, userId)))
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

router.delete("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const existing = await db.select().from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Produto nao encontrado" });
    return;
  }

  await db.delete(produtosTable).where(eq(produtosTable.id, id));
  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { configuracoesTable, produtosTable, categoriasTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/catalogo/:slug", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const slug = raw?.toLowerCase().trim();

    if (!slug) {
      res.status(400).json({ error: "Slug invalido" });
      return;
    }

    const configs = await db.select().from(configuracoesTable)
      .where(and(
        eq(configuracoesTable.catalogoSlug, slug),
        eq(configuracoesTable.catalogoAtivo, true)
      ))
      .limit(1);

    if (configs.length === 0) {
      res.status(404).json({ error: "Loja nao encontrada" });
      return;
    }

    const config = configs[0];

    const produtos = await db.select().from(produtosTable)
      .where(and(
        eq(produtosTable.userId, config.userId),
        eq(produtosTable.ativo, true)
      ))
      .orderBy(sql`${produtosTable.nome} ASC`);

    const categorias = await db.select().from(categoriasTable)
      .where(eq(categoriasTable.userId, config.userId))
      .orderBy(sql`${categoriasTable.nome} ASC`);

    res.json({
      loja: {
        nomeNegocio: config.nomeNegocio || "Loja",
        logoUrl: config.logoUrl,
        cidade: config.cidade,
        estado: config.estado,
        telefoneWhatsapp: config.telefoneWhatsapp,
        mensagemBoasVindas: config.mensagemBoasVindas,
      },
      categorias: categorias.map((c) => ({
        id: c.id,
        nome: c.nome,
      })),
      produtos: produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        precoVenda: Number(p.precoVenda),
        imagemUrl: p.imagemUrl,
        categoriaId: p.categoriaId,
        categoriaNome: p.categoriaNome,
        estoque: p.estoque,
      })),
    });
  } catch (err) {
    console.error("Erro ao carregar catalogo:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;

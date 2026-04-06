import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { configuracoesTable, produtosTable, categoriasTable, lojaBannersTable } from "@workspace/db";
import { eq, and, asc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/catalogo/:slug", async (req, res): Promise<void> => {
  try {
    const slug = (req.params.slug as string).toLowerCase().trim();

    if (!slug) {
      res.status(400).json({ error: "Slug invalido" });
      return;
    }

    const configs = await db.select().from(configuracoesTable)
      .where(and(
        eq(configuracoesTable.catalogoSlug, slug),
        eq(configuracoesTable.catalogoAtivo, true)
      ));

    if (configs.length === 0) {
      res.status(404).json({ error: "Loja nao encontrada" });
      return;
    }

    const config = configs[0];

    const [produtos, categorias, banners] = await Promise.all([
      db.select().from(produtosTable)
        .where(and(
          eq(produtosTable.userId, config.userId),
          eq(produtosTable.ativo, true)
        ))
        .orderBy(sql`${produtosTable.nome} ASC`),

      db.select().from(categoriasTable)
        .where(and(
          eq(categoriasTable.userId, config.userId),
          eq(categoriasTable.exibirNoCatalogo, true)
        ))
        .orderBy(asc(categoriasTable.ordem)),

      db.select().from(lojaBannersTable)
        .where(and(
          eq(lojaBannersTable.userId, config.userId),
          eq(lojaBannersTable.ativo, true)
        ))
        .orderBy(asc(lojaBannersTable.ordem)),
    ]);

    res.json({
      loja: {
        nomeNegocio: config.nomeNegocio || "Loja",
        logoUrl: config.logoUrl,
        bannerPrincipalUrl: config.bannerPrincipalUrl,
        corPrincipal: config.corPrincipal,
        corSecundaria: config.corSecundaria,
        descricao: config.descricao,
        cidade: config.cidade,
        estado: config.estado,
        telefoneWhatsapp: config.telefoneWhatsapp,
        mensagemBoasVindas: config.mensagemBoasVindas,
      },
      banners: banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        titulo: b.titulo,
        linkUrl: b.linkUrl,
        ordem: b.ordem,
      })),
      categorias: categorias.map((c) => ({
        id: c.id,
        nome: c.nome,
        cor: c.cor,
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

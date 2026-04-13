import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificacoesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /notificacoes — listar notificações do usuário
router.get("/notificacoes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const notificacoes = await db.select().from(notificacoesTable)
    .where(eq(notificacoesTable.userId, userId))
    .orderBy(desc(notificacoesTable.createdAt))
    .limit(50);

  const naoLidas = await db.select({ count: sql<number>`count(*)::int` })
    .from(notificacoesTable)
    .where(and(eq(notificacoesTable.userId, userId), eq(notificacoesTable.lida, false)));

  res.json({
    naoLidas: naoLidas[0]?.count || 0,
    notificacoes: notificacoes.map(n => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      descricao: n.descricao,
      referenciaId: n.referenciaId,
      lida: n.lida,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

// POST /notificacoes/:id/lida — marcar como lida
router.post("/notificacoes/:id/lida", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  await db.update(notificacoesTable)
    .set({ lida: true })
    .where(and(eq(notificacoesTable.id, id), eq(notificacoesTable.userId, userId)));

  res.json({ ok: true });
});

// POST /notificacoes/lida-todas — marcar todas como lidas
router.post("/notificacoes/lida-todas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  await db.update(notificacoesTable)
    .set({ lida: true })
    .where(and(eq(notificacoesTable.userId, userId), eq(notificacoesTable.lida, false)));

  res.json({ ok: true });
});

// GET /notificacoes/gerar-parcelas-vencendo — gera notificações para parcelas vencendo (chamado pelo scheduler)
router.post("/notificacoes/gerar-parcelas-vencendo", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  // Buscar parcelas que vencem nos próximos 3 dias
  const tresDias = new Date();
  tresDias.setDate(tresDias.getDate() + 3);
  const dataLimite = tresDias.toISOString().split("T")[0];
  const hoje = new Date().toISOString().split("T")[0];

  const parcelas = await db.select({
    id: sql`p.id`,
    clienteNome: sql`p.cliente_nome`,
    valor: sql`p.valor`,
    dataVencimento: sql`p.data_vencimento`,
  }).from(sql`parcelas p`)
    .where(and(
      sql`p.user_id = ${userId}`,
      sql`p.status = 'pendente'`,
      sql`p.data_vencimento BETWEEN ${hoje} AND ${dataLimite}`
    ));

  let criadas = 0;
  for (const parc of parcelas) {
    // Verificar se já existe notificação para esta parcela hoje
    const existing = await db.select().from(notificacoesTable)
      .where(and(
        eq(notificacoesTable.userId, userId),
        eq(notificacoesTable.referenciaId, parc.id as number),
        eq(notificacoesTable.tipo, "parcela_vencendo"),
        sql`${notificacoesTable.createdAt}::date = ${hoje}`
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notificacoesTable).values({
        userId,
        tipo: "parcela_vencendo",
        titulo: `Parcela vencendo: ${parc.clienteNome}`,
        descricao: `R$ ${Number(parc.valor).toFixed(2)} vence em ${parc.dataVencimento}`,
        referenciaId: parc.id as number,
      });
      criadas++;
    }
  }

  res.json({ criadas });
});

export default router;

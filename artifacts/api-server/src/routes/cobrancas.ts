import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { parcelasTable, cobrancaLogsTable, configuracoesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /cobrancas — listar parcelas inadimplentes com logs de cobrança
router.get("/cobrancas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  // Buscar parcelas atrasadas ou pendentes vencidas
  const today = new Date().toISOString().split("T")[0];
  const inadimplentes = await db.select().from(parcelasTable)
    .where(and(
      eq(parcelasTable.userId, userId),
      sql`(${parcelasTable.status} = 'atrasada' OR (${parcelasTable.status} = 'pendente' AND ${parcelasTable.dataVencimento} < ${today}))`
    ))
    .orderBy(sql`${parcelasTable.dataVencimento} ASC`);

  // Buscar últimos logs de cobrança por parcela
  const parcelaIds = inadimplentes.map(p => p.id);
  let logsMap: Record<number, typeof cobrancaLogsTable.$inferSelect[]> = {};
  if (parcelaIds.length > 0) {
    const logs = await db.select().from(cobrancaLogsTable)
      .where(and(
        eq(cobrancaLogsTable.userId, userId),
        sql`${cobrancaLogsTable.parcelaId} = ANY(${parcelaIds})`
      ))
      .orderBy(desc(cobrancaLogsTable.enviadoEm));

    for (const log of logs) {
      if (!logsMap[log.parcelaId]) logsMap[log.parcelaId] = [];
      logsMap[log.parcelaId].push(log);
    }
  }

  const result = inadimplentes.map(p => ({
    id: p.id,
    vendaId: p.vendaId,
    clienteId: p.clienteId,
    clienteNome: p.clienteNome,
    clienteTelefone: p.clienteTelefone,
    numero: p.numero,
    totalParcelas: p.totalParcelas,
    valor: Number(p.valor),
    dataVencimento: p.dataVencimento,
    status: p.status,
    cobrancas: (logsMap[p.id] || []).map(l => ({
      id: l.id,
      tipo: l.tipo,
      status: l.status,
      mensagem: l.mensagem,
      enviadoEm: l.enviadoEm.toISOString(),
      resposta: l.resposta,
    })),
  }));

  res.json(result);
});

// POST /cobrancas/cobrar — gerar deep link WhatsApp para um inadimplente
router.post("/cobrancas/cobrar", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const { parcelaId, mensagem } = req.body as { parcelaId: number; mensagem?: string };

  if (!parcelaId) {
    res.status(400).json({ error: "parcelaId é obrigatório" });
    return;
  }

  const parcela = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.id, parcelaId), eq(parcelasTable.userId, userId)))
    .limit(1);

  if (parcela.length === 0) {
    res.status(404).json({ error: "Parcela não encontrada" });
    return;
  }

  const p = parcela[0];
  const telefone = p.clienteTelefone?.replace(/\D/g, "");
  if (!telefone) {
    res.status(400).json({ error: "Cliente não possui telefone cadastrado" });
    return;
  }

  // Buscar template de mensagem nas configurações
  let template = mensagem;
  if (!template) {
    const config = await db.select().from(configuracoesTable)
      .where(eq(configuracoesTable.userId, userId))
      .limit(1);
    template = config[0]?.mensagemCobranca ||
      `Olá {clienteNome}! Você tem uma parcela pendente de R$ {valor} vencendo em {vencimento}. Por favor, entre em contato para regularizar.`;
  }

  const msgFinal = template
    .replace(/{clienteNome}/g, p.clienteNome)
    .replace(/{valor}/g, Number(p.valor).toFixed(2))
    .replace(/{vencimento}/g, p.dataVencimento)
    .replace(/{parcela}/g, `${p.numero}/${p.totalParcelas}`);

  const whatsappLink = `https://wa.me/55${telefone}?text=${encodeURIComponent(msgFinal)}`;

  // Registrar cobrança
  const [log] = await db.insert(cobrancaLogsTable).values({
    userId,
    parcelaId: p.id,
    clienteId: p.clienteId,
    clienteNome: p.clienteNome,
    clienteTelefone: p.clienteTelefone,
    tipo: "whatsapp",
    status: "enviada",
    mensagem: msgFinal,
  }).returning();

  res.json({
    whatsappLink,
    mensagem: msgFinal,
    cobrancaLog: {
      id: log.id,
      tipo: log.tipo,
      status: log.status,
      enviadoEm: log.enviadoEm.toISOString(),
    },
  });
});

// POST /cobrancas/cobrar-lote — gerar cobrança em lote
router.post("/cobrancas/cobrar-lote", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const { parcelaIds, mensagem } = req.body as { parcelaIds: number[]; mensagem?: string };

  if (!parcelaIds || !Array.isArray(parcelaIds) || parcelaIds.length === 0) {
    res.status(400).json({ error: "parcelaIds é obrigatório e deve ser um array não vazio" });
    return;
  }

  const parcelas = await db.select().from(parcelasTable)
    .where(and(
      eq(parcelasTable.userId, userId),
      sql`${parcelasTable.id} = ANY(${parcelaIds})`
    ));

  // Buscar template
  let template = mensagem;
  if (!template) {
    const config = await db.select().from(configuracoesTable)
      .where(eq(configuracoesTable.userId, userId))
      .limit(1);
    template = config[0]?.mensagemCobranca ||
      `Olá {clienteNome}! Você tem uma parcela pendente de R$ {valor} vencendo em {vencimento}. Por favor, entre em contato para regularizar.`;
  }

  const resultados = [];
  const logsToInsert = [];

  for (const p of parcelas) {
    const telefone = p.clienteTelefone?.replace(/\D/g, "");
    if (!telefone) continue;

    const msgFinal = template
      .replace(/{clienteNome}/g, p.clienteNome)
      .replace(/{valor}/g, Number(p.valor).toFixed(2))
      .replace(/{vencimento}/g, p.dataVencimento)
      .replace(/{parcela}/g, `${p.numero}/${p.totalParcelas}`);

    const whatsappLink = `https://wa.me/55${telefone}?text=${encodeURIComponent(msgFinal)}`;

    logsToInsert.push({
      userId,
      parcelaId: p.id,
      clienteId: p.clienteId,
      clienteNome: p.clienteNome,
      clienteTelefone: p.clienteTelefone,
      tipo: "whatsapp",
      status: "enviada",
      mensagem: msgFinal,
    });

    resultados.push({
      parcelaId: p.id,
      clienteNome: p.clienteNome,
      whatsappLink,
      mensagem: msgFinal,
    });
  }

  if (logsToInsert.length > 0) {
    await db.insert(cobrancaLogsTable).values(logsToInsert);
  }

  res.json({ total: resultados.length, cobrancas: resultados });
});

// GET /cobrancas/logs — listar logs de cobrança
router.get("/cobrancas/logs", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const logs = await db.select().from(cobrancaLogsTable)
    .where(eq(cobrancaLogsTable.userId, userId))
    .orderBy(desc(cobrancaLogsTable.enviadoEm))
    .limit(100);

  res.json(logs.map(l => ({
    id: l.id,
    parcelaId: l.parcelaId,
    clienteId: l.clienteId,
    clienteNome: l.clienteNome,
    tipo: l.tipo,
    status: l.status,
    mensagem: l.mensagem,
    enviadoEm: l.enviadoEm.toISOString(),
    resposta: l.resposta,
  })));
});

export default router;

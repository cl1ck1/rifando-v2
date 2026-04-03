import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { parcelasTable, vendasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListParcelasQueryParams,
  GetParcelaParams,
  UpdateParcelaParams,
  UpdateParcelaBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/parcelas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const query = ListParcelasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(parcelasTable.userId, userId)];

  if (query.data.status) {
    conditions.push(eq(parcelasTable.status, query.data.status));
  }
  if (query.data.clienteId) {
    conditions.push(eq(parcelasTable.clienteId, query.data.clienteId));
  }
  if (query.data.vendaId) {
    conditions.push(eq(parcelasTable.vendaId, query.data.vendaId));
  }

  const parcelas = await db.select().from(parcelasTable)
    .where(and(...conditions))
    .orderBy(sql`${parcelasTable.dataVencimento} ASC`);

  res.json(parcelas.map((p) => ({
    id: p.id,
    vendaId: p.vendaId,
    clienteId: p.clienteId,
    clienteNome: p.clienteNome,
    clienteTelefone: p.clienteTelefone,
    numero: p.numero,
    totalParcelas: p.totalParcelas,
    valor: Number(p.valor),
    dataVencimento: p.dataVencimento,
    dataPagamento: p.dataPagamento,
    metodoPagamento: p.metodoPagamento,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.get("/parcelas/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetParcelaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const results = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.id, id), eq(parcelasTable.userId, userId)))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "Parcela nao encontrada" });
    return;
  }

  const p = results[0];
  res.json({
    id: p.id,
    vendaId: p.vendaId,
    clienteId: p.clienteId,
    clienteNome: p.clienteNome,
    clienteTelefone: p.clienteTelefone,
    numero: p.numero,
    totalParcelas: p.totalParcelas,
    valor: Number(p.valor),
    dataVencimento: p.dataVencimento,
    dataPagamento: p.dataPagamento,
    metodoPagamento: p.metodoPagamento,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  });
});

router.patch("/parcelas/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateParcelaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const parsed = UpdateParcelaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.id, id), eq(parcelasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Parcela nao encontrada" });
    return;
  }

  const updates: Record<string, string | number | null> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.dataPagamento) updates.dataPagamento = parsed.data.dataPagamento;
  if (parsed.data.metodoPagamento) updates.metodoPagamento = parsed.data.metodoPagamento;
  if (parsed.data.dataVencimento) updates.dataVencimento = parsed.data.dataVencimento;
  if (parsed.data.valor !== undefined) updates.valor = Number(parsed.data.valor).toFixed(2);

  const [updated] = await db.update(parcelasTable).set(updates).where(eq(parcelasTable.id, id)).returning();

  if (parsed.data.status === "paga") {
    await db.insert(atividadesTable).values({
      userId,
      type: "pagamento",
      description: `Parcela ${existing[0].numero}/${existing[0].totalParcelas} de ${existing[0].clienteNome} recebida - R$ ${Number(updated.valor).toFixed(2)}`,
    });

    const allParcelas = await db.select().from(parcelasTable).where(eq(parcelasTable.vendaId, existing[0].vendaId));
    const allPaid = allParcelas.every((p) => p.id === id ? true : p.status === "paga");
    const somePaid = allParcelas.some((p) => p.id === id ? true : p.status === "paga");

    if (allPaid) {
      await db.update(vendasTable).set({ status: "quitada" }).where(eq(vendasTable.id, existing[0].vendaId));
    } else if (somePaid) {
      await db.update(vendasTable).set({ status: "parcial" }).where(eq(vendasTable.id, existing[0].vendaId));
    }
  }

  res.json({
    id: updated.id,
    vendaId: updated.vendaId,
    clienteId: updated.clienteId,
    clienteNome: updated.clienteNome,
    clienteTelefone: updated.clienteTelefone,
    numero: updated.numero,
    totalParcelas: updated.totalParcelas,
    valor: Number(updated.valor),
    dataVencimento: updated.dataVencimento,
    dataPagamento: updated.dataPagamento,
    metodoPagamento: updated.metodoPagamento,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;

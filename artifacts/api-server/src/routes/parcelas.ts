import { Router } from "express";
import { db } from "@workspace/db";
import { parcelasTable, vendasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/parcelas", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { status, clienteId, vendaId } = req.query;

  let conditions = [eq(parcelasTable.userId, userId)];

  if (status && typeof status === "string") {
    conditions.push(eq(parcelasTable.status, status));
  }
  if (clienteId && typeof clienteId === "string") {
    conditions.push(eq(parcelasTable.clienteId, parseInt(clienteId, 10)));
  }
  if (vendaId && typeof vendaId === "string") {
    conditions.push(eq(parcelasTable.vendaId, parseInt(vendaId, 10)));
  }

  const parcelas = await db.select().from(parcelasTable)
    .where(and(...conditions))
    .orderBy(sql`${parcelasTable.dataVencimento} ASC`);

  const mapped = parcelas.map((p) => ({
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
  }));

  res.json(mapped);
});

router.get("/parcelas/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

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

router.patch("/parcelas/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.id, id), eq(parcelasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Parcela nao encontrada" });
    return;
  }

  const updates: Record<string, string | number | null> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.dataPagamento) updates.dataPagamento = req.body.dataPagamento;
  if (req.body.metodoPagamento) updates.metodoPagamento = req.body.metodoPagamento;
  if (req.body.dataVencimento) updates.dataVencimento = req.body.dataVencimento;
  if (req.body.valor !== undefined) updates.valor = Number(req.body.valor).toFixed(2);

  const [updated] = await db.update(parcelasTable).set(updates).where(eq(parcelasTable.id, id)).returning();

  if (req.body.status === "paga") {
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

import { Router } from "express";
import { db } from "@workspace/db";
import { vendasTable, vendaItensTable, parcelasTable, clientesTable, produtosTable, atividadesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/vendas", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { status, clienteId } = req.query;

  let query = db.select().from(vendasTable).where(eq(vendasTable.userId, userId));

  if (status && typeof status === "string") {
    query = db.select().from(vendasTable).where(and(eq(vendasTable.userId, userId), eq(vendasTable.status, status)));
  }
  if (clienteId && typeof clienteId === "string") {
    query = db.select().from(vendasTable).where(and(eq(vendasTable.userId, userId), eq(vendasTable.clienteId, parseInt(clienteId, 10))));
  }

  const vendas = await query.orderBy(sql`${vendasTable.createdAt} DESC`);

  const mapped = vendas.map((v) => ({
    id: v.id,
    clienteId: v.clienteId,
    clienteNome: v.clienteNome,
    valorTotal: Number(v.valorTotal),
    desconto: Number(v.desconto),
    valorFinal: Number(v.valorFinal),
    formaPagamento: v.formaPagamento,
    numeroParcelas: v.numeroParcelas,
    status: v.status,
    observacoes: v.observacoes,
    createdAt: v.createdAt.toISOString(),
  }));

  res.json(mapped);
});

router.post("/vendas", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { clienteId, itens, desconto, formaPagamento, numeroParcelas, observacoes } = req.body;

  const cliente = await db.select().from(clientesTable).where(and(eq(clientesTable.id, clienteId), eq(clientesTable.userId, userId))).limit(1);
  if (cliente.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  let valorTotal = 0;
  const resolvedItens: Array<{ produtoId: number; produtoNome: string; quantidade: number; precoUnitario: number; subtotal: number }> = [];

  for (const item of itens) {
    const produto = await db.select().from(produtosTable).where(and(eq(produtosTable.id, item.produtoId), eq(produtosTable.userId, userId))).limit(1);
    if (produto.length === 0) {
      res.status(404).json({ error: `Produto ${item.produtoId} nao encontrado` });
      return;
    }
    const subtotal = item.quantidade * item.precoUnitario;
    valorTotal += subtotal;
    resolvedItens.push({
      produtoId: item.produtoId,
      produtoNome: produto[0].nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      subtotal,
    });

    await db.update(produtosTable)
      .set({ estoque: sql`${produtosTable.estoque} - ${item.quantidade}` })
      .where(eq(produtosTable.id, item.produtoId));
  }

  const descontoVal = desconto || 0;
  const valorFinal = valorTotal - descontoVal;
  const numParcelas = numeroParcelas || 1;

  const [venda] = await db.insert(vendasTable).values({
    userId,
    clienteId,
    clienteNome: cliente[0].nome,
    valorTotal: valorTotal.toFixed(2),
    desconto: descontoVal.toFixed(2),
    valorFinal: valorFinal.toFixed(2),
    formaPagamento: formaPagamento || "parcelado",
    numeroParcelas: numParcelas,
    status: "pendente",
    observacoes: observacoes || null,
  }).returning();

  for (const item of resolvedItens) {
    await db.insert(vendaItensTable).values({
      vendaId: venda.id,
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    });
  }

  const valorParcela = valorFinal / numParcelas;
  const today = new Date();
  for (let i = 1; i <= numParcelas; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);
    await db.insert(parcelasTable).values({
      userId,
      vendaId: venda.id,
      clienteId,
      clienteNome: cliente[0].nome,
      clienteTelefone: cliente[0].telefone,
      numero: i,
      totalParcelas: numParcelas,
      valor: valorParcela.toFixed(2),
      dataVencimento: dueDate.toISOString().split("T")[0],
      status: "pendente",
    });
  }

  await db.update(clientesTable)
    .set({ totalCompras: sql`CAST(${clientesTable.totalCompras} AS numeric) + ${valorFinal}` })
    .where(eq(clientesTable.id, clienteId));

  await db.insert(atividadesTable).values({
    userId,
    type: "venda",
    description: `Nova venda de R$ ${valorFinal.toFixed(2)} para ${cliente[0].nome}`,
  });

  res.status(201).json({
    id: venda.id,
    clienteId: venda.clienteId,
    clienteNome: venda.clienteNome,
    valorTotal: Number(venda.valorTotal),
    desconto: Number(venda.desconto),
    valorFinal: Number(venda.valorFinal),
    formaPagamento: venda.formaPagamento,
    numeroParcelas: venda.numeroParcelas,
    status: venda.status,
    observacoes: venda.observacoes,
    createdAt: venda.createdAt.toISOString(),
  });
});

router.get("/vendas/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const vendas = await db.select().from(vendasTable).where(and(eq(vendasTable.id, id), eq(vendasTable.userId, userId))).limit(1);
  if (vendas.length === 0) {
    res.status(404).json({ error: "Venda nao encontrada" });
    return;
  }

  const v = vendas[0];
  const itens = await db.select().from(vendaItensTable).where(eq(vendaItensTable.vendaId, id));
  const parcelas = await db.select().from(parcelasTable).where(eq(parcelasTable.vendaId, id)).orderBy(sql`${parcelasTable.numero} ASC`);

  res.json({
    venda: {
      id: v.id,
      clienteId: v.clienteId,
      clienteNome: v.clienteNome,
      valorTotal: Number(v.valorTotal),
      desconto: Number(v.desconto),
      valorFinal: Number(v.valorFinal),
      formaPagamento: v.formaPagamento,
      numeroParcelas: v.numeroParcelas,
      status: v.status,
      observacoes: v.observacoes,
      createdAt: v.createdAt.toISOString(),
    },
    itens: itens.map((i) => ({
      id: i.id,
      produtoId: i.produtoId,
      produtoNome: i.produtoNome,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
      subtotal: Number(i.subtotal),
    })),
    parcelas: parcelas.map((p) => ({
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
    })),
  });
});

router.patch("/vendas/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(vendasTable).where(and(eq(vendasTable.id, id), eq(vendasTable.userId, userId))).limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Venda nao encontrada" });
    return;
  }

  const updates: Record<string, string | number | null> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.observacoes !== undefined) updates.observacoes = req.body.observacoes;

  const [updated] = await db.update(vendasTable).set(updates).where(eq(vendasTable.id, id)).returning();

  res.json({
    id: updated.id,
    clienteId: updated.clienteId,
    clienteNome: updated.clienteNome,
    valorTotal: Number(updated.valorTotal),
    desconto: Number(updated.desconto),
    valorFinal: Number(updated.valorFinal),
    formaPagamento: updated.formaPagamento,
    numeroParcelas: updated.numeroParcelas,
    status: updated.status,
    observacoes: updated.observacoes,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/vendas/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(vendasTable).where(and(eq(vendasTable.id, id), eq(vendasTable.userId, userId))).limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Venda nao encontrada" });
    return;
  }

  await db.delete(vendasTable).where(eq(vendasTable.id, id));
  res.status(204).send();
});

export default router;

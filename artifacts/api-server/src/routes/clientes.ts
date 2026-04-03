import { Router } from "express";
import { db } from "@workspace/db";
import { clientesTable, vendasTable, parcelasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/clientes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { search, status, cidade } = req.query;

  let conditions = [eq(clientesTable.userId, userId)];

  if (status && typeof status === "string") {
    conditions.push(eq(clientesTable.status, status));
  }
  if (cidade && typeof cidade === "string") {
    conditions.push(eq(clientesTable.cidade, cidade));
  }
  if (search && typeof search === "string") {
    conditions.push(
      or(
        ilike(clientesTable.nome, `%${search}%`),
        ilike(clientesTable.telefone, `%${search}%`)
      )!
    );
  }

  const clientes = await db.select().from(clientesTable)
    .where(and(...conditions))
    .orderBy(sql`${clientesTable.nome} ASC`);

  const mapped = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    cpf: c.cpf,
    endereco: c.endereco,
    bairro: c.bairro,
    cidade: c.cidade,
    estado: c.estado,
    referencia: c.referencia,
    observacoes: c.observacoes,
    status: c.status,
    totalCompras: Number(c.totalCompras),
    createdAt: c.createdAt.toISOString(),
  }));

  res.json(mapped);
});

router.post("/clientes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;

  const [created] = await db.insert(clientesTable).values({
    userId,
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email || null,
    cpf: req.body.cpf || null,
    endereco: req.body.endereco || null,
    bairro: req.body.bairro || null,
    cidade: req.body.cidade || null,
    estado: req.body.estado || null,
    referencia: req.body.referencia || null,
    observacoes: req.body.observacoes || null,
    status: req.body.status || "ativo",
  }).returning();

  await db.insert(atividadesTable).values({
    userId,
    type: "cliente",
    description: `Novo cliente cadastrado: ${created.nome}`,
  });

  res.status(201).json({
    id: created.id,
    nome: created.nome,
    telefone: created.telefone,
    email: created.email,
    cpf: created.cpf,
    endereco: created.endereco,
    bairro: created.bairro,
    cidade: created.cidade,
    estado: created.estado,
    referencia: created.referencia,
    observacoes: created.observacoes,
    status: created.status,
    totalCompras: Number(created.totalCompras),
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const results = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  const c = results[0];
  res.json({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    cpf: c.cpf,
    endereco: c.endereco,
    bairro: c.bairro,
    cidade: c.cidade,
    estado: c.estado,
    referencia: c.referencia,
    observacoes: c.observacoes,
    status: c.status,
    totalCompras: Number(c.totalCompras),
    createdAt: c.createdAt.toISOString(),
  });
});

router.patch("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  const updates: Record<string, string | null> = {};
  const fields = ["nome", "telefone", "email", "cpf", "endereco", "bairro", "cidade", "estado", "referencia", "observacoes", "status"] as const;
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const [updated] = await db.update(clientesTable).set(updates).where(eq(clientesTable.id, id)).returning();

  res.json({
    id: updated.id,
    nome: updated.nome,
    telefone: updated.telefone,
    email: updated.email,
    cpf: updated.cpf,
    endereco: updated.endereco,
    bairro: updated.bairro,
    cidade: updated.cidade,
    estado: updated.estado,
    referencia: updated.referencia,
    observacoes: updated.observacoes,
    status: updated.status,
    totalCompras: Number(updated.totalCompras),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const existing = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  await db.delete(clientesTable).where(eq(clientesTable.id, id));
  res.status(204).send();
});

router.get("/clientes/:id/history", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id, 10);

  const results = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  const c = results[0];
  const vendas = await db.select().from(vendasTable)
    .where(and(eq(vendasTable.clienteId, id), eq(vendasTable.userId, userId)))
    .orderBy(sql`${vendasTable.createdAt} DESC`);

  const parcelas = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.clienteId, id), eq(parcelasTable.userId, userId)))
    .orderBy(sql`${parcelasTable.dataVencimento} ASC`);

  res.json({
    cliente: {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      cpf: c.cpf,
      endereco: c.endereco,
      bairro: c.bairro,
      cidade: c.cidade,
      estado: c.estado,
      referencia: c.referencia,
      observacoes: c.observacoes,
      status: c.status,
      totalCompras: Number(c.totalCompras),
      createdAt: c.createdAt.toISOString(),
    },
    vendas: vendas.map((v) => ({
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

export default router;

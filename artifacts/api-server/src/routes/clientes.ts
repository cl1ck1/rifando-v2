import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientesTable, vendasTable, parcelasTable, atividadesTable } from "@workspace/db";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListClientesQueryParams,
  CreateClienteBody,
  GetClienteParams,
  UpdateClienteParams,
  UpdateClienteBody,
  DeleteClienteParams,
  GetClienteHistoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clientes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const query = ListClientesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(clientesTable.userId, userId)];

  if (query.data.status) {
    conditions.push(eq(clientesTable.status, query.data.status));
  }
  if (query.data.cidade) {
    conditions.push(eq(clientesTable.cidade, query.data.cidade));
  }
  if (query.data.search) {
    conditions.push(
      or(
        ilike(clientesTable.nome, `%${query.data.search}%`),
        ilike(clientesTable.telefone, `%${query.data.search}%`)
      )!
    );
  }

  const clientes = await db.select().from(clientesTable)
    .where(and(...conditions))
    .orderBy(sql`${clientesTable.nome} ASC`);

  res.json(clientes.map((c) => ({
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
  })));
});

router.post("/clientes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(clientesTable).values({
    userId,
    nome: parsed.data.nome,
    telefone: parsed.data.telefone,
    email: parsed.data.email || null,
    cpf: parsed.data.cpf || null,
    endereco: parsed.data.endereco || null,
    bairro: parsed.data.bairro || null,
    cidade: parsed.data.cidade || null,
    estado: parsed.data.estado || null,
    referencia: parsed.data.referencia || null,
    observacoes: parsed.data.observacoes || null,
    status: parsed.data.status || "ativo",
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

router.get("/clientes/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

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

router.patch("/clientes/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const parsed = UpdateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  const updates: Record<string, string | null> = {};
  const data = parsed.data;
  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.telefone !== undefined) updates.telefone = data.telefone;
  if (data.email !== undefined) updates.email = data.email ?? null;
  if (data.cpf !== undefined) updates.cpf = data.cpf ?? null;
  if (data.endereco !== undefined) updates.endereco = data.endereco ?? null;
  if (data.bairro !== undefined) updates.bairro = data.bairro ?? null;
  if (data.cidade !== undefined) updates.cidade = data.cidade ?? null;
  if (data.estado !== undefined) updates.estado = data.estado ?? null;
  if (data.referencia !== undefined) updates.referencia = data.referencia ?? null;
  if (data.observacoes !== undefined) updates.observacoes = data.observacoes ?? null;
  if (data.status !== undefined) updates.status = data.status;

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

router.delete("/clientes/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const existing = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Cliente nao encontrado" });
    return;
  }

  await db.delete(clientesTable).where(eq(clientesTable.id, id));
  res.sendStatus(204);
});

router.get("/clientes/:id/history", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetClienteHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

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

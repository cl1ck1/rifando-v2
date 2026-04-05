import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientesTable, vendasTable, parcelasTable, atividadesTable, rotaParadasTable } from "@workspace/db";
import { eq, and, sql, ilike, or, inArray } from "drizzle-orm";
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

function mapCliente(c: typeof clientesTable.$inferSelect) {
  return {
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
    tagLocalizacao: c.tagLocalizacao,
    rotaParadaId: c.rotaParadaId,
    createdAt: c.createdAt.toISOString(),
  };
}

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
  if (query.data.tagLocalizacao) {
    conditions.push(ilike(clientesTable.tagLocalizacao, `%${query.data.tagLocalizacao}%`));
  }
  if (query.data.rotaParadaId) {
    conditions.push(eq(clientesTable.rotaParadaId, query.data.rotaParadaId));
  }
  if (query.data.rotaId) {
    const paradas = await db
      .select({ id: rotaParadasTable.id })
      .from(rotaParadasTable)
      .where(and(eq(rotaParadasTable.rotaId, query.data.rotaId), eq(rotaParadasTable.userId, userId)));
    const paradaIds = paradas.map((p) => p.id);
    if (paradaIds.length === 0) {
      res.json([]);
      return;
    }
    conditions.push(inArray(clientesTable.rotaParadaId, paradaIds));
  }

  const clientes = await db.select().from(clientesTable)
    .where(and(...conditions))
    .orderBy(sql`${clientesTable.nome} ASC`);

  res.json(clientes.map(mapCliente));
});

router.post("/clientes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data as typeof parsed.data & { tagLocalizacao?: string; rotaParadaId?: number };

  if (data.rotaParadaId) {
    const parada = await db
      .select({ id: rotaParadasTable.id })
      .from(rotaParadasTable)
      .where(and(eq(rotaParadasTable.id, data.rotaParadaId), eq(rotaParadasTable.userId, userId)))
      .limit(1);
    if (parada.length === 0) {
      res.status(400).json({ error: "Parada nao encontrada ou sem permissao" });
      return;
    }
  }

  const [created] = await db.insert(clientesTable).values({
    userId,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email || null,
    cpf: data.cpf || null,
    endereco: data.endereco || null,
    bairro: data.bairro || null,
    cidade: data.cidade || null,
    estado: data.estado || null,
    referencia: data.referencia || null,
    observacoes: data.observacoes || null,
    status: data.status || "ativo",
    tagLocalizacao: data.tagLocalizacao || null,
    rotaParadaId: data.rotaParadaId || null,
  }).returning();

  await db.insert(atividadesTable).values({
    userId,
    type: "cliente",
    description: `Novo cliente cadastrado: ${created.nome}`,
  });

  res.status(201).json(mapCliente(created));
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

  res.json(mapCliente(results[0]));
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

  const updates: Record<string, string | number | null> = {};
  const data = parsed.data as typeof parsed.data & { tagLocalizacao?: string; rotaParadaId?: number | null };

  if (data.rotaParadaId) {
    const parada = await db
      .select({ id: rotaParadasTable.id })
      .from(rotaParadasTable)
      .where(and(eq(rotaParadasTable.id, data.rotaParadaId), eq(rotaParadasTable.userId, userId)))
      .limit(1);
    if (parada.length === 0) {
      res.status(400).json({ error: "Parada nao encontrada ou sem permissao" });
      return;
    }
  }

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
  if (data.tagLocalizacao !== undefined) updates.tagLocalizacao = data.tagLocalizacao ?? null;
  if (data.rotaParadaId !== undefined) updates.rotaParadaId = data.rotaParadaId ?? null;

  const [updated] = await db.update(clientesTable).set(updates).where(eq(clientesTable.id, id)).returning();

  res.json(mapCliente(updated));
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
    cliente: mapCliente(c),
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

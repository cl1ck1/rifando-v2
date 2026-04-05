import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { rotasTable, rotaParadasTable, clientesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  CreateRotaBody,
  UpdateRotaBody,
  GetRotaParams,
  UpdateRotaParams,
  DeleteRotaParams,
  ListRotaParadasParams,
  CreateRotaParadaParams,
  CreateRotaParadaBody,
  UpdateRotaParadaParams,
  UpdateRotaParadaBody,
  DeleteRotaParadaParams,
  GetRotaClientesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapRota(r: typeof rotasTable.$inferSelect, totalParadas = 0, totalClientes = 0) {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    cor: r.cor,
    status: r.status,
    totalParadas,
    totalClientes,
    createdAt: r.createdAt.toISOString(),
  };
}

function mapParada(p: typeof rotaParadasTable.$inferSelect) {
  return {
    id: p.id,
    rotaId: p.rotaId,
    ordem: p.ordem,
    nome: p.nome,
    estado: p.estado,
    enderecoCompleto: p.enderecoCompleto,
    lat: p.lat !== null ? Number(p.lat) : null,
    lng: p.lng !== null ? Number(p.lng) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

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

router.get("/rotas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const rotas = await db
    .select()
    .from(rotasTable)
    .where(eq(rotasTable.userId, userId))
    .orderBy(sql`${rotasTable.createdAt} DESC`);

  if (rotas.length === 0) {
    res.json([]);
    return;
  }

  const paradas = await db
    .select()
    .from(rotaParadasTable)
    .where(eq(rotaParadasTable.userId, userId));

  const clientes = await db
    .select({ rotaParadaId: clientesTable.rotaParadaId })
    .from(clientesTable)
    .where(eq(clientesTable.userId, userId));

  const paradaCountByRota: Record<number, number> = {};
  const paradaIdToRotaId: Record<number, number> = {};

  for (const p of paradas) {
    paradaCountByRota[p.rotaId] = (paradaCountByRota[p.rotaId] || 0) + 1;
    paradaIdToRotaId[p.id] = p.rotaId;
  }

  const clienteCountByRota: Record<number, number> = {};
  for (const c of clientes) {
    if (c.rotaParadaId) {
      const rotaId = paradaIdToRotaId[c.rotaParadaId];
      if (rotaId) {
        clienteCountByRota[rotaId] = (clienteCountByRota[rotaId] || 0) + 1;
      }
    }
  }

  res.json(rotas.map((r) => mapRota(r, paradaCountByRota[r.id] || 0, clienteCountByRota[r.id] || 0)));
});

router.post("/rotas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateRotaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(rotasTable)
    .values({
      userId,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      cor: parsed.data.cor || "#3b82f6",
      status: parsed.data.status || "planejada",
    })
    .returning();

  res.status(201).json(mapRota(created));
});

router.get("/rotas/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetRotaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const results = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  const paradas = await db
    .select()
    .from(rotaParadasTable)
    .where(and(eq(rotaParadasTable.rotaId, id), eq(rotaParadasTable.userId, userId)))
    .orderBy(sql`${rotaParadasTable.ordem} ASC`);

  const clientesCount = await db
    .select({ rotaParadaId: clientesTable.rotaParadaId })
    .from(clientesTable)
    .where(eq(clientesTable.userId, userId));

  const paradaIds = new Set(paradas.map((p) => p.id));
  const totalClientes = clientesCount.filter((c) => c.rotaParadaId && paradaIds.has(c.rotaParadaId)).length;

  res.json({
    rota: mapRota(results[0], paradas.length, totalClientes),
    paradas: paradas.map(mapParada),
  });
});

router.patch("/rotas/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateRotaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const parsed = UpdateRotaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  const updates: Record<string, string | null> = {};
  const data = parsed.data;
  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.descricao !== undefined) updates.descricao = data.descricao ?? null;
  if (data.cor !== undefined) updates.cor = data.cor;
  if (data.status !== undefined) updates.status = data.status;

  const [updated] = await db
    .update(rotasTable)
    .set(updates)
    .where(eq(rotasTable.id, id))
    .returning();

  res.json(mapRota(updated));
});

router.delete("/rotas/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteRotaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const existing = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  await db.delete(rotaParadasTable).where(and(eq(rotaParadasTable.rotaId, id), eq(rotaParadasTable.userId, userId)));
  await db.delete(rotasTable).where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)));
  res.sendStatus(204);
});

router.get("/rotas/:id/paradas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = ListRotaParadasParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const rota = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (rota.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  const paradas = await db
    .select()
    .from(rotaParadasTable)
    .where(and(eq(rotaParadasTable.rotaId, id), eq(rotaParadasTable.userId, userId)))
    .orderBy(sql`${rotaParadasTable.ordem} ASC`);

  res.json(paradas.map(mapParada));
});

router.post("/rotas/:id/paradas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = CreateRotaParadaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const rota = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (rota.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  const parsed = CreateRotaParadaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existingParadas = await db
    .select({ ordem: rotaParadasTable.ordem })
    .from(rotaParadasTable)
    .where(eq(rotaParadasTable.rotaId, id));

  const maxOrdem = existingParadas.length > 0
    ? Math.max(...existingParadas.map((p) => p.ordem))
    : 0;

  const [created] = await db
    .insert(rotaParadasTable)
    .values({
      rotaId: id,
      userId,
      nome: parsed.data.nome,
      estado: parsed.data.estado || null,
      enderecoCompleto: parsed.data.enderecoCompleto || null,
      lat: parsed.data.lat !== undefined ? String(parsed.data.lat) : null,
      lng: parsed.data.lng !== undefined ? String(parsed.data.lng) : null,
      ordem: parsed.data.ordem ?? maxOrdem + 1,
    })
    .returning();

  res.status(201).json(mapParada(created));
});

router.patch("/rotas/:id/paradas/:paradaId", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateRotaParadaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id, paradaId } = params.data;

  const parsed = UpdateRotaParadaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(rotaParadasTable)
    .where(
      and(
        eq(rotaParadasTable.id, paradaId),
        eq(rotaParadasTable.rotaId, id),
        eq(rotaParadasTable.userId, userId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Parada nao encontrada" });
    return;
  }

  const updates: Record<string, string | number | null> = {};
  const data = parsed.data;
  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.estado !== undefined) updates.estado = data.estado ?? null;
  if (data.enderecoCompleto !== undefined) updates.enderecoCompleto = data.enderecoCompleto ?? null;
  if (data.lat !== undefined) updates.lat = data.lat !== null ? String(data.lat) : null;
  if (data.lng !== undefined) updates.lng = data.lng !== null ? String(data.lng) : null;
  if (data.ordem !== undefined) updates.ordem = data.ordem;

  const [updated] = await db
    .update(rotaParadasTable)
    .set(updates)
    .where(eq(rotaParadasTable.id, paradaId))
    .returning();

  res.json(mapParada(updated));
});

router.delete("/rotas/:id/paradas/:paradaId", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteRotaParadaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id, paradaId } = params.data;

  const existing = await db
    .select()
    .from(rotaParadasTable)
    .where(
      and(
        eq(rotaParadasTable.id, paradaId),
        eq(rotaParadasTable.rotaId, id),
        eq(rotaParadasTable.userId, userId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Parada nao encontrada" });
    return;
  }

  await db.delete(rotaParadasTable).where(and(eq(rotaParadasTable.id, paradaId), eq(rotaParadasTable.userId, userId)));
  res.sendStatus(204);
});

router.get("/rotas/:id/clientes", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetRotaClientesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const rotaResults = await db
    .select()
    .from(rotasTable)
    .where(and(eq(rotasTable.id, id), eq(rotasTable.userId, userId)))
    .limit(1);

  if (rotaResults.length === 0) {
    res.status(404).json({ error: "Rota nao encontrada" });
    return;
  }

  const paradas = await db
    .select()
    .from(rotaParadasTable)
    .where(and(eq(rotaParadasTable.rotaId, id), eq(rotaParadasTable.userId, userId)))
    .orderBy(sql`${rotaParadasTable.ordem} ASC`);

  const allClientes = await db
    .select()
    .from(clientesTable)
    .where(eq(clientesTable.userId, userId))
    .orderBy(sql`${clientesTable.nome} ASC`);

  const paradaIdSet = new Set(paradas.map((p) => p.id));
  const clientesByParada: Record<number, ReturnType<typeof mapCliente>[]> = {};
  const semParada: ReturnType<typeof mapCliente>[] = [];

  for (const p of paradas) {
    clientesByParada[p.id] = [];
  }

  for (const c of allClientes) {
    if (c.rotaParadaId && paradaIdSet.has(c.rotaParadaId)) {
      clientesByParada[c.rotaParadaId].push(mapCliente(c));
    } else if (!c.rotaParadaId) {
      semParada.push(mapCliente(c));
    }
  }

  const rota = rotaResults[0];
  const totalClientes = Object.values(clientesByParada).reduce((sum, arr) => sum + arr.length, 0);

  res.json({
    rota: mapRota(rota, paradas.length, totalClientes),
    paradas: paradas.map((p) => ({
      parada: mapParada(p),
      clientes: clientesByParada[p.id] || [],
    })),
    semParada,
  });
});

export default router;

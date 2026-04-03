import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vendasTable, clientesTable, parcelasTable, atividadesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  GetTopCustomersQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const [vendaStats] = await db.select({
    totalVendas: sql<number>`coalesce(sum(${vendasTable.valorFinal}::numeric), 0)::float`,
    vendasMes: sql<number>`count(*) filter (where to_char(${vendasTable.createdAt}, 'YYYY-MM') = to_char(now(), 'YYYY-MM'))::int`,
  }).from(vendasTable).where(eq(vendasTable.userId, userId));

  const [clienteStats] = await db.select({
    totalClientes: sql<number>`count(*)::int`,
  }).from(clientesTable).where(eq(clientesTable.userId, userId));

  const [parcelaStats] = await db.select({
    totalRecebido: sql<number>`coalesce(sum(case when ${parcelasTable.status} = 'paga' then ${parcelasTable.valor}::numeric else 0 end), 0)::float`,
    totalPendente: sql<number>`coalesce(sum(case when ${parcelasTable.status} in ('pendente', 'atrasada') then ${parcelasTable.valor}::numeric else 0 end), 0)::float`,
    parcelasAtrasadas: sql<number>`count(*) filter (where ${parcelasTable.status} = 'atrasada' or (${parcelasTable.status} = 'pendente' and ${parcelasTable.dataVencimento} < to_char(now(), 'YYYY-MM-DD')))::int`,
  }).from(parcelasTable).where(eq(parcelasTable.userId, userId));

  res.json({
    totalVendas: vendaStats.totalVendas,
    totalRecebido: parcelaStats.totalRecebido,
    totalPendente: parcelaStats.totalPendente,
    totalClientes: clienteStats.totalClientes,
    vendasMes: vendaStats.vendasMes,
    parcelasAtrasadas: parcelaStats.parcelasAtrasadas,
  });
});

router.get("/dashboard/revenue-by-month", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const rows = await db.select({
    month: sql<string>`to_char(${parcelasTable.createdAt}, 'YYYY-MM')`,
    vendas: sql<number>`coalesce(sum(${parcelasTable.valor}::numeric), 0)::float`,
    recebido: sql<number>`coalesce(sum(case when ${parcelasTable.status} = 'paga' then ${parcelasTable.valor}::numeric else 0 end), 0)::float`,
  }).from(parcelasTable)
    .where(eq(parcelasTable.userId, userId))
    .groupBy(sql`to_char(${parcelasTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${parcelasTable.createdAt}, 'YYYY-MM')`);

  res.json(rows);
});

router.get("/dashboard/top-customers", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const query = GetTopCustomersQueryParams.safeParse(req.query);
  const limit = query.success ? query.data.limit : 5;

  const rows = await db.select({
    id: clientesTable.id,
    nome: clientesTable.nome,
    totalCompras: sql<number>`${clientesTable.totalCompras}::float`,
    comprasCount: sql<number>`(select count(*) from vendas where vendas.cliente_id = ${clientesTable.id})::int`,
    telefone: clientesTable.telefone,
    cidade: clientesTable.cidade,
  }).from(clientesTable)
    .where(eq(clientesTable.userId, userId))
    .orderBy(sql`${clientesTable.totalCompras}::numeric desc`)
    .limit(limit);

  res.json(rows);
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success ? query.data.limit : 10;

  const rows = await db.select().from(atividadesTable)
    .where(eq(atividadesTable.userId, userId))
    .orderBy(desc(atividadesTable.createdAt))
    .limit(limit);

  res.json(rows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.get("/dashboard/parcelas-atrasadas", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;

  const rows = await db.select().from(parcelasTable)
    .where(eq(parcelasTable.userId, userId))
    .orderBy(sql`${parcelasTable.dataVencimento} ASC`);

  const today = new Date().toISOString().split("T")[0];
  const atrasadas = rows
    .filter((p) => (p.status === "pendente" || p.status === "atrasada") && p.dataVencimento < today)
    .map((p) => {
      const dueDate = new Date(p.dataVencimento);
      const todayDate = new Date(today);
      const diasAtraso = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        vendaId: p.vendaId,
        clienteNome: p.clienteNome,
        clienteTelefone: p.clienteTelefone,
        valor: Number(p.valor),
        dataVencimento: p.dataVencimento,
        diasAtraso,
        parcela: p.numero,
        totalParcelas: p.totalParcelas,
      };
    });

  res.json(atrasadas);
});

export default router;

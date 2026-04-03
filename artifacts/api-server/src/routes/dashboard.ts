import { Router } from "express";
import { db } from "@workspace/db";
import { viagensTable, clientesTable, pagamentosTable, atividadesTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const [viagens] = await db.select({
      totalTrips: sql<number>`count(*)::int`,
      activeTrips: sql<number>`count(*) filter (where ${viagensTable.status} = 'ativa')::int`,
      seatsSold: sql<number>`coalesce(sum(${viagensTable.assentosVendidos}), 0)::int`,
    }).from(viagensTable).where(eq(viagensTable.userId, userId));

    const [clientes] = await db.select({
      totalCustomers: sql<number>`count(*)::int`,
    }).from(clientesTable).where(eq(clientesTable.userId, userId));

    const [pagamentos] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(case when ${pagamentosTable.status} = 'pago' then ${pagamentosTable.valor}::numeric else 0 end), 0)::float`,
      pendingPayments: sql<number>`coalesce(sum(case when ${pagamentosTable.status} in ('pendente', 'atrasado') then ${pagamentosTable.valor}::numeric else 0 end), 0)::float`,
    }).from(pagamentosTable).where(eq(pagamentosTable.userId, userId));

    res.json({
      totalRevenue: pagamentos.totalRevenue,
      totalTrips: viagens.totalTrips,
      totalCustomers: clientes.totalCustomers,
      seatsSold: viagens.seatsSold,
      pendingPayments: pagamentos.pendingPayments,
      activeTrips: viagens.activeTrips,
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/revenue-by-month", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const rows = await db.select({
      month: sql<string>`to_char(${pagamentosTable.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(case when ${pagamentosTable.status} = 'pago' then ${pagamentosTable.valor}::numeric else 0 end), 0)::float`,
      expenses: sql<number>`0::float`,
    }).from(pagamentosTable)
      .where(eq(pagamentosTable.userId, userId))
      .groupBy(sql`to_char(${pagamentosTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${pagamentosTable.createdAt}, 'YYYY-MM')`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/top-customers", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const limit = parseInt(req.query.limit as string) || 5;
  try {
    const rows = await db.select({
      id: clientesTable.id,
      name: clientesTable.nome,
      totalSpent: sql<number>`${clientesTable.totalGasto}::float`,
      tripsCount: clientesTable.viagensCount,
      phone: clientesTable.telefone,
    }).from(clientesTable)
      .where(eq(clientesTable.userId, userId))
      .orderBy(sql`${clientesTable.totalGasto}::numeric desc`)
      .limit(limit);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const limit = parseInt(req.query.limit as string) || 10;
  try {
    const rows = await db.select().from(atividadesTable)
      .where(eq(atividadesTable.userId, userId))
      .orderBy(desc(atividadesTable.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { clientesTable, pagamentosTable, viagensTable } from "@workspace/db";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateClienteBody, UpdateClienteBody, ListClientesQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/clientes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = ListClientesQueryParams.safeParse(req.query);
    const conditions = [eq(clientesTable.userId, userId)];
    if (parsed.success) {
      if (parsed.data.status) conditions.push(eq(clientesTable.status, parsed.data.status));
      if (parsed.data.search) conditions.push(ilike(clientesTable.nome, `%${parsed.data.search}%`));
    }
    const rows = await db.select().from(clientesTable)
      .where(and(...conditions))
      .orderBy(desc(clientesTable.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clientes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = CreateClienteBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.insert(clientesTable).values({ ...parsed.data, userId }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.select().from(clientesTable)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const parsed = UpdateClienteBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.update(clientesTable).set(parsed.data)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clientes/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.delete(clientesTable)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clientes/:id/history", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [cliente] = await db.select().from(clientesTable)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, userId)));
    if (!cliente) { res.status(404).json({ error: "Not found" }); return; }

    const payments = await db.select().from(pagamentosTable)
      .where(and(eq(pagamentosTable.clienteId, id), eq(pagamentosTable.userId, userId)))
      .orderBy(desc(pagamentosTable.createdAt));

    const tripIds = [...new Set(payments.filter(p => p.viagemId).map(p => p.viagemId!))];
    let trips: any[] = [];
    if (tripIds.length > 0) {
      trips = await db.select().from(viagensTable)
        .where(and(
          sql`${viagensTable.id} = ANY(${sql.raw(`ARRAY[${tripIds.join(",")}]`)})`,
          eq(viagensTable.userId, userId)
        ));
    }

    res.json({ cliente, payments, trips });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { pagamentosTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreatePagamentoBody, UpdatePagamentoBody, ListPagamentosQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/pagamentos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = ListPagamentosQueryParams.safeParse(req.query);
    const conditions = [eq(pagamentosTable.userId, userId)];
    if (parsed.success) {
      if (parsed.data.status) conditions.push(eq(pagamentosTable.status, parsed.data.status));
      if (parsed.data.metodo) conditions.push(eq(pagamentosTable.metodo, parsed.data.metodo));
      if (parsed.data.clienteId) conditions.push(eq(pagamentosTable.clienteId, parsed.data.clienteId));
      if (parsed.data.viagemId) conditions.push(eq(pagamentosTable.viagemId, parsed.data.viagemId));
    }
    const rows = await db.select().from(pagamentosTable)
      .where(and(...conditions))
      .orderBy(desc(pagamentosTable.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pagamentos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = CreatePagamentoBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.insert(pagamentosTable).values({ ...parsed.data, userId }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pagamentos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.select().from(pagamentosTable)
      .where(and(eq(pagamentosTable.id, id), eq(pagamentosTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/pagamentos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const parsed = UpdatePagamentoBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.update(pagamentosTable).set(parsed.data)
      .where(and(eq(pagamentosTable.id, id), eq(pagamentosTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pagamentos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.delete(pagamentosTable)
      .where(and(eq(pagamentosTable.id, id), eq(pagamentosTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { viagensTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateViagemBody, UpdateViagemBody, ListViagensQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/viagens", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = ListViagensQueryParams.safeParse(req.query);
    const conditions = [eq(viagensTable.userId, userId)];
    if (parsed.success && parsed.data.status) {
      conditions.push(eq(viagensTable.status, parsed.data.status));
    }
    const rows = await db.select().from(viagensTable)
      .where(and(...conditions))
      .orderBy(desc(viagensTable.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/viagens", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = CreateViagemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }
    const [row] = await db.insert(viagensTable).values({ ...parsed.data, userId }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/viagens/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.select().from(viagensTable)
      .where(and(eq(viagensTable.id, id), eq(viagensTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/viagens/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const parsed = UpdateViagemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }
    const [row] = await db.update(viagensTable).set(parsed.data)
      .where(and(eq(viagensTable.id, id), eq(viagensTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/viagens/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.delete(viagensTable)
      .where(and(eq(viagensTable.id, id), eq(viagensTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/viagens/:id/occupancy", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.select().from(viagensTable)
      .where(and(eq(viagensTable.id, id), eq(viagensTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const preco = parseFloat(row.precoPorAssento);
    const disponivel = row.assentosTotal - row.assentosVendidos;
    res.json({
      viagemId: row.id,
      destino: row.destino,
      assentosTotal: row.assentosTotal,
      assentosVendidos: row.assentosVendidos,
      assentosDisponiveis: disponivel,
      percentualOcupacao: row.assentosTotal > 0 ? (row.assentosVendidos / row.assentosTotal) * 100 : 0,
      receitaTotal: row.assentosVendidos * preco,
      receitaPendente: disponivel * preco,
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

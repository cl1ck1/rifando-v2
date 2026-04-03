import { Router } from "express";
import { db } from "@workspace/db";
import { produtosTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateProdutoBody, UpdateProdutoBody, ListProdutosQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/produtos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = ListProdutosQueryParams.safeParse(req.query);
    const conditions = [eq(produtosTable.userId, userId)];
    if (parsed.success) {
      if (parsed.data.categoriaId) conditions.push(eq(produtosTable.categoriaId, parsed.data.categoriaId));
      if (parsed.data.ativo !== undefined) conditions.push(eq(produtosTable.ativo, parsed.data.ativo));
    }
    const rows = await db.select().from(produtosTable)
      .where(and(...conditions))
      .orderBy(desc(produtosTable.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/produtos", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = CreateProdutoBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.insert(produtosTable).values({ ...parsed.data, userId }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.select().from(produtosTable)
      .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const parsed = UpdateProdutoBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.update(produtosTable).set(parsed.data)
      .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/produtos/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.delete(produtosTable)
      .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

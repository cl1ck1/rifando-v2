import { Router } from "express";
import { db } from "@workspace/db";
import { categoriasTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateCategoriaBody } from "@workspace/api-zod";

const router = Router();

router.get("/categorias", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const rows = await db.select().from(categoriasTable)
      .where(eq(categoriasTable.userId, userId))
      .orderBy(desc(categoriasTable.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categorias", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = CreateCategoriaBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.insert(categoriasTable).values({ ...parsed.data, userId }).returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categorias/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const id = parseInt(req.params.id);
  try {
    const [row] = await db.delete(categoriasTable)
      .where(and(eq(categoriasTable.id, id), eq(categoriasTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

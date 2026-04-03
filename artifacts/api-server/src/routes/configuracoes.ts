import { Router } from "express";
import { db } from "@workspace/db";
import { configuracoesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { UpdateConfiguracoesBody } from "@workspace/api-zod";

const router = Router();

router.get("/configuracoes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    let [row] = await db.select().from(configuracoesTable)
      .where(eq(configuracoesTable.userId, userId));
    if (!row) {
      [row] = await db.insert(configuracoesTable).values({ userId }).returning();
    }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/configuracoes", requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  try {
    const parsed = UpdateConfiguracoesBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

    const existing = await db.select().from(configuracoesTable)
      .where(eq(configuracoesTable.userId, userId));

    let row;
    if (existing.length === 0) {
      [row] = await db.insert(configuracoesTable).values({ ...parsed.data, userId }).returning();
    } else {
      [row] = await db.update(configuracoesTable).set(parsed.data)
        .where(eq(configuracoesTable.userId, userId))
        .returning();
    }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import cron from "node-cron";
import { db } from "@workspace/db";
import { parcelasTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { logger } from "./logger.js";

/**
 * Scheduler que identifica parcelas vencidas e marca como "atrasada"
 * Roda diariamente às 00:00 (meia-noite)
 */
export function startScheduler() {
  // Marcar parcelas pendentes vencidas como "atrasada"
  cron.schedule("0 0 * * *", async () => {
    logger.info("Scheduler: verificando parcelas vencidas...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await db.update(parcelasTable)
        .set({ status: "atrasada" })
        .where(and(
          eq(parcelasTable.status, "pendente"),
          sql`${parcelasTable.dataVencimento} < ${today}`
        ))
        .returning({ id: parcelasTable.id });

      logger.info(`Scheduler: ${result.length} parcelas marcadas como atrasada`);
    } catch (error) {
      logger.error({ err: error }, "Scheduler: erro ao verificar parcelas vencidas");
    }
  });

  logger.info("Scheduler de cobrança iniciado (diário às 00:00)");
}

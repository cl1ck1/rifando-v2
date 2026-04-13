import { Router, type IRouter, type Request, type Response } from "express";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { contentType } = parsed.data;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    res.status(400).json({ error: "Tipo de arquivo nao permitido. Apenas imagens sao aceitas." });
    return;
  }

  try {
    const { name, size } = parsed.data;
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/objects/uploads/*
 */
router.get("/storage/objects/uploads/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/uploads/${wildcardPath}`;
    const file = await objectStorageService.getObjectEntityFile(objectPath);

    res.setHeader("Content-Type", file.metadata["Content-Type"] || "application/octet-stream");
    res.setHeader("Cache-Control", file.metadata["Cache-Control"] || "public, max-age=3600");
    if (file.metadata["Content-Length"]) {
      res.setHeader("Content-Length", file.metadata["Content-Length"]);
    }

    const reader = file.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;

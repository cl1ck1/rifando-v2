import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export interface AuthRequest extends Request {
  userId: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Demo mode: skip auth if no Clerk key
  if (!process.env.CLERK_SECRET_KEY) {
    (req as AuthRequest).userId = "demo-user";
    return next();
  }
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthRequest).userId = userId as string;
  next();
};

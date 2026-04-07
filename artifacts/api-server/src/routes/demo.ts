import { Router } from "express";

const router = Router();

const DEMO_USER_EMAIL = "demo@sourifeiro.app";

router.get("/demo/sign-in-token", async (req, res) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: "Demo not available" });
  }

  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(DEMO_USER_EMAIL)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const users = await searchRes.json() as Array<{ id: string }>;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({ error: "Conta demo não encontrada" });
    }

    const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: users[0].id, expires_in_seconds: 300 }),
    });
    const data = await tokenRes.json() as { token?: string; errors?: unknown };
    if (!tokenRes.ok || !data.token) {
      return res.status(500).json({ error: "Falha ao gerar token" });
    }

    return res.json({ token: data.token });
  } catch {
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;

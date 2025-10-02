import { Router } from "express";
import { signToken } from "../auth/jwt.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // 1) Valida credenciales contra tu DB (pseudo)
  const user = await findUserByEmail(email);
  const ok = user && (await compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  // 2) Crea JWT con claims mínimos (no datos sensibles)
  const token = signToken({ sub: user.id, role: user.role || "user" });

  // 3) Envía cookie httpOnly (segura en prod, controla SameSite)
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",     // si frontend y backend están en mismo sitio
    maxAge: 1000 * 60 * 15, // 15 min (sincroniza con JWT_EXPIRES_IN)
    path: "/",
  });

  return res.json({ message: "Login ok" });
});

export default router;

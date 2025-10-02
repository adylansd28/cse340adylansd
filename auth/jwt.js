import jwt from "jsonwebtoken";

const { JWT_SECRET, JWT_EXPIRES_IN = "15m" } = process.env;

export function signToken(payload) {
  // payload mínimo: { sub: userId, role?: 'user'|'admin' }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

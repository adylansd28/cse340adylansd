const jwt = require("jsonwebtoken")

function requireAuth(req, res, next) {
  const name = process.env.COOKIE_NAME || "token"
  const token = req.cookies?.[name]
  if (!token) return res.status(401).json({ message: "No autenticado" })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" })
  }
}

module.exports = requireAuth
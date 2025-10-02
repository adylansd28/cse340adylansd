// utilities/auth-middleware.js
const jwt = require("jsonwebtoken")

/** Obtiene el token JWT de la cookie o del header Authorization */
function getTokenFromRequest(req) {
  // Cookie 'jwt' (recomendada)
  if (req.cookies && req.cookies.jwt) return req.cookies.jwt

  // Soporte opcional Bearer <token>
  const auth = req.get("authorization") || req.get("Authorization")
  if (auth && auth.startsWith("Bearer ")) return auth.substring(7)

  return null
}

/** Inyecta info de sesión en res.locals para EJS (header, vistas, etc.) */
function injectAuth(req, res, next) {
  const token = getTokenFromRequest(req)
  res.locals.loggedin = false
  res.locals.accountData = null

  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // payload debe contener: account_id, account_firstname, account_lastname, account_email, account_type
    req.account = payload
    res.locals.loggedin = true
    res.locals.accountData = payload
  } catch {
    // Token inválido/expirado: limpiar e ignorar
    if (res.clearCookie) res.clearCookie("jwt")
  }
  next()
}

/** Requiere estar autenticado */
function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req)
  if (!token) {
    if (req.flash) req.flash("notice", "Please log in to continue.")
    return res.redirect("/account/login")
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.account = payload
    res.locals.loggedin = true
    res.locals.accountData = payload
    next()
  } catch {
    if (res.clearCookie) res.clearCookie("jwt")
    if (req.flash) req.flash("notice", "Your session has expired. Please log in again.")
    return res.redirect("/account/login")
  }
}

/** Requiere rol Employee o Admin (para rutas de inventario protegidas) */
function requireEmployeeOrAdmin(req, res, next) {
  // Asegura que esté autenticado primero
  const token = getTokenFromRequest(req)
  if (!token) {
    if (req.flash) req.flash("notice", "Please log in to continue.")
    return res.redirect("/account/login")
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const role = (payload.account_type || "").toLowerCase()
    const allowed = role === "employee" || role === "admin"

    if (!allowed) {
      if (req.flash) req.flash("notice", "You do not have permission to access that resource.")
      return res.redirect("/account")
    }

    // Hidratar contexto
    req.account = payload
    res.locals.loggedin = true
    res.locals.accountData = payload
    next()
  } catch {
    if (res.clearCookie) res.clearCookie("jwt")
    if (req.flash) req.flash("notice", "Your session has expired. Please log in again.")
    return res.redirect("/account/login")
  }
}

module.exports = {
  injectAuth,
  requireAuth,
  requireEmployeeOrAdmin,
}
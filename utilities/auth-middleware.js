// utilities/auth-middleware.js
const jwt = require("jsonwebtoken")

const COOKIE_NAME = process.env.COOKIE_NAME || "jwt"
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me" // asegúrate de definirlo en .env en prod

/** Obtiene el token JWT de la cookie o del header Authorization */
function getTokenFromRequest(req) {
  // Cookie 'jwt' (recomendada)
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME]

  // Soporte opcional: Authorization: Bearer <token>
  const auth = req.get("authorization") || req.get("Authorization")
  if (auth && auth.startsWith("Bearer ")) return auth.substring(7)

  return null
}

/** Inyecta info de sesión en res.locals para EJS (header, vistas, etc.) — verificación "suave" */
function injectAuth(req, res, next) {
  const token = getTokenFromRequest(req)

  // Valores por defecto para las vistas
  res.locals.loggedin = false
  res.locals.accountData = null
  res.locals.accountType = null

  if (!token) return next()

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // payload debe contener: account_id, account_firstname, account_lastname, account_email, account_type
    req.account = payload
    res.locals.loggedin = true
    res.locals.accountData = payload
    res.locals.accountType = payload.account_type || null
  } catch (_e) {
    // Token inválido/expirado → NO limpiar cookie aquí, solo continuar como anónimo
  }
  return next()
}

/** Requiere estar autenticado (para rutas protegidas) */
function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req)
  if (!token) {
    if (req.flash) req.flash("notice", "Please log in to continue.")
    return res.redirect("/account/login")
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.account = payload
    res.locals.loggedin = true
    res.locals.accountData = payload
    res.locals.accountType = payload.account_type || null
    return next()
  } catch (_e) {
    // No limpiar cookie aquí; solo pedir login nuevamente
    if (req.flash) req.flash("notice", "Your session has expired. Please log in again.")
    return res.redirect("/account/login")
  }
}

/** Requiere rol Employee o Admin (para rutas de inventario protegidas) */
function requireEmployeeOrAdmin(req, res, next) {
  const token = getTokenFromRequest(req)
  if (!token) {
    if (req.flash) req.flash("notice", "Please log in to continue.")
    return res.redirect("/account/login")
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
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
    res.locals.accountType = payload.account_type || null
    return next()
  } catch (_e) {
    if (req.flash) req.flash("notice", "Your session has expired. Please log in again.")
    return res.redirect("/account/login")
  }
}

module.exports = {
  injectAuth,
  requireAuth,
  requireEmployeeOrAdmin,
}
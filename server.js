// server.js
require("dotenv").config()
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const utilities = require("./utilities/")
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const session = require("express-session")
const pool = require("./database/")
const accountRoute = require("./routes/accountRoute")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const accountController = require("./controllers/accountController")
const auth = require("./utilities/auth-middleware")

const app = express()
const PORT = process.env.PORT || 5500
const HOST = "0.0.0.0"

/* ======================
 * Cookies httpOnly
 * ====================== */
app.use(cookieParser())

// --- RAYOS-X COOKIES ---
app.use((req, res, next) => {
  // IN: qué cookies llegan
  console.log("[IN ]", req.method, req.path, "Cookie:", req.headers.cookie || "(none)")

  // Hook: res.cookie
  const _cookie = res.cookie.bind(res)
  res.cookie = (name, val, opts) => {
    const valLog = typeof val === "string" ? (val.length > 25 ? val.slice(0,25)+"...":"<string>") : typeof val
    console.log("[SET]", name, "=", valLog, "opts:", opts)
    return _cookie(name, val, opts)
  }

  // Hook: res.clearCookie
  const _clear = res.clearCookie.bind(res)
  res.clearCookie = (name, opts) => {
    console.log("[CLR]", name, "opts:", opts)
    return _clear(name, opts)
  }

  next()
})


app.use(auth.injectAuth)

/* ======================
 * Session & flash msgs
 * ====================== */
app.use(session({
  store: new (require("connect-pg-simple")(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,             // requerido por connect-flash
  saveUninitialized: true,
  name: "sessionId",
}))
app.use(require("connect-flash")())
app.use((req, res, next) => {
  res.locals.messages = require("express-messages")(req, res)
  next()
})

/* ======================
 * Body parsers
 * ====================== */
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/* ======================
 * View engine + layouts
 * ====================== */
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")
app.use(utilities.checkJWTToken)

/* ======================
 * Archivos estáticos y /cause-error
 * ====================== */
app.use(staticRoutes)

/* =======================================================
 * ✅ Verificar JWT de la cookie y exponer datos a las vistas
 *    - Si es válido: res.locals.accountData y res.locals.loggedin = 1
 *    - Si no hay cookie o es inválido: sigue sin romper el flujo
 * ======================================================= */

/* ======================
 * Rutas principales
 * ====================== */
app.get("/", utilities.handleErrors(baseController.buildHome))
app.use("/inv", inventoryRoute)
app.use("/account", accountRoute)
app.get("/logout", utilities.handleErrors(accountController.logout))

/* ======================
 * 404
 * ====================== */
app.use((req, res, next) => {
  next({ status: 404, message: "The page you requested was not found." })
})

/* ======================
 * Global Error Handler
 * ====================== */
app.use(async (err, req, res, next) => {
  try {
    const status = err.status || 500
    const nav = await utilities.getNav(req)

    console.error(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${status} | ${err.message}`
    )

    if (status === 404) {
      return res.status(404).render("errors/404", {
        title: "404 Not Found",
        nav,
        message: err.message || "Page not found.",
      })
    }

    return res.status(500).render("errors/500", {
      title: "500 Server Error",
      nav,
      message: "Oh no! There was a crash. Please try again later.",
    })
  } catch (renderErr) {
    console.error("Error while rendering error view:", renderErr)
    res.status(500).send("Server Error")
  }
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
})
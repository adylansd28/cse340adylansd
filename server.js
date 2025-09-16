// server.js
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const utilities = require("./utilities/")
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")

const app = express()
const PORT = process.env.PORT || 5500
const HOST = "0.0.0.0"

// View engine + layouts
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")

// Static routes (assets + /cause-error)
app.use(staticRoutes)

// Home (wrapped)
app.get("/", utilities.handleErrors(baseController.buildHome))

// Inventory routes
app.use("/inv", inventoryRoute)

/* ***********************
 * 404 → forward to error handler
 *************************/
app.use((req, res, next) => {
  next({ status: 404, message: "The page you requested was not found." })
})

/* ***********************
 * Global Error Handler (500/404)
 *************************/
app.use(async (err, req, res, next) => {
  try {
    const status = err.status || 500
    const nav = await utilities.getNav(req)

    // Log server-side
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

    // Default: 500
    return res.status(500).render("errors/500", {
      title: "500 Server Error",
      nav,
      message: "Oh no! There was a crash. Please try again later.",
    })
  } catch (renderErr) {
    // Fallback ultra-defensivo
    console.error("Error while rendering error view:", renderErr)
    res.status(500).send("Server Error")
  }
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
})
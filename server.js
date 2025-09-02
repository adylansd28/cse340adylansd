// server.js
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const staticRoutes = require("./routes/static")

const app = express()
const PORT = process.env.PORT || 5500;
const HOST = "0.0.0.0";

// View engine + layouts
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")

// Rutas estáticas
app.use(staticRoutes)

// Ruta index
app.get("/", (req, res) => {
  res.render("index", { title: "Home" })
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

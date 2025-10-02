// utilities/index.js
const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const COOKIE_NAME = process.env.COOKIE_NAME || "jwt"

const Util = {}

/* ************************
 * Build top navigation (ul > li > a)
 * - Highlights current route
 ************************** */
Util.getNav = async function (req) {
  // Combina mount + path y normaliza
  const currentUrlRaw = `${req?.baseUrl || ""}${req?.path || "/"}`
  const current = currentUrlRaw.replace(/\/+$/, "") || "/" // quita "/" final excepto raíz

  const data = await invModel.getClassifications()
  let list = "<ul>"

  // Home
  const isHome = current === "/"
  list += `<li><a href="/" title="Home page"${isHome ? ' class="active" aria-current="page"' : ""}>Home</a></li>`

  // Clasificaciones
  data.rows.forEach((row) => {
    const href = `/inv/type/${row.classification_id}`
    const isActive = current === href
    list += `<li><a href="${href}" title="See our inventory of ${row.classification_name} vehicles"${isActive ? ' class="active" aria-current="page"' : ""}>${row.classification_name}</a></li>`
  })

  // My Account (dinámico: login vs no login)
  if (req?.res?.locals?.loggedin) {
    const isAccount = current === "/account"
    list += `<li><a href="/account" title="Manage your account"${isAccount ? ' class="active" aria-current="page"' : ""}>My Account</a></li>`
  } else {
    const isLogin = current === "/account/login"
    list += `<li><a href="/account/login" title="Login to your account"${isLogin ? ' class="active" aria-current="page"' : ""}>My Account</a></li>`
  }

  list += "</ul>"
  return list
}

/* **************************************
 * Build the classification grid HTML
 * ************************************ */
Util.buildClassificationGrid = function (data) {
  if (!data || data.length === 0) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }

  let grid = '<ul id="inv-display">'
  data.forEach((vehicle) => {
    grid += "<li>"
    grid +=
      '<a href="../../inv/detail/' +
      vehicle.inv_id +
      '" title="View ' +
      vehicle.inv_make +
      " " +
      vehicle.inv_model +
      ' details"><img src="' +
      vehicle.inv_thumbnail +
      '" alt="Image of ' +
      vehicle.inv_make +
      " " +
      vehicle.inv_model +
      ' on CSE Motors" /></a>'
    grid += '<div class="namePrice">'
    grid += "<hr />"
    grid += "<h2>"
    grid +=
      '<a href="../../inv/detail/' +
      vehicle.inv_id +
      '" title="View ' +
      vehicle.inv_make +
      " " +
      vehicle.inv_model +
      ' details">' +
      vehicle.inv_make +
      " " +
      vehicle.inv_model +
      "</a>"
    grid += "</h2>"
    grid += "<span>" + Util.formatUSD(vehicle.inv_price) + "</span>"
    grid += "</div>"
    grid += "</li>"
  })
  grid += "</ul>"
  return grid
}

/* **************************************
 * Build the vehicle detail HTML (single item)
 ************************************ */
Util.buildVehicleDetailHTML = function (v) {
  const title = `${v.inv_year} ${v.inv_make} ${v.inv_model}`
  const price = Util.formatUSD(v.inv_price)
  const miles = Util.formatNumber(v.inv_miles)

  return `
  <section class="vehicle-detail">
    <div class="vehicle-detail__media">
      <img src="${v.inv_image}" alt="${title}" />
    </div>
    <div class="vehicle-detail__content">
      <h1 class="vehicle-detail__title">${title}</h1>
      <p class="vehicle-detail__price"><strong>Price:</strong> ${price}</p>
      <p class="vehicle-detail__miles"><strong>Mileage:</strong> ${miles} miles</p>
      <p class="vehicle-detail__color"><strong>Color:</strong> ${v.inv_color}</p>
      <p class="vehicle-detail__class"><strong>Classification:</strong> ${v.classification_name}</p>
      <p class="vehicle-detail__desc">${v.inv_description}</p>
    </div>
  </section>
  `
}

/* **************************************
 * Build the <select> for classifications
 * ************************************ */
Util.buildClassificationList = async function (classification_id = null) {
  const data = await invModel.getClassifications()
  const rows = data?.rows ?? data // por si getClassifications ya devuelve .rows

  if (!Array.isArray(rows)) {
    throw new Error("getClassifications() did not return an array")
  }

  let html = '<select name="classification_id" id="classificationList" required>'
  html += "<option value=''>Choose a Classification</option>"

  for (const row of rows) {
    const selected =
      classification_id != null &&
      String(row.classification_id) === String(classification_id)
        ? " selected"
        : ""
    html += `<option value="${row.classification_id}"${selected}>${row.classification_name}</option>`
  }
  html += "</select>"
  return html
}

/* **************************************
 * Format helpers
 ************************************ */
Util.formatUSD = function (value) {
  const n = Number(value) || 0
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

Util.formatNumber = function (value) {
  const n = Number(value) || 0
  return n.toLocaleString("en-US")
}

/* ****************************************
 * Error-handling wrapper
 **************************************** */
Util.handleErrors =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

/* ****************************************
 * Paso 7: Middleware para verificar JWT en la cookie
 * - Si existe y es válido → expone accountData y loggedin=1
 * - Si existe y es inválido/expiró → limpia cookie, loggedin=0
 * - Si no existe → continúa sin romper páginas públicas
 **************************************** */

/* ****************************************
 * Middleware to check token validity
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  const { cookies = {} } = req
  const token = cookies[COOKIE_NAME] // 👈 usa el nombre unificado

  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
      if (err) {
        // token inválido => limpia y pide login
        res.clearCookie(COOKIE_NAME)
        // no uses flash aquí si no estás seguro de la sesión
        return res.redirect("/account/login")
      }
      res.locals.accountData = accountData
      res.locals.loggedin = 1
      return next()
    })
  } else {
    return next()
  }
}

/* ****************************************
 * (Opcional) Guard para proteger rutas privadas
 * Úsalo en rutas que requieran sesión:
 *   router.get("/account", Util.requireAuth, controller.buildAccount)
 **************************************** */
Util.requireAuth = (req, res, next) => {
  if (res.locals?.loggedin === 1 && res.locals?.accountData) return next()
  req.flash("notice", "Please log in.")
  return res.redirect("/account/login")
}

/* ****************************************
 *  Check Login
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
}


module.exports = Util
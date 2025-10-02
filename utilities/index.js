// utilities/index.js
const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const COOKIE_NAME = process.env.COOKIE_NAME || "jwt"
const JWT_SECRET  = process.env.JWT_SECRET  || "dev_secret_change_me"

const Util = {}

/* ---------------------------
 * Helpers
 * ------------------------- */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function toRows(resultOrArray) {
  // Normaliza: puede venir como array o como { rows }
  if (Array.isArray(resultOrArray)) return resultOrArray
  if (resultOrArray && Array.isArray(resultOrArray.rows)) return resultOrArray.rows
  return []
}

function redirectWithMessage(req, res, path, msg) {
  if (msg && typeof req.flash === "function") req.flash("notice", msg)
  return res.redirect(path)
}

/* ************************
 * Build top navigation (ul > li > a)
 * - Highlights current route
 ************************** */
Util.getNav = async function (req) {
  const base = req?.baseUrl || ""
  const path = req?.path || "/"
  const current = (`${base}${path}`).replace(/\/+$/, "") || "/"

  const result = await invModel.getClassifications()
  const rows = toRows(result)

  let list = "<ul>"

  // Home
  const isHome = current === "/"
  list += `<li><a href="/" title="Home page"${isHome ? ' class="active" aria-current="page"' : ""}>Home</a></li>`

  // Clasificaciones
  for (const row of rows) {
    const href = `/inv/type/${row.classification_id}`
    const isActive = current === href
    const name = escapeHtml(row.classification_name)
    list += `<li><a href="${href}" title="See our inventory of ${name} vehicles"${isActive ? ' class="active" aria-current="page"' : ""}>${name}</a></li>`
  }

  list += "</ul>"
  return list
}

/* **************************************
 * Build the classification grid HTML
 *  - Acepta array vacío sin romper
 * ************************************ */
Util.buildClassificationGrid = function (data) {
  const list = Array.isArray(data) ? data : []
  if (list.length === 0) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }

  let grid = '<ul id="inv-display">'
  for (const v of list) {
    const id = v.inv_id
    const name = `${v.inv_make ?? ""} ${v.inv_model ?? ""}`.trim()
    const nameEsc = escapeHtml(name)
    const thumb = v.inv_thumbnail ? escapeHtml(v.inv_thumbnail) : "/images/no-image.png"
    const price = Util.formatUSD(v.inv_price)

    grid += `
      <li>
        <a href="/inv/detail/${id}" title="View ${nameEsc} details">
          <img src="${thumb}" alt="Image of ${nameEsc} on CSE Motors" />
        </a>
        <div class="namePrice">
          <hr />
          <h2>
            <a href="/inv/detail/${id}" title="View ${nameEsc} details">${nameEsc}</a>
          </h2>
          <span>${price}</span>
        </div>
      </li>`
  }
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
      <img src="${escapeHtml(v.inv_image)}" alt="${escapeHtml(title)}" />
    </div>
    <div class="vehicle-detail__content">
      <h1 class="vehicle-detail__title">${escapeHtml(title)}</h1>
      <p class="vehicle-detail__price"><strong>Price:</strong> ${price}</p>
      <p class="vehicle-detail__miles"><strong>Mileage:</strong> ${miles} miles</p>
      <p class="vehicle-detail__color"><strong>Color:</strong> ${escapeHtml(v.inv_color)}</p>
      <p class="vehicle-detail__class"><strong>Classification:</strong> ${escapeHtml(v.classification_name)}</p>
      <p class="vehicle-detail__desc">${escapeHtml(v.inv_description)}</p>
    </div>
  </section>
  `
}

/* **************************************
 * Build the <select> for classifications
 * ************************************ */
Util.buildClassificationList = async function (classification_id = null) {
  const result = await invModel.getClassifications()
  const rows = toRows(result)

  let html = '<select name="classification_id" id="classificationList" required>'
  html += "<option value=''>Choose a Classification</option>"

  for (const row of rows) {
    const selected =
      classification_id != null &&
      String(row.classification_id) === String(classification_id)
        ? " selected"
        : ""
    html += `<option value="${row.classification_id}"${selected}>${escapeHtml(row.classification_name)}</option>`
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
 * Middleware: hidratar login desde cookie JWT (suave)
 * - Si token válido → res.locals.loggedin/accountData
 * - Si no hay token o es inválido → seguir como anónimo (NO limpiar cookie)
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  const token = req?.cookies?.[COOKIE_NAME]
  res.locals.loggedin = false
  res.locals.accountData = null

  if (!token) return next()

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.locals.loggedin = true
    res.locals.accountData = payload
    return next()
  } catch {
    return next()
  }
}

/* ****************************************
 * Guards
 **************************************** */
Util.requireAuth = (req, res, next) => {
  if (res.locals?.loggedin && res.locals?.accountData) return next()
  return redirectWithMessage(req, res, "/account/login", "Please log in to continue.")
}

// Unificado para rutas de inventario protegidas
Util.requireEmployeeOrAdmin = (req, res, next) => {
  const loggedIn = !!res.locals?.loggedin
  const accType  = res.locals?.accountData?.account_type

  if (!loggedIn) {
    return redirectWithMessage(req, res, "/account/login", "Please log in to continue.")
  }
  if (!["Employee", "Admin"].includes(accType)) {
    return redirectWithMessage(req, res, "/account", "You are not authorized to access that page.")
  }
  return next()
}

Util.noCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  res.set("Pragma", "no-cache")
  res.set("Expires", "0")
  next()
}

// Alias histórico (si alguna ruta lo usa)
Util.checkLogin = Util.requireAuth

module.exports = Util

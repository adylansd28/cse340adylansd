// controllers/accountController.js
const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const COOKIE_NAME = process.env.COOKIE_NAME || "jwt"

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res) {
  const nav = await utilities.getNav(req)
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res) {
  const nav = await utilities.getNav(req)
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  const nav = await utilities.getNav(req)
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // 1) Hash password
  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(account_password, 10)
  } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.")
    return res.status(500).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  }

  // 2) Save user
  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  if (regResult && regResult.rowCount === 1) {
    req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`)
    return res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null,
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    return res.status(501).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  }
}

/* ****************************************
*  Process Login (JWT + httpOnly cookie)
* *************************************** */
async function accountLogin(req, res) {
  const nav = await utilities.getNav(req)
  const { account_email, account_password } = req.body

  try {
    // 1) Buscar usuario por email
    const user = await accountModel.getAccountByEmail(account_email)
    if (!user) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    // 2) Verificar contraseña
    const ok = await bcrypt.compare(account_password, user.account_password)
    if (!ok) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    // 3) Payload + JWT
    const payload = {
      account_id: user.account_id,
      account_firstname: user.account_firstname || "",
      account_lastname: user.account_lastname || "",
      account_email: user.account_email,
      account_type: user.account_type,
    }

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })

    // 4) Set cookie consistente con COOKIE_NAME
    const isDev = process.env.NODE_ENV === "development"
    const cookieOpts = {
      httpOnly: true,
      maxAge: 3600 * 1000, // 1 hora
      ...(isDev ? {} : { secure: true, sameSite: "lax" }),
      path: "/",
    }
    res.cookie(COOKIE_NAME, accessToken, cookieOpts)

    // 5) Redirección a /account
    return res.redirect("/account/")
  } catch (err) {
    console.error("Login error:", err)
    req.flash("notice", "Access Forbidden")
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
  }
}

/* ****************************************
*  Logout simple: limpiar solo JWT y volver a login
*  (si usas esta ruta: /account/logout)
* *************************************** */
function logoutAccount(req, res) {
  const isDev = process.env.NODE_ENV === "development"
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    ...(isDev ? {} : { secure: true, sameSite: "lax" }),
    path: "/",
  })
  return res.redirect("/account/login")
}

/* ****************************************
*  Account Management view
* *************************************** */
async function buildAccountManagement(req, res) {
  const nav = await utilities.getNav(req)
  const account = res.locals?.accountData || null
  if (!account) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  return res.render("account/index", {
    title: "Account Management",
    nav,
    errors: null,
    account,
    accountData: account, // alias por compatibilidad
    loggedin: 1,
  })
}

/* ****************************************
*  Logout completo: limpia JWT + destruye sesión y vuelve a /
*  (si usas /account/logout o /logout)
* *************************************** */
function logout(req, res) {
  try {
    // Limpia JWT
    const isDev = process.env.NODE_ENV === "development"
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      ...(isDev ? {} : { secure: true, sameSite: "lax" }),
      path: "/",
    })

    // Destruye la sesión si existe y limpia cookie de sesión
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err)
        res.clearCookie("sessionId") // usa el nombre real que diste a la cookie de sesión
        return res.redirect("/")
      })
    } else {
      return res.redirect("/")
    }
  } catch (e) {
    console.error("Logout error:", e)
    return res.redirect("/")
  }
}

// Alias por compatibilidad con rutas antiguas
const buildManagement = buildAccountManagement

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  logoutAccount,
  buildAccountManagement,
  buildManagement, // alias
  logout,
}
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

  // Hash password
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

  // Save user
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
    // Buscar usuario por email
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

    // Verificar contraseña
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

    // Payload + JWT
    const payload = {
      account_id: user.account_id,
      account_firstname: user.account_firstname || "",
      account_lastname: user.account_lastname || "",
      account_email: user.account_email,
      account_type: user.account_type,
    }

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })

    // Set cookie
    const isDev = process.env.NODE_ENV === "development"
    const cookieOpts = {
      httpOnly: true,
      maxAge: 3600 * 1000, // 1h
      ...(isDev ? {} : { secure: true, sameSite: "lax" }),
      path: "/",
    }
    res.cookie(COOKIE_NAME, accessToken, cookieOpts)

    // Redirección a /account (el middleware poblará res.locals.accountData)
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
*  Logout (limpia JWT y redirige a login)
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
*  Logout completo (JWT + session) → home
* *************************************** */
function logout(req, res) {
  try {
    const isDev = process.env.NODE_ENV === "development"
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      ...(isDev ? {} : { secure: true, sameSite: "lax" }),
      path: "/",
    })

    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err)
        res.clearCookie("sessionId")
        res.clearCookie("jwt")
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
    accountData: account, // para EJS parciales (header.ejs)
    loggedin: 1,
  })
}

/* ****************************************
*  Build Update Account view (GET /account/update/:account_id)
* *************************************** */
async function buildUpdateView(req, res) {
  const nav = await utilities.getNav(req)
  const { account_id } = req.params

  // Seguridad básica: solo el dueño o admin/employee puede acceder
  const me = res.locals?.accountData
  if (!me) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) {
    req.flash("notice", "Not authorized.")
    return res.redirect("/account/")
  }

  const user = await accountModel.getAccountById(account_id)
  if (!user) {
    req.flash("notice", "Account not found.")
    return res.redirect("/account/")
  }

  return res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    // sticky values
    account_id: user.account_id,
    account_firstname: user.account_firstname,
    account_lastname: user.account_lastname,
    account_email: user.account_email,
  })
}

/* ****************************************
*  Update account info (POST /account/update)
* *************************************** */
async function updateAccount(req, res) {
  const nav = await utilities.getNav(req)
  const { account_id, account_firstname, account_lastname, account_email } = req.body

  // Seguridad básica
  const me = res.locals?.accountData
  if (!me) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) {
    req.flash("notice", "Not authorized.")
    return res.redirect("/account/")
  }

  // Validaciones simples
  if (!account_firstname || !account_lastname || !account_email) {
    req.flash("notice", "All fields are required.")
    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(account_email)) {
    req.flash("notice", "Please enter a valid email address.")
    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    })
  }

  try {
    const result = await accountModel.updateAccountInfo(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    )

    if (result && (result.rowCount === 1 || result.rows?.length === 1)) {
      req.flash("notice", "Account information updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Update failed. Please try again.")
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname,
        account_lastname,
        account_email,
      })
    }
  } catch (err) {
    console.error("Update account error:", err)
    req.flash("notice", "An error occurred while updating the account.")
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    })
  }
}

/* ****************************************
*  Update password (POST /account/update-password)
* *************************************** */
async function updatePassword(req, res) {
  const nav = await utilities.getNav(req)
  const { account_id, account_password } = req.body

  // Seguridad básica
  const me = res.locals?.accountData
  if (!me) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) {
    req.flash("notice", "Not authorized.")
    return res.redirect("/account/")
  }

  // Validación simple de password (puedes alinear con tu validator)
  if (!account_password || account_password.length < 8) {
    req.flash("notice", "Password must be at least 8 characters.")
    // Volver a la vista con datos mínimos para no perder el contexto
    const user = await accountModel.getAccountById(account_id)
    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname: user?.account_firstname || "",
      account_lastname: user?.account_lastname || "",
      account_email: user?.account_email || "",
    })
  }

  try {
    const hashed = await bcrypt.hash(account_password, 10)
    const result = await accountModel.updatePassword(account_id, hashed)

    if (result && (result.rowCount === 1 || result.rows?.length === 1)) {
      req.flash("notice", "Password updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Password update failed. Please try again.")
      const user = await accountModel.getAccountById(account_id)
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname: user?.account_firstname || "",
        account_lastname: user?.account_lastname || "",
        account_email: user?.account_email || "",
      })
    }
  } catch (err) {
    console.error("Update password error:", err)
    req.flash("notice", "An error occurred while updating the password.")
    const user = await accountModel.getAccountById(account_id)
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname: user?.account_firstname || "",
      account_lastname: user?.account_lastname || "",
      account_email: user?.account_email || "",
    })
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
  buildUpdateView,
  updateAccount,
  updatePassword,
}
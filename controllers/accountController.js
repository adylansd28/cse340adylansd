// controllers/accountController.js
const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const COOKIE_NAME = process.env.COOKIE_NAME || "jwt"
const JWT_SECRET  = process.env.JWT_SECRET  || "dev_secret_change_me"

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res) {
  const nav = await utilities.getNav(req)
  res.render("account/login", { title: "Login", nav, errors: null })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res) {
  const nav = await utilities.getNav(req)
  res.render("account/register", { title: "Register", nav, errors: null })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  const nav = await utilities.getNav(req)
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10)
    const regResult = await accountModel.registerAccount(
      account_firstname, account_lastname, account_email, hashedPassword
    )

    if (regResult && regResult.rowCount === 1) {
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`)
      return res.status(201).render("account/login", { title: "Login", nav, errors: null })
    }

    req.flash("notice", "Sorry, the registration failed.")
    return res.status(501).render("account/register", {
      title: "Register", nav, errors: null,
      account_firstname, account_lastname, account_email
    })
  } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.")
    return res.status(500).render("account/register", {
      title: "Register", nav, errors: null,
      account_firstname, account_lastname, account_email
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
    const user = await accountModel.getAccountByEmail(account_email)
    if (!user) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email })
    }

    const ok = await bcrypt.compare(account_password, user.account_password)
    if (!ok) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email })
    }

    const payload = {
      account_id: user.account_id,
      account_firstname: user.account_firstname || "",
      account_lastname:  user.account_lastname  || "",
      account_email: user.account_email,
      account_type:  user.account_type,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 1000 * 60 * 60,
    })

    return res.redirect("/account")
  } catch (err) {
    console.error("Login error:", err)
    req.flash("notice", "Access Forbidden")
    return res.status(500).render("account/login", { title: "Login", nav, errors: null, account_email })
  }
}

/* ****************************************
*  Logout (limpia JWT y redirige a login)
* *************************************** */
function logoutAccount(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  })
  return res.redirect("/account/login")
}

/* ****************************************
*  Logout completo (JWT + session) → home
* *************************************** */
function logout(req, res) {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    })

    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err)
        res.clearCookie("sessionId", { path: "/" })
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
    accountData: account,
    loggedin: 1,
  })
}

/* ****************************************
*  Build Update Account view (GET /account/update/:account_id)
* *************************************** */
async function buildUpdateView(req, res) {
  const nav = await utilities.getNav(req)
  const { account_id } = req.params

  const me = res.locals?.accountData
  if (!me) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) {
    req.flash("notice", "Not authorized.")
    return res.redirect("/account")
  }

  const user = await accountModel.getAccountById(account_id)
  if (!user) {
    req.flash("notice", "Account not found.")
    return res.redirect("/account")
  }

  return res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
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

  const me = res.locals?.accountData
  if (!me) { req.flash("notice", "Please log in."); return res.redirect("/account/login") }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) { req.flash("notice", "Not authorized."); return res.redirect("/account") }

  if (!account_firstname || !account_lastname || !account_email) {
    req.flash("notice", "All fields are required.")
    return res.status(400).render("account/update", {
      title: "Update Account", nav, errors: null,
      account_id, account_firstname, account_lastname, account_email
    })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(account_email)) {
    req.flash("notice", "Please enter a valid email address.")
    return res.status(400).render("account/update", {
      title: "Update Account", nav, errors: null,
      account_id, account_firstname, account_lastname, account_email
    })
  }

  try {
    const result = await accountModel.updateAccountInfo(
      account_id, account_firstname, account_lastname, account_email
    )

    if (result && (result.rowCount === 1 || result.rows?.length === 1)) {
      // 🚀 Tomar datos frescos y reemitir JWT
      const fresh = await accountModel.getAccountById(account_id)
      const payload = {
        account_id: fresh.account_id,
        account_firstname: fresh.account_firstname || "",
        account_lastname:  fresh.account_lastname  || "",
        account_email:     fresh.account_email,
        account_type:      me.account_type, // o fresh.account_type si también puede cambiar
      }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge: 1000 * 60 * 60,
      })

      req.flash("notice", "Account information updated successfully.")
      return res.redirect("/account")
    }

    req.flash("notice", "Update failed. Please try again.")
    return res.status(500).render("account/update", {
      title: "Update Account", nav, errors: null,
      account_id, account_firstname, account_lastname, account_email
    })
  } catch (err) {
    console.error("Update account error:", err)
    req.flash("notice", "An error occurred while updating the account.")
    return res.status(500).render("account/update", {
      title: "Update Account", nav, errors: null,
      account_id, account_firstname, account_lastname, account_email
    })
  }
}


/* ****************************************
*  Update password (POST /account/update-password)
* *************************************** */
async function updatePassword(req, res) {
  const nav = await utilities.getNav(req)
  const { account_id, account_password } = req.body

  const me = res.locals?.accountData
  if (!me) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
  const isSelf = String(me.account_id) === String(account_id)
  const isPrivileged = me.account_type === "Employee" || me.account_type === "Admin"
  if (!isSelf && !isPrivileged) {
    req.flash("notice", "Not authorized.")
    return res.redirect("/account")
  }

  if (!account_password || account_password.length < 8) {
    req.flash("notice", "Password must be at least 8 characters.")
    const user = await accountModel.getAccountById(account_id)
    return res.status(400).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname: user?.account_firstname || "",
      account_lastname:  user?.account_lastname  || "",
      account_email:     user?.account_email     || "",
    })
  }

  try {
    const hashed = await bcrypt.hash(account_password, 10)
    const result = await accountModel.updatePassword(account_id, hashed)

    if (result && (result.rowCount === 1 || result.rows?.length === 1)) {
      req.flash("notice", "Password updated successfully.")
      return res.redirect("/account")
    }

    req.flash("notice", "Password update failed. Please try again.")
    const user = await accountModel.getAccountById(account_id)
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname: user?.account_firstname || "",
      account_lastname:  user?.account_lastname  || "",
      account_email:     user?.account_email     || "",
    })
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
      account_lastname:  user?.account_lastname  || "",
      account_email:     user?.account_email     || "",
    })
  }
}

// Alias por compatibilidad
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
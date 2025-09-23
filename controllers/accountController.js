// controllers/accountController.js
const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  const nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  const nav = await utilities.getNav()
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
  const nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // 1) Hashear la contraseña antes de guardar
  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(account_password, 10) // 10 salt rounds
  } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.")
    return res.status(500).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      // stickiness
      account_firstname,
      account_lastname,
      account_email,
    })
  }

  // 2) Guardar usando el hash (no el texto plano)
  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  // 3) Responder según resultado
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
      // stickiness
      account_firstname,
      account_lastname,
      account_email,
    })
  }
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
}
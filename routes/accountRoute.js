// routes/accountRoute.js
const express = require("express")
const router = new express.Router()
const utilities = require("../utilities/")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

/* ***************
 *  Views
 * *************** */
router.get("/login", utilities.handleErrors(accountController.buildLogin))
router.get("/register", utilities.handleErrors(accountController.buildRegister))
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
)

/* ***************
 *  Process Registration
 * *************** */
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

/* ***************
 *  Process Login
 * *************** */
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin) // <- nombre correcto
)

/* ***************
 *  Process Logout
 * *************** */
router.post(
  "/logout",
  utilities.handleErrors(accountController.logoutAccount)
)

// routes/accountRoute.js
router.get("/logout", utilities.handleErrors(accountController.logout))

module.exports = router
const utilities = require(".") // asumiendo que utilities/index.js exporta getNav
const { body, validationResult } = require("express-validator")
const accountModel = require("../models/account-model")

const validate = {}

/* **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty().withMessage("Please provide a first name.")
      .bail()
      .isLength({ min: 1 }),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty().withMessage("Please provide a last name.")
      .bail()
      .isLength({ min: 2 }),

    // valid email is required and cannot already exist in the database
    body("account_email")
      .trim()
      .isEmail().withMessage("A valid email is required.")
      .bail()
      .normalizeEmail()
      .custom(async (account_email) => {
        const exists = await accountModel.checkExistingEmail(account_email)
        if (exists) {
          throw new Error("Email exists. Please log in or use a different email.")
        }
      }),

    body("account_password")
      .trim()
      .notEmpty().withMessage("Password is required.")
      .bail()
      // sin espacios (coincide con tu pattern de register.ejs)
      .matches(/^\S+$/).withMessage("Password cannot contain spaces.")
      .bail()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ]
}

/* ******************************
 * Check registration data and return errors or continue
 * (renders with stickiness on failure)
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    return res.render("account/register", {
      errors,
      title: "Register",
      nav,
      account_firstname,
      account_lastname,
      account_email,
    })
  }
  next()
}

/* **********************************
 *  Login Data Validation Rules
 *  (solo requeridos, sin complejidad)
 * ********************************* */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .isEmail().withMessage("A valid email is required.")
      .bail()
      .normalizeEmail(),
    body("account_password")
      .trim()
      .notEmpty().withMessage("Password is required."),
  ]
}

/* ******************************
 * Check login data and return errors or continue
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    return res.render("account/login", {
      errors,
      title: "Login",
      nav,
      account_email, // stickiness para email en login
    })
  }
  next()
}

module.exports = validate
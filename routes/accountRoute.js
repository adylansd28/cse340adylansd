// routes/accountRoute.js
const express = require("express")
const router = new express.Router()
const utilities = require("../utilities/")
const accountController = require("../controllers/accountController")

router.get("/login", utilities.handleErrors(accountController.buildLogin))

router.get("/register", utilities.handleErrors(accountController.buildRegister))

// POST /account/register → procesa el registro
router.post("/register", utilities.handleErrors(accountController.registerAccount))


module.exports = router
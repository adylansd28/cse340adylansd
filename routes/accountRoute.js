// routes/accountRoute.js
const express = require("express")
const router = new express.Router()
const utilities = require("../utilities/")
const accountController = require("../controllers/accountController")

// GET /account/login  → entrega la vista de login
router.get("/login", utilities.handleErrors(accountController.buildLogin))

module.exports = router
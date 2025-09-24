// routes/inventoryRoute.js

// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require("../utilities/inv-validation")

/* ***************************
 * Inventory by classification
 * ************************* */
router.get(
  "/type/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
)

/* ***************************
 * Inventory detail by inv_id
 * ************************* */
router.get(
  "/detail/:inv_id",
  utilities.handleErrors(invController.buildByInvId)
)

/* ***************************
 * Management view
 * ************************* */
router.get(
  "/",
  utilities.handleErrors(invController.buildManagement)
)

/* ***************************
 * Add Classification (GET form)
 * ************************* */
router.get(
  "/add-classification",
  utilities.handleErrors(invController.buildAddClassification)
)

/* ***************************
 * Add Classification (POST submit)
 * ************************* */
router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  utilities.handleErrors(invController.registerClassification)
)

/* ***************************
 * Add Inventory (GET form)
 * ************************* */
router.get(
  "/add-inventory",
  utilities.handleErrors(invController.buildAddInventory)
)

/* ***************************
 * Add Inventory (POST submit)
 * ************************* */
router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.registerInventory)
)

module.exports = router
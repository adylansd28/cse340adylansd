// routes/inventoryRoute.js

// Needed Resources
const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require("../utilities/inv-validation")

/* ---------------------------------------
 * Home (alias) → Management
 *  /inv  y  /inv/management  muestran lo mismo
 * ------------------------------------- */
router.get(
  "/",
  utilities.handleErrors(invController.buildManagement)
)
router.get(
  "/management",
  utilities.handleErrors(invController.buildManagement)
)

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

/* ***************************
 * AJAX: inventory list by classification (JSON)
 * ************************* */
router.get(
  "/getInventory/:classification_id",
  utilities.handleErrors(invController.getInventoryJSON)
)

/* ***************************
 * Edit inventory view
 * ************************* */
router.get(
  "/edit/:inv_id",
  utilities.handleErrors(
    invController.buildEditInventory // nombre canónico
  )
)

/* ***************************
 * Update inventory (POST action)
 * ************************* */
router.post(
  "/update",
  invValidate.newInventoryRules(),
  invValidate.checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
)

/* ***************************
 * Delete inventory (Confirm view)
 * ************************* */
router.get(
  "/delete/:inv_id",
  utilities.handleErrors(invController.buildDeleteConfirm)
)

/* ***************************
 * Delete inventory (POST action)
 * ************************* */
router.post(
  "/delete",
  utilities.handleErrors(invController.deleteInventory)
)

module.exports = router
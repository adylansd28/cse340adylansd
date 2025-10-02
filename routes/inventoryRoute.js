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
 *  Ambas protegidas para evitar bypass
 * ------------------------------------- */
router.get(
  "/",
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildManagement)
)

router.get(
  "/management",
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildManagement)
)

/* ***************************
 * Inventory by classification (pública)
 * ************************* */
router.get(
  "/type/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
)

/* ***************************
 * Inventory detail by inv_id (pública)
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
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildAddClassification)
)

/* ***************************
 * Add Classification (POST submit)
 * ************************* */
router.post(
  "/add-classification",
  utilities.requireEmployeeOrAdmin,
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
)

/* ***************************
 * Add Inventory (GET form)
 * ************************* */
router.get(
  "/add-inventory",
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildAddInventory)
)

/* ***************************
 * Add Inventory (POST submit)
 * ************************* */
router.post(
  "/add-inventory",
  utilities.requireEmployeeOrAdmin,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
)

/* ***************************
 * AJAX: inventory list by classification (JSON)
 * (normalmente pública para poblar selects en formularios)
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
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildEditInventory)
)

/* ***************************
 * Update inventory (POST action)
 * ************************* */
router.post(
  "/update",
  utilities.requireEmployeeOrAdmin,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.updateInventory)
)

/* ***************************
 * Delete inventory (Confirm view)
 * ************************* */
router.get(
  "/delete/:inv_id",
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.buildDeleteConfirm)
)

/* ***************************
 * Delete inventory (POST action)
 * ************************* */
router.post(
  "/delete",
  utilities.requireEmployeeOrAdmin,
  utilities.handleErrors(invController.deleteInventory)
)

module.exports = router

// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = utilities.buildClassificationGrid(data)
  const nav = await utilities.getNav()

  const className = data?.[0]?.classification_name || "Vehicle"
  res.render("./inventory/classification", {
    title: `${className} vehicles`,
    nav,
    grid,
  })
}

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildByInvId = async function (req, res) {
  const inv_id = parseInt(req.params.inv_id, 10)
  const vehicleRaw = await invModel.getVehicleById(inv_id)
  const nav = await utilities.getNav()

  const vehicle = Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw

  if (!vehicle) {
    return res.status(404).render("errors/404", {
      title: "404 Not Found",
      nav,
      message: "Vehicle not found.",
    })
  }

  const detail = utilities.buildVehicleDetailHTML(vehicle)
  const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`

  res.render("./inventory/detail", {
    title,
    nav,
    detail,
  })
}

/* ***************************
 *  Management (landing)
 * ************************** */
invCont.buildManagement = async function (req, res) {
  const nav = await utilities.getNav()
  res.render("inventory/management", {
    title: "Inventory Management",
    nav,
    errors: null,
  })
}

/* ***************************
 *  Add Classification (GET)
 * ************************** */
invCont.buildAddClassification = async function (req, res) {
  const nav = await utilities.getNav()
  res.render("inventory/add-classification", {
    title: "Add Classification",
    nav,
    errors: null,
    // stickiness (no afecta si es la 1ra carga)
    classification_name: req.body?.classification_name || "",
  })
}

/* ***************************
 *  Add Classification (POST)
 * ************************** */
invCont.registerClassification = async function (req, res) {
  const nav = await utilities.getNav()
  const { classification_name } = req.body

  const regResult = await invModel.addClassification(classification_name)
  if (regResult && regResult.rowCount > 0) {
    req.flash("notice", "Classification added successfully.")
    const nav2 = await utilities.getNav()
    return res.status(201).render("inventory/management", {
      title: "Inventory Management",
      nav: nav2,
      errors: null,
    })
  }

  req.flash("notice", "Classification add failed.")
  return res.status(501).render("inventory/add-classification", {
    title: "Add Classification",
    nav,
    errors: null, // validaciones ya corrieron antes
    classification_name,
  })
}

/* ***************************
 *  Add Inventory (GET)
 * ************************** */
invCont.buildAddInventory = async function (req, res) {
  const nav = await utilities.getNav()
  const classificationList = await utilities.buildClassificationList()
  res.render("inventory/add-inventory", {
    title: "Add Inventory",
    nav,
    classificationList,
    errors: null,
    // stickiness defaults
    inv_make: "",
    inv_model: "",
    inv_description: "",
    inv_image: "/images/vehicles/no-image.png",
    inv_thumbnail: "/images/vehicles/no-image-tn.png",
    inv_price: "",
    inv_year: "",
    inv_miles: "",
    inv_color: "",
    classification_id: "",
  })
}

/* ***************************
 *  Add Inventory (POST)
 * ************************** */
invCont.registerInventory = async function (req, res) {
  const nav = await utilities.getNav()
  const {
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body

  const regResult = await invModel.addInventory(
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id
  )

  if (regResult && regResult.rowCount > 0) {
    req.flash("notice", "Inventory item added successfully.")
    const nav2 = await utilities.getNav()
    return res.status(201).render("inventory/management", {
      title: "Inventory Management",
      nav: nav2,
      errors: null,
    })
  }

  req.flash("notice", "Inventory item failed.")
  const classificationList = await utilities.buildClassificationList(classification_id)
  return res.status(501).render("inventory/add-inventory", {
    title: "Add Inventory",
    nav,
    classificationList,
    errors: null, // inv-validation ya ejecutó
    // stickiness
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  })
}

module.exports = invCont

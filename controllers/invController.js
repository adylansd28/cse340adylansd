// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    const grid = utilities.buildClassificationGrid(data)
    const nav = await utilities.getNav(req)

    const firstRow = Array.isArray(data) ? data[0] : data?.rows?.[0]
    const className = firstRow?.classification_name || "Vehicle"

    res.render("inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildByInvId = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    const nav = await utilities.getNav(req)

    const vehicleRaw = await invModel.getVehicleById(inv_id)
    const vehicle =
      vehicleRaw?.rows?.[0] ?? (Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw)

    if (!vehicle) {
      return res.status(404).render("errors/404", {
        title: "404 Not Found",
        nav,
        message: "Vehicle not found.",
      })
    }

    const detail = utilities.buildVehicleDetailHTML(vehicle)
    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    res.render("inventory/detail", { title, nav, detail })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Management (landing)
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
    const classificationSelect = await utilities.buildClassificationList()
    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      classificationSelect,
      errors: null,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Add Classification (GET)
 * ************************** */
invCont.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
      classification_name: req.body?.classification_name || "",
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Add Classification (POST)
 * ************************** */
invCont.registerClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
    const { classification_name } = req.body

    const regResult = await invModel.addClassification(classification_name)
    if (regResult && regResult.rowCount > 0) {
      req.flash("notice", "Classification added successfully.")
      return res.redirect("/inv/management")
    }

    req.flash("notice", "Classification add failed.")
    return res.status(501).render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
      classification_name,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Add Inventory (GET)
 * ************************** */
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
    const classificationList = await utilities.buildClassificationList()
    res.render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      classificationList,
      errors: null,
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
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Add Inventory (POST)
 * ************************** */
invCont.registerInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
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
      return res.redirect("/inv/management")
    }

    req.flash("notice", "Inventory item failed.")
    const classificationList = await utilities.buildClassificationList(classification_id)
    return res.status(501).render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      classificationList,
      errors: null,
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
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Edit Inventory (GET)
 * ************************** */
invCont.buildEditInventory = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    const nav = await utilities.getNav(req)

    const raw = await invModel.getVehicleById(inv_id)
    const itemData = raw?.rows?.[0] ?? (Array.isArray(raw) ? raw[0] : raw)

    if (!itemData) {
      req.flash("notice", "Vehicle not found.")
      return res.redirect("/inv/management")
    }

    const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`

    return res.render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect,
      errors: null,
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_description: itemData.inv_description,
      inv_image: itemData.inv_image,
      inv_thumbnail: itemData.inv_thumbnail,
      inv_price: itemData.inv_price,
      inv_miles: itemData.inv_miles,
      inv_color: itemData.inv_color,
      classification_id: itemData.classification_id,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Update Inventory (POST)
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav(req)
    const {
      inv_id,
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

    const result = await invModel.updateInventory(
      inv_id,
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

    if (result && (result.rowCount > 0 || result.inv_id)) {
      req.flash("notice", "Inventory item updated successfully.")
      return res.redirect("/inv/management")
    }

    req.flash("notice", "Update failed. Please correct and try again.")
    const classificationSelect = await utilities.buildClassificationList(classification_id)
    const itemName = [inv_make, inv_model].filter(Boolean).join(" ") || "Vehicle"

    return res.status(400).render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect,
      errors: null,
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Delete Inventory (GET) - confirm
 * ************************** */
/* ***************************
 *  Delete Inventory (GET) - confirm
 * ************************** */
invCont.buildDeleteConfirm = async function (req, res, next) {
  try {

    
    const inv_id = parseInt(req.params.inv_id, 10)
    const nav = await utilities.getNav(req)
    console.log("GET /inv/delete/:inv_id", req.params)
    console.log("parsed inv_id =", inv_id)

    // Trae el vehículo y normaliza el resultado a un objeto único
    const q = await invModel.getVehicleById(inv_id)
    const item =
      (Array.isArray(q) && q[0]) ||
      (q && Array.isArray(q.rows) && q.rows[0]) ||
      q || null

    console.log("vehicle =", q)

    if (!item) {
      req.flash("notice", "Vehicle not found.")
      return res.redirect("/inv/management")
    }

    const itemName = `${item.inv_make} ${item.inv_model}`

    return res.render("inventory/delete-confirm", {
      title: "Delete " + itemName,
      nav,
      errors: null,
      inv_id: item.inv_id,
      inv_make: item.inv_make,
      inv_model: item.inv_model,
      inv_year: item.inv_year,
      inv_price: item.inv_price,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Delete Inventory (POST)
 * ************************** */
invCont.deleteInventory = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.body.inv_id, 10)
    // en deleteInventory
    console.log("POST /inv/delete body:", req.body)
    console.log("parsed inv_id =", inv_id)

    console.log("POST /inv/delete body:", req.body)
    console.log("parsed inv_id =", inv_id)


    if (!inv_id || Number.isNaN(inv_id)) {
      req.flash("notice", "Invalid request.")
      return res.redirect("/inv/management")
    }

    const delResult = await invModel.deleteInventoryItem(inv_id)
    const affected = delResult?.rowCount ?? 0

    if (affected > 0) {
      req.flash("notice", "Inventory item deleted successfully.")
      return res.redirect("/inv/management")
    }

    req.flash("notice", "Delete failed. Please try again.")
    return res.redirect(`/inv/delete/${inv_id}`)
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Return Inventory as JSON (AJAX)
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  try {
    const classification_id = parseInt(req.params.classification_id, 10)
    const invData = await invModel.getInventoryByClassificationId(classification_id)
    const rows = invData?.rows ?? invData ?? []
    return res.json(Array.isArray(rows) ? rows : [])
  } catch (err) {
    next(err)
  }
}

module.exports = invCont

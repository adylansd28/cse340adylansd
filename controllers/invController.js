// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
// controllers/invController.js
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = Number.parseInt(req.params.classificationId, 10)
    if (!Number.isFinite(classification_id)) {
      const nav = await utilities.getNav(req)
      req.flash("notice", "Invalid classification.")
      return res.status(400).render("inventory/classification", {
        title: "Vehicles",
        nav,
        grid: "<p class='notice'>Invalid classification.</p>",
      })
    }

    const items = await invModel.getInventoryByClassificationId(classification_id) // array
    const nav = await utilities.getNav(req)
    const grid = utilities.buildClassificationGrid(items)

    let className
    if (items.length > 0) {
      className = items[0].classification_name
    } else {
      const cls = await invModel.getClassificationById(classification_id)
      className = cls?.classification_name || "Vehicles"
    }

    return res.render("inventory/classification", {
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
    const inv_id = Number.parseInt(req.params.inv_id, 10)
    if (!Number.isFinite(inv_id)) {
      const nav = await utilities.getNav(req)
      return res.status(404).render("errors/404", {
        title: "404 Not Found",
        nav,
        message: "Vehicle not found.",
      })
    }

    const nav = await utilities.getNav(req)
    const vehicle = await invModel.getVehicleById(inv_id) // => obj|null

    if (!vehicle) {
      return res.status(404).render("errors/404", {
        title: "404 Not Found",
        nav,
        message: "Vehicle not found.",
      })
    }

    const detail = utilities.buildVehicleDetailHTML(vehicle)
    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    return res.render("inventory/detail", { title, nav, detail })
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
    return res.render("inventory/management", {
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
    return res.render("inventory/add-classification", {
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

    const created = await invModel.addClassification(classification_name) // => obj
    if (created?.classification_id) {
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
    return res.render("inventory/add-inventory", {
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

    const created = await invModel.addInventory(
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
    ) // => obj

    if (created?.inv_id) {
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
    const inv_id = Number.parseInt(req.params.inv_id, 10)
    if (!Number.isFinite(inv_id)) {
      req.flash("notice", "Invalid vehicle id.")
      return res.redirect("/inv/management")
    }

    const nav = await utilities.getNav(req)
    const itemData = await invModel.getVehicleById(inv_id) // => obj|null

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

    const updated = await invModel.updateInventory(
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
    ) // => obj|null

    if (updated?.inv_id) {
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
invCont.buildDeleteConfirm = async function (req, res, next) {
  try {
    const inv_id = Number.parseInt(req.params.inv_id, 10)
    if (!Number.isFinite(inv_id)) {
      req.flash("notice", "Invalid vehicle id.")
      return res.redirect("/inv/management")
    }

    const nav = await utilities.getNav(req)
    const item = await invModel.getVehicleById(inv_id) // => obj|null

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
    const inv_id = Number.parseInt(req.body.inv_id, 10)
    if (!Number.isFinite(inv_id)) {
      req.flash("notice", "Invalid request.")
      return res.redirect("/inv/management")
    }

    const deleted = await invModel.deleteInventoryItem(inv_id) // => obj|null
    if (deleted?.inv_id) {
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
    const classification_id = Number.parseInt(req.params.classification_id, 10)
    if (!Number.isFinite(classification_id)) {
      return res.json([])
    }
    const items = await invModel.getInventoryByClassificationId(classification_id) // => array
    return res.json(Array.isArray(items) ? items : [])
  } catch (err) {
    next(err)
  }
}

module.exports = invCont

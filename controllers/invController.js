const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = utilities.buildClassificationGrid(data)
  const nav = await utilities.getNav(req)

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
invCont.buildByInvId = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id, 10)
  const vehicle = await invModel.getVehicleById(inv_id)
  const nav = await utilities.getNav(req)

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

module.exports = invCont
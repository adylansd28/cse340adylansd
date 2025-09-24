const utilities = require(".")
const { body, validationResult } = require("express-validator")
const invValidate = {}

/* ---------- Reglas: Classification ---------- */
invValidate.classificationRules = () => [
  body("classification_name")
    .trim().escape()
    .notEmpty().withMessage("Classification name is required.")
    .matches(/^[A-Za-z]+$/).withMessage("Only letters allowed, no spaces."),
]

invValidate.checkClassificationData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    return res.status(400).render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors,
      classification_name: req.body.classification_name,
    })
  }
  next()
}

/* ---------- Reglas: Inventory ---------- */
invValidate.inventoryRules = () => [
  body("inv_make")
    .trim().escape()
    .notEmpty().withMessage("Make is required.")
    .matches(/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,}$/).withMessage("Invalid make."),
  body("inv_model")
    .trim().escape()
    .notEmpty().withMessage("Model is required.")
    .matches(/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,}$/).withMessage("Invalid model."),
  body("classification_id")
    .notEmpty().withMessage("Classification is required.")
    .isInt({ min: 1 }).withMessage("Invalid classification."),
  body("inv_description")
    .trim()
    .notEmpty().withMessage("Description is required.")
    .isLength({ min: 10 }).withMessage("Description must be at least 10 characters."),
  body("inv_image")
    .trim()
    .notEmpty().withMessage("Image path is required.")
    .matches(/^\/images\/vehicles\/.+|^https?:\/\/.+/).withMessage("Provide a valid image path or URL."),
  body("inv_thumbnail")
    .trim()
    .notEmpty().withMessage("Thumbnail path is required.")
    .matches(/^\/images\/vehicles\/.+|^https?:\/\/.+/).withMessage("Provide a valid thumbnail path or URL."),
  body("inv_price")
    .notEmpty().withMessage("Price is required.")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("inv_year")
    .notEmpty().withMessage("Year is required.")
    .isInt({ min: 1886, max: new Date().getFullYear() + 1 })
    .withMessage("Year out of range."),
  body("inv_miles")
    .notEmpty().withMessage("Miles is required.")
    .isInt({ min: 0 }).withMessage("Miles must be a non-negative integer."),
  body("inv_color")
    .trim().escape()
    .notEmpty().withMessage("Color is required.")
    .matches(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/).withMessage("Color must be alphabetic."),
]

invValidate.checkInventoryData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList(req.body.classification_id)
    return res.status(400).render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      classificationList,
      errors,
      // stickiness
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_year: req.body.inv_year,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
    })
  }
  next()
}

module.exports = invValidate

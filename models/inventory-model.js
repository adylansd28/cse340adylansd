// models/inventory-model.js
const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  const sql = `
    SELECT *
    FROM public.classification
    ORDER BY classification_name
  `
  return pool.query(sql)
}

/* ********************************************
 *  Get all inventory items by classification_id
 * ******************************************* */
async function getInventoryByClassificationId(classification_id) {
  const sql = `
    SELECT i.*, c.classification_name
    FROM public.inventory AS i
    JOIN public.classification AS c
      ON i.classification_id = c.classification_id
    WHERE i.classification_id = $1
    ORDER BY i.inv_make, i.inv_model
  `
  return pool.query(sql, [classification_id])
}

/* ***************************
 *  Get a single vehicle by inv_id
 * ************************** */
async function getVehicleById(inv_id) {
  const sql = `
    SELECT i.*, c.classification_name
    FROM public.inventory AS i
    JOIN public.classification AS c
      ON i.classification_id = c.classification_id
    WHERE i.inv_id = $1
  `
  return pool.query(sql, [inv_id])
}

/* ***************************
 *  Add a new classification
 * ************************** */
async function addClassification(classification_name) {
  const sql = `
    INSERT INTO public.classification (classification_name)
    VALUES ($1)
    RETURNING *
  `
  return pool.query(sql, [classification_name])
}

/* ***************************
 *  Add a new inventory item
 * ************************** */
async function addInventory(
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
) {
  const sql = `
    INSERT INTO public.inventory 
      (inv_make, inv_model, inv_description, inv_image, inv_thumbnail,
       inv_price, inv_year, inv_miles, inv_color, classification_id)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `
  return pool.query(sql, [
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
  ])
}

/* ***************************
 *  Update an inventory item by inv_id
 * ************************** */
async function updateInventory(
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
) {
  const sql = `
    UPDATE public.inventory
    SET
      inv_make = $1,
      inv_model = $2,
      inv_description = $3,
      inv_image = $4,
      inv_thumbnail = $5,
      inv_price = $6,
      inv_year = $7,
      inv_miles = $8,
      inv_color = $9,
      classification_id = $10
    WHERE inv_id = $11
    RETURNING *
  `
  return pool.query(sql, [
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
    inv_id,
  ])
}

/* ***************************
 *  Delete an inventory item by inv_id
 * ************************** */
async function deleteInventoryItem(inv_id) {
  const sql = `
    DELETE FROM public.inventory
    WHERE inv_id = $1
    RETURNING *
  `
  return pool.query(sql, [inv_id])
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventoryItem,
}
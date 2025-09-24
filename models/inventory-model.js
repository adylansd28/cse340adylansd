// models/inventory-model.js
const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  return await pool.query(
    "SELECT * FROM public.classification ORDER BY classification_name" 
  )
}

/* ********************************************
 *  Get all inventory items by classification_id
 * ******************************************* */
async function getInventoryByClassificationId(classification_id) {
  const sql = `
    SELECT * 
    FROM public.inventory AS i 
    JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
    WHERE i.classification_id = $1
    ORDER BY i.inv_make, i.inv_model
  `
  const data = await pool.query(sql, [classification_id])
  return data.rows
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
  const data = await pool.query(sql, [inv_id])
  return data.rows[0] // devuelve un solo vehículo
}

/* ***************************
 *  Add a new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = `
      INSERT INTO public.classification (classification_name)
      VALUES ($1)
      RETURNING *
    `
    return await pool.query(sql, [classification_name])
  } catch (error) {
    return error.message
  }
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
  try {
    const sql = `
      INSERT INTO public.inventory 
        (inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `
    return await pool.query(sql, [
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
  } catch (error) {
    return error.message
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventory,
}

// models/inventory-model.js
const pool = require("../database/")

/* ***************************
 *  Get all classification data (array)
 * ************************** */
async function getClassifications() {
  const sql = `
    SELECT *
    FROM public.classification
    ORDER BY classification_name
  `
  try {
    const { rows } = await pool.query(sql)
    return rows
  } catch (err) {
    err.message = `getClassifications failed: ${err.message}`
    throw err
  }
}

/* ********************************************
 *  Get all inventory items by classification_id (array)
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
  try {
    const { rows } = await pool.query(sql, [classification_id])
    return rows
  } catch (err) {
    err.message = `getInventoryByClassificationId failed (id=${classification_id}): ${err.message}`
    throw err
  }
}

/* ***************************
 *  Get a single vehicle by inv_id (obj|null)
 * ************************** */
async function getVehicleById(inv_id) {
  const sql = `
    SELECT i.*, c.classification_name
    FROM public.inventory AS i
    JOIN public.classification AS c
      ON i.classification_id = c.classification_id
    WHERE i.inv_id = $1
    LIMIT 1
  `
  try {
    const { rows } = await pool.query(sql, [inv_id])
    return rows[0] || null
  } catch (err) {
    err.message = `getVehicleById failed (id=${inv_id}): ${err.message}`
    throw err
  }
}

/* ***************************
 *  Add a new classification (obj)
 * ************************** */
async function addClassification(classification_name) {
  const sql = `
    INSERT INTO public.classification (classification_name)
    VALUES ($1)
    RETURNING *
  `
  try {
    const { rows } = await pool.query(sql, [classification_name])
    return rows[0]
  } catch (err) {
    err.message = `addClassification failed (name=${classification_name}): ${err.message}`
    throw err
  }
}

/* ***************************
 *  Add a new inventory item (obj)
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
  try {
    const { rows } = await pool.query(sql, [
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
    return rows[0]
  } catch (err) {
    err.message = `addInventory failed (model=${inv_model}): ${err.message}`
    throw err
  }
}

/* ***************************
 *  Update an inventory item by inv_id (obj|null si no existe)
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
  try {
    const { rows } = await pool.query(sql, [
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
    return rows[0] || null
  } catch (err) {
    err.message = `updateInventory failed (id=${inv_id}): ${err.message}`
    throw err
  }
}

/* ***************************
 *  Delete an inventory item by inv_id (obj|null si no existe)
 * ************************** */
async function deleteInventoryItem(inv_id) {
  const sql = `
    DELETE FROM public.inventory
    WHERE inv_id = $1
    RETURNING *
  `
  try {
    const { rows } = await pool.query(sql, [inv_id])
    return rows[0] || null
  } catch (err) {
    err.message = `deleteInventoryItem failed (id=${inv_id}): ${err.message}`
    throw err
  }
}

async function getClassificationById(classification_id) {
  const sql = `
    SELECT classification_id, classification_name
    FROM public.classification
    WHERE classification_id = $1
    LIMIT 1
  `
  const { rows } = await pool.query(sql, [classification_id])
  return rows[0] || null
}

module.exports = {
  getClassifications,               // => array
  getInventoryByClassificationId,   // => array
  getVehicleById,                   // => obj|null
  addClassification,                // => obj
  addInventory,                     // => obj
  updateInventory,                  // => obj|null
  deleteInventoryItem,              // => obj|null
  getClassificationById,
}
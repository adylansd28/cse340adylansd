const pool = require("../database/")

/* Get all classification data */
async function getClassifications() {
  return await pool.query(
    "SELECT * FROM public.classification ORDER BY classification_name"
  )
}

/* Get all inventory items and classification_name by classification_id */
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

/* Get a single vehicle by inv_id */
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

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById
}

// models/account-model.js
const pool = require("../database/")

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  const sql = `
    INSERT INTO account 
      (account_firstname, account_lastname, account_email, account_password, account_type) 
    VALUES ($1, $2, $3, $4, 'Client') 
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type`
  const result = await pool.query(sql, [
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  ])
  return result // en controller usas rowCount y/o rows[0]
}

/* **********************
 *   Check for existing email
 *   Devuelve boolean (true si existe)
 * ********************* */
async function checkExistingEmail(account_email) {
  const sql = "SELECT 1 FROM account WHERE account_email = $1 LIMIT 1"
  const result = await pool.query(sql, [account_email])
  return result.rowCount > 0
}

/* **********************
 *   Get account by email (para login)
 *   Devuelve una fila o null
 * ********************* */
async function getAccountByEmail(account_email) {
  const sql = `SELECT 
       account_id,
       account_firstname,
       account_lastname,
       account_email,
       account_type,
       account_password
     FROM account
     WHERE account_email = $1`
  const result = await pool.query(sql, [account_email])
  return result.rows[0] || null
}

/* **********************
 *   (Opcional) Get account by id (para /profile, etc.)
 * ********************* */
async function getAccountById(account_id) {
  const sql = `
    SELECT 
      account_id,
      account_email,
      account_firstname,
      account_lastname,
      account_type
    FROM account
    WHERE account_id = $1
    LIMIT 1`
  const result = await pool.query(sql, [account_id])
  return result.rows[0] || null
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
}
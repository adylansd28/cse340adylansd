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
 * ********************* */
async function checkExistingEmail(account_email) {
  const sql = "SELECT 1 FROM account WHERE account_email = $1 LIMIT 1"
  const result = await pool.query(sql, [account_email])
  return result.rowCount > 0
}

/* **********************
 *   Get account by email (para login)
 * ********************* */
async function getAccountByEmail(account_email) {
  const sql = `
    SELECT 
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
 *   Get account by id (para update y profile)
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

/* **********************
 *   Update account info (firstname, lastname, email)
 * ********************* */
async function updateAccountInfo(account_id, account_firstname, account_lastname, account_email) {
  const sql = `
    UPDATE account
    SET 
      account_firstname = $2,
      account_lastname = $3,
      account_email = $4
    WHERE account_id = $1
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type`
  const result = await pool.query(sql, [
    account_id,
    account_firstname,
    account_lastname,
    account_email,
  ])
  return result
}

/* **********************
 *   Update account password
 * ********************* */
async function updatePassword(account_id, hashedPassword) {
  const sql = `
    UPDATE account
    SET account_password = $2
    WHERE account_id = $1
    RETURNING account_id`
  const result = await pool.query(sql, [account_id, hashedPassword])
  return result
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccountInfo,
  updatePassword,
}
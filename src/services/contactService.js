const pool = require("../db/db");

/**
 * Find all contacts matching the given email or phoneNumber.
 */
const findMatchingContacts = async (email, phoneNumber) => {
    const result = await pool.query(
        `SELECT * FROM contacts
     WHERE email = $1 OR "phonenumber" = $2`,
        [email || null, phoneNumber || null]
    );
    return result.rows;
};

/**
 * Create a new primary contact.
 */
const createPrimaryContact = async (email, phoneNumber) => {
    const result = await pool.query(
        `INSERT INTO contacts (email, "phonenumber", "linkedid", "linkprecedence")
     VALUES ($1, $2, NULL, 'primary')
     RETURNING *`,
        [email || null, phoneNumber || null]
    );
    return result.rows[0];
};

module.exports = { findMatchingContacts, createPrimaryContact };

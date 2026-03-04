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

/**
 * Create a new secondary contact linked to a primary contact.
 */
const createSecondaryContact = async (email, phoneNumber, primaryId) => {
    const result = await pool.query(
        `INSERT INTO contacts (email, "phonenumber", "linkedid", "linkprecedence")
     VALUES ($1, $2, $3, 'secondary')
     RETURNING *`,
        [email || null, phoneNumber || null, primaryId]
    );
    return result.rows[0];
};

/**
 * Fetch all contacts belonging to a primary contact group
 * (primary itself + all its secondaries).
 */
const fetchContactGroup = async (primaryId) => {
    const result = await pool.query(
        `SELECT * FROM contacts
     WHERE id = $1 OR "linkedid" = $1
     ORDER BY "createdat" ASC`,
        [primaryId]
    );
    return result.rows;
};

/**
 * Demote a primary contact to secondary, linking it under the true primary.
 * Also re-parents all its existing secondaries to the true primary.
 */
const demotePrimaryToSecondary = async (demotedId, truePrimaryId) => {
    // Demote the contact itself
    await pool.query(
        `UPDATE contacts
     SET "linkprecedence" = 'secondary',
         "linkedid"       = $1,
         "updatedat"      = NOW()
     WHERE id = $2`,
        [truePrimaryId, demotedId]
    );

    // Re-parent any secondaries that were linked to the demoted primary
    await pool.query(
        `UPDATE contacts
     SET "linkedid"  = $1,
         "updatedat" = NOW()
     WHERE "linkedid" = $2`,
        [truePrimaryId, demotedId]
    );
};

module.exports = {
    findMatchingContacts,
    createPrimaryContact,
    createSecondaryContact,
    fetchContactGroup,
    demotePrimaryToSecondary,
};

const pool = require("../db/db");

/**
 * Creates the contacts table if it does not already exist.
 */
const createContactsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS contacts (
      id           SERIAL PRIMARY KEY,
      phoneNumber  VARCHAR(20),
      email        VARCHAR(255),
      linkedId     INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      linkPrecedence VARCHAR(10) CHECK (linkPrecedence IN ('primary', 'secondary')),
      createdAt    TIMESTAMP NOT NULL DEFAULT NOW(),
      updatedAt    TIMESTAMP NOT NULL DEFAULT NOW(),
      deletedAt    TIMESTAMP
    );
  `;

    try {
        await pool.query(query);
        console.log("contacts table is ready");
    } catch (err) {
        console.error("Error creating contacts table:", err.message);
        throw err;
    }
};

module.exports = { createContactsTable };

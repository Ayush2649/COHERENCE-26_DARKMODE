/**
 * Lead Model (MVC: Model Layer)
 * 
 * Represents a contact/lead for outreach campaigns.
 * 
 * Fields:
 *   id          - Unique identifier (UUID)
 *   name        - Full name of the contact
 *   email       - Email address (unique)
 *   company     - Company/organization name
 *   role        - Job title/role
 *   status      - Lead status: 'new', 'contacted', 'replied', 'converted', 'unsubscribed'
 *   currentStep - Current workflow step the lead is on
 *   createdAt   - Timestamp of creation
 *   updatedAt   - Timestamp of last update
 * 
 * Usage:
 *   Lead is the core entity — leads are uploaded via CSV,
 *   then flow through workflows during campaign execution.
 */
const db = require("../database");
const { v4: uuidv4 } = require("uuid");

const Lead = {
  /**
   * Create a single lead
   * @param {Object} data - { name, email, company, role }
   * @returns {Object} The created lead
   */
  create(data) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO leads (id, name, email, company, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.name, data.email, data.company || "", data.role || "");
    return Lead.findById(id);
  },

  /**
   * Bulk create leads (used for CSV import)
   * Uses a transaction for atomicity and performance
   * @param {Array} leads - Array of { name, email, company, role }
   * @returns {number} Number of leads inserted
   */
  bulkCreate(leads) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO leads (id, name, email, company, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      let count = 0;
      for (const lead of items) {
        const result = stmt.run(
          uuidv4(),
          lead.name,
          lead.email,
          lead.company || "",
          lead.role || ""
        );
        if (result.changes > 0) count++;
      }
      return count;
    });

    return insertMany(leads);
  },

  /**
   * Find a lead by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  findById(id) {
    return db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  },

  /**
   * Get all leads, optionally filtered by status
   * @param {string} [status] - Optional status filter
   * @returns {Array}
   */
  findAll(status) {
    if (status) {
      return db
        .prepare("SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC")
        .all(status);
    }
    return db.prepare("SELECT * FROM leads ORDER BY createdAt DESC").all();
  },

  /**
   * Update a lead's fields
   * @param {string} id
   * @param {Object} data - Fields to update
   * @returns {Object} Updated lead
   */
  update(id, data) {
    const fields = [];
    const values = [];

    /* Dynamically build SET clause from provided fields */
    for (const [key, value] of Object.entries(data)) {
      if (["name", "email", "company", "role", "status", "currentStep"].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return Lead.findById(id);

    fields.push("updatedAt = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values
    );
    return Lead.findById(id);
  },

  /**
   * Delete a lead by ID
   * @param {string} id
   * @returns {boolean} Whether the lead was deleted
   */
  delete(id) {
    const result = db.prepare("DELETE FROM leads WHERE id = ?").run(id);
    return result.changes > 0;
  },

  /**
   * Count leads, optionally by status
   * @param {string} [status]
   * @returns {number}
   */
  count(status) {
    if (status) {
      return db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = ?").get(status).count;
    }
    return db.prepare("SELECT COUNT(*) as count FROM leads").get().count;
  },
};

module.exports = Lead;

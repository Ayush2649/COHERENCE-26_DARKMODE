/**
 * Campaign Model (MVC: Model Layer)
 * 
 * Represents a campaign that executes a workflow against leads.
 * 
 * Fields:
 *   id         - Unique identifier (UUID)
 *   workflowId - Reference to the workflow being executed
 *   name       - Campaign name
 *   status     - Campaign state: 'draft', 'running', 'paused', 'completed', 'failed'
 *   startTime  - When the campaign was started
 *   endTime    - When the campaign finished
 *   createdAt  - Timestamp of creation
 *   updatedAt  - Timestamp of last update
 * 
 * Usage:
 *   A campaign links a workflow to a set of leads.
 *   When started, the campaign engine processes leads
 *   through each workflow step (send email, wait, condition, etc.)
 */
const db = require("../database");
const { v4: uuidv4 } = require("uuid");

const Campaign = {
  /**
   * Create a new campaign
   * @param {Object} data - { workflowId, name }
   * @returns {Object} The created campaign
   */
  create(data) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO campaigns (id, workflowId, name, status)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, data.workflowId, data.name || "Untitled Campaign", data.status || "draft");
    return Campaign.findById(id);
  },

  /**
   * Find a campaign by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  findById(id) {
    return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
  },

  /**
   * Get all campaigns, optionally filtered by status
   * @param {string} [status]
   * @returns {Array}
   */
  findAll(status) {
    if (status) {
      return db
        .prepare("SELECT * FROM campaigns WHERE status = ? ORDER BY createdAt DESC")
        .all(status);
    }
    return db.prepare("SELECT * FROM campaigns ORDER BY createdAt DESC").all();
  },

  /**
   * Update campaign fields (name, status, startTime, endTime)
   * @param {string} id
   * @param {Object} data
   * @returns {Object} Updated campaign
   */
  update(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (["name", "status", "startTime", "endTime", "workflowId"].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return Campaign.findById(id);

    fields.push("updatedAt = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE campaigns SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values
    );
    return Campaign.findById(id);
  },

  /**
   * Delete a campaign by ID
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
    return result.changes > 0;
  },

  /**
   * Count campaigns, optionally by status
   * @param {string} [status]
   * @returns {number}
   */
  count(status) {
    if (status) {
      return db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = ?").get(status).count;
    }
    return db.prepare("SELECT COUNT(*) as count FROM campaigns").get().count;
  },
};

module.exports = Campaign;

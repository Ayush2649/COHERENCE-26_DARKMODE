/**
 * Workflow Model (MVC: Model Layer)
 * 
 * Represents a visual automation workflow built in React Flow.
 * 
 * Fields:
 *   id        - Unique identifier (UUID)
 *   name      - Workflow name (e.g., "Cold Outreach Flow")
 *   nodes     - JSON string of React Flow nodes array
 *   edges     - JSON string of React Flow edges array
 *   createdAt - Timestamp of creation
 *   updatedAt - Timestamp of last update
 * 
 * Usage:
 *   Workflows define the automation sequence:
 *   Start → Send Email → Wait → Condition → Follow-up → End
 *   They are created in the visual builder and linked to campaigns.
 */
const db = require("../database");
const { v4: uuidv4 } = require("uuid");

const Workflow = {
  /**
   * Create a new workflow
   * @param {Object} data - { name, nodes, edges }
   * @returns {Object} The created workflow (with parsed JSON)
   */
  create(data) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO workflows (id, name, nodes, edges)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      JSON.stringify(data.nodes || []),
      JSON.stringify(data.edges || [])
    );
    return Workflow.findById(id);
  },

  /**
   * Find a workflow by ID
   * Returns nodes and edges as parsed JSON arrays
   * @param {string} id
   * @returns {Object|undefined}
   */
  findById(id) {
    const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id);
    if (!row) return undefined;
    return {
      ...row,
      nodes: JSON.parse(row.nodes),
      edges: JSON.parse(row.edges),
    };
  },

  /**
   * Get all workflows (nodes/edges parsed)
   * @returns {Array}
   */
  findAll() {
    const rows = db
      .prepare("SELECT * FROM workflows ORDER BY createdAt DESC")
      .all();
    return rows.map((row) => ({
      ...row,
      nodes: JSON.parse(row.nodes),
      edges: JSON.parse(row.edges),
    }));
  },

  /**
   * Update a workflow's name, nodes, or edges
   * @param {string} id
   * @param {Object} data - Fields to update
   * @returns {Object} Updated workflow
   */
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.nodes !== undefined) {
      fields.push("nodes = ?");
      values.push(JSON.stringify(data.nodes));
    }
    if (data.edges !== undefined) {
      fields.push("edges = ?");
      values.push(JSON.stringify(data.edges));
    }

    if (fields.length === 0) return Workflow.findById(id);

    fields.push("updatedAt = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values
    );
    return Workflow.findById(id);
  },

  /**
   * Delete a workflow by ID
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
    return result.changes > 0;
  },

  /**
   * Count total workflows
   * @returns {number}
   */
  count() {
    return db.prepare("SELECT COUNT(*) as count FROM workflows").get().count;
  },
};

module.exports = Workflow;

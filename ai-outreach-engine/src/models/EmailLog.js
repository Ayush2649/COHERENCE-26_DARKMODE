/**
 * EmailLog Model (MVC: Model Layer)
 * 
 * Records every email sent during campaign execution.
 * 
 * Fields:
 *   id         - Unique identifier (UUID)
 *   leadId     - Reference to the lead who received the email
 *   campaignId - Reference to the campaign (optional)
 *   subject    - Email subject line
 *   message    - Email body content
 *   status     - Delivery status: 'pending', 'sent', 'delivered', 'failed', 'bounced'
 *   sentAt     - When the email was actually sent
 *   createdAt  - Timestamp of creation
 * 
 * Usage:
 *   Every email action in a workflow creates an EmailLog entry.
 *   Used by the monitoring dashboard to track:
 *   - Total emails sent
 *   - Delivery success rate
 *   - Follow-up counts
 *   - Campaign progress
 */
const db = require("../database");
const { v4: uuidv4 } = require("uuid");

const EmailLog = {
  /**
   * Create an email log entry
   * @param {Object} data - { leadId, campaignId, subject, message, status }
   * @returns {Object} The created log
   */
  create(data) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO email_logs (id, leadId, campaignId, subject, message, status, sentAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.leadId,
      data.campaignId || null,
      data.subject || "",
      data.message,
      data.status || "pending",
      data.status === "sent" ? new Date().toISOString() : null
    );
    return EmailLog.findById(id);
  },

  /**
   * Find an email log by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  findById(id) {
    return db.prepare("SELECT * FROM email_logs WHERE id = ?").get(id);
  },

  /**
   * Get all logs for a specific lead
   * @param {string} leadId
   * @returns {Array}
   */
  findByLeadId(leadId) {
    return db
      .prepare("SELECT * FROM email_logs WHERE leadId = ? ORDER BY createdAt DESC")
      .all(leadId);
  },

  /**
   * Get all logs for a specific campaign
   * @param {string} campaignId
   * @returns {Array}
   */
  findByCampaignId(campaignId) {
    return db
      .prepare("SELECT * FROM email_logs WHERE campaignId = ? ORDER BY createdAt DESC")
      .all(campaignId);
  },

  /**
   * Get all email logs
   * @param {string} [status] - Optional status filter
   * @returns {Array}
   */
  findAll(status) {
    if (status) {
      return db
        .prepare("SELECT * FROM email_logs WHERE status = ? ORDER BY createdAt DESC")
        .all(status);
    }
    return db.prepare("SELECT * FROM email_logs ORDER BY createdAt DESC").all();
  },

  /**
   * Update email log status (e.g., pending → sent)
   * @param {string} id
   * @param {Object} data - { status, sentAt }
   * @returns {Object} Updated log
   */
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    if (data.sentAt !== undefined) {
      fields.push("sentAt = ?");
      values.push(data.sentAt);
    }

    if (fields.length === 0) return EmailLog.findById(id);

    values.push(id);
    db.prepare(`UPDATE email_logs SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values
    );
    return EmailLog.findById(id);
  },

  /**
   * Count email logs, optionally by status
   * @param {string} [status]
   * @returns {number}
   */
  count(status) {
    if (status) {
      return db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = ?").get(status).count;
    }
    return db.prepare("SELECT COUNT(*) as count FROM email_logs").get().count;
  },

  /**
   * Get campaign statistics (for dashboard)
   * @param {string} [campaignId] - Optional campaign filter
   * @returns {Object} { total, sent, pending, failed, delivered }
   */
  getStats(campaignId) {
    const where = campaignId ? "WHERE campaignId = ?" : "";
    const params = campaignId ? [campaignId] : [];

    const total = db.prepare(`SELECT COUNT(*) as count FROM email_logs ${where}`).get(...params).count;
    const sent = db.prepare(`SELECT COUNT(*) as count FROM email_logs ${where ? where + " AND" : "WHERE"} status = 'sent'`).get(...params).count;
    const pending = db.prepare(`SELECT COUNT(*) as count FROM email_logs ${where ? where + " AND" : "WHERE"} status = 'pending'`).get(...params).count;
    const failed = db.prepare(`SELECT COUNT(*) as count FROM email_logs ${where ? where + " AND" : "WHERE"} status = 'failed'`).get(...params).count;
    const delivered = db.prepare(`SELECT COUNT(*) as count FROM email_logs ${where ? where + " AND" : "WHERE"} status = 'delivered'`).get(...params).count;

    return { total, sent, pending, failed, delivered };
  },
};

module.exports = EmailLog;

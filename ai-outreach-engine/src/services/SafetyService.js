/**
 * Safety Service
 * 
 * Enforces email sending rules:
 * 1. Duplicate Prevention: A lead cannot receive the exact same email 
 *    (by subject) twice in the same campaign.
 * 
 * Throttling and rate-limiting have been removed — the CampaignEngine
 * itself handles pacing by sending one email at a time with a 2-second gap.
 */
const db = require("../database");

class SafetyService {
  /**
   * Evaluates if an email is safe to send right now.
   */
  static checkSafety(leadId, campaignId, subject) {
    // Duplicate Prevention (always enforced)
    const duplicate = db.prepare(`SELECT id FROM email_logs WHERE leadId = ? AND campaignId = ? AND subject = ? LIMIT 1`).get(leadId, campaignId, subject);
    if (duplicate) {
      return { safe: false, reason: "Duplicate prevented" };
    }

    return { safe: true };
  }
}

module.exports = SafetyService;

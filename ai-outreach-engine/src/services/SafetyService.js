/**
 * Safety Service
 * 
 * Enforces email sending rules:
 * 1. Rate limiting: Max 20 emails per hour globally.
 * 2. Throttling: Max 1 email every 30 seconds globally.
 * 3. Duplicate Prevention: A lead cannot receive the exact same email 
 *    (by subject) twice in the same campaign.
 * 
 * DEMO_MODE bypasses throttle and rate limiting for hackathon demos.
 */
const db = require("../database");

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

class SafetyService {
  /**
   * Evaluates if an email is safe to send right now.
   */
  static checkSafety(leadId, campaignId, subject) {
    // 1. Duplicate Prevention (always enforced — even in demo)
    const duplicate = db.prepare(`SELECT id FROM email_logs WHERE leadId = ? AND campaignId = ? AND subject = ? LIMIT 1`).get(leadId, campaignId, subject);
    if (duplicate) {
      return { safe: false, reason: "Duplicate prevented" };
    }

    // 2. Throttling (30 seconds) — bypassed in DEMO_MODE
    if (!DEMO_MODE) {
      const recent = db.prepare(`SELECT id FROM email_logs WHERE createdAt >= datetime('now', '-30 seconds') LIMIT 1`).get();
      if (recent) {
        return { safe: false, reason: "Throttled (30s delay)" };
      }
    }

    // 3. Rate Limiting (20 per hour) — bypassed in DEMO_MODE
    if (!DEMO_MODE) {
      const rate = db.prepare(`SELECT COUNT(*) as count FROM email_logs WHERE createdAt >= datetime('now', '-1 hour')`).get().count;
      if (rate >= 20) {
        return { safe: false, reason: "Rate limited (20/hr)" };
      }
    }

    return { safe: true };
  }
}

module.exports = SafetyService;

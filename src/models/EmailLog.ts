/**
 * EmailLog model - MVC: Model
 * Record of each email sent (for analytics, rate limiting, duplicate prevention).
 * Fields: id, leadId, message, status, sentAt
 */

import { getDb } from "@/database/connection";

export type EmailLogStatus = "sent" | "delivered" | "bounced" | "failed";

export interface EmailLog {
  id: number;
  leadId: number;
  campaignId: number | null;
  message: string | null;
  status: EmailLogStatus;
  sentAt: string;
  createdAt?: string;
}

export interface EmailLogRow {
  id: number;
  lead_id: number;
  campaign_id: number | null;
  message: string | null;
  status: string;
  sent_at: string;
}

function rowToEmailLog(row: EmailLogRow): EmailLog {
  return {
    id: row.id,
    leadId: row.lead_id,
    campaignId: row.campaign_id,
    message: row.message,
    status: row.status as EmailLogStatus,
    sentAt: row.sent_at,
  };
}

/** Log a sent email. */
export function createEmailLog(data: {
  leadId: number;
  campaignId?: number | null;
  message?: string | null;
  status?: EmailLogStatus;
}): EmailLog {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO email_logs (lead_id, campaign_id, message, status)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.leadId,
    data.campaignId ?? null,
    data.message ?? null,
    data.status ?? "sent"
  );
  return getEmailLogById(result.lastInsertRowid as number)!;
}

/** Get a single log by id. */
export function getEmailLogById(id: number): EmailLog | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM email_logs WHERE id = ?").get(id) as EmailLogRow | undefined;
  return row ? rowToEmailLog(row) : null;
}

/** Get logs for a lead. */
export function getEmailLogsByLeadId(leadId: number): EmailLog[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM email_logs WHERE lead_id = ? ORDER BY sent_at DESC").all(leadId) as EmailLogRow[];
  return rows.map(rowToEmailLog);
}

/** Get logs for a campaign. */
export function getEmailLogsByCampaignId(campaignId: number): EmailLog[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM email_logs WHERE campaign_id = ? ORDER BY sent_at DESC")
    .all(campaignId) as EmailLogRow[];
  return rows.map(rowToEmailLog);
}

/** Count emails sent in the last N hours (for rate limiting). */
export function countEmailsSentSince(hoursAgo: number): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM email_logs WHERE datetime(sent_at) >= datetime('now', ?)"
    )
    .get(`-${hoursAgo} hours`) as { count: number };
  return row?.count ?? 0;
}

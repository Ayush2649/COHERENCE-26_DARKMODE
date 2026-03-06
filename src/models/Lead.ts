/**
 * Lead model - MVC: Model
 * Represents a contact/lead to be included in outreach campaigns.
 * Fields: id, name, email, company, role, status, currentStep
 */

import { getDb } from "@/database/connection";

export type LeadStatus = "new" | "contacted" | "replied" | "converted" | "bounced";

export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  status: LeadStatus;
  currentStep: string | null;
  campaignId: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Row shape as returned by SQLite (snake_case) */
export interface LeadRow {
  id: number;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  status: string;
  current_step: string | null;
  campaign_id: number | null;
  created_at: string;
  updated_at: string;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    role: row.role,
    status: row.status as LeadStatus,
    currentStep: row.current_step,
    campaignId: row.campaign_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Create a single lead. Returns the new lead with id. */
export function createLead(data: {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  status?: LeadStatus;
  currentStep?: string | null;
  campaignId?: number | null;
}): Lead {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO leads (name, email, company, role, status, current_step, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.email,
    data.company ?? null,
    data.role ?? null,
    data.status ?? "new",
    data.currentStep ?? null,
    data.campaignId ?? null
  );
  return getLeadById(result.lastInsertRowid as number)!;
}

/** Insert many leads in one transaction. Returns count inserted. */
export function createLeadsBatch(leads: Array<{ name: string; email: string; company?: string; role?: string }>): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO leads (name, email, company, role, status, current_step)
    VALUES (?, ?, ?, ?, 'new', NULL)
  `);
  const insertMany = db.transaction((rows: typeof leads) => {
    let count = 0;
    for (const row of rows) {
      const r = stmt.run(row.name, row.email, row.company ?? null, row.role ?? null);
      if (r.changes > 0) count++;
    }
    return count;
  });
  return insertMany(leads);
}

/** Get lead by id. */
export function getLeadById(id: number): Lead | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined;
  return row ? rowToLead(row) : null;
}

/** Get all leads, optionally by status or campaignId. */
export function getLeads(options?: { status?: LeadStatus; campaignId?: number | null }): Lead[] {
  const db = getDb();
  let sql = "SELECT * FROM leads";
  const params: (string | number)[] = [];
  if (options?.status) {
    sql += " WHERE status = ?";
    params.push(options.status);
  }
  if (options?.campaignId != null) {
    sql += params.length ? " AND campaign_id = ?" : " WHERE campaign_id = ?";
    params.push(options.campaignId);
  }
  sql += " ORDER BY id ASC";
  const rows = (params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all()) as LeadRow[];
  return rows.map(rowToLead);
}

/** Get leads in a campaign (campaignId not null). */
export function getLeadsByCampaignId(campaignId: number): Lead[] {
  return getLeads({ campaignId });
}

/** Update lead status, currentStep, and/or campaignId. */
export function updateLead(
  id: number,
  updates: { status?: LeadStatus; currentStep?: string | null; campaignId?: number | null }
): Lead | null {
  const db = getDb();
  const lead = getLeadById(id);
  if (!lead) return null;
  const status = updates.status ?? lead.status;
  const currentStep = updates.currentStep !== undefined ? updates.currentStep : lead.currentStep;
  const campaignId = updates.campaignId !== undefined ? updates.campaignId : lead.campaignId;
  db.prepare(
    "UPDATE leads SET status = ?, current_step = ?, campaign_id = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, currentStep, campaignId, id);
  return getLeadById(id);
}

/**
 * Campaign model - MVC: Model
 * A run of a workflow. Tracks status and start time.
 * Fields: id, workflowId, status, startTime
 */

import { getDb } from "@/database/connection";

export type CampaignStatus = "draft" | "running" | "paused" | "completed";

export interface Campaign {
  id: number;
  workflowId: number;
  status: CampaignStatus;
  startTime: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignRow {
  id: number;
  workflow_id: number;
  status: string;
  start_time: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status as CampaignStatus,
    startTime: row.start_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Create a campaign (draft by default). */
export function createCampaign(workflowId: number, status: CampaignStatus = "draft"): Campaign {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO campaigns (workflow_id, status, start_time)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(workflowId, status, null);
  return getCampaignById(result.lastInsertRowid as number)!;
}

/** Get campaign by id. */
export function getCampaignById(id: number): Campaign | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as CampaignRow | undefined;
  return row ? rowToCampaign(row) : null;
}

/** List campaigns, optionally by status. */
export function getCampaigns(options?: { workflowId?: number; status?: CampaignStatus }): Campaign[] {
  const db = getDb();
  let sql = "SELECT * FROM campaigns WHERE 1=1";
  const params: (number | string)[] = [];
  if (options?.workflowId != null) {
    sql += " AND workflow_id = ?";
    params.push(options.workflowId);
  }
  if (options?.status) {
    sql += " AND status = ?";
    params.push(options.status);
  }
  sql += " ORDER BY id DESC";
  const rows = (params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all()) as CampaignRow[];
  return rows.map(rowToCampaign);
}

/** Update campaign status and/or startTime. */
export function updateCampaign(
  id: number,
  updates: { status?: CampaignStatus; startTime?: string | null }
): Campaign | null {
  const db = getDb();
  const c = getCampaignById(id);
  if (!c) return null;
  const status = updates.status ?? c.status;
  const startTime = updates.startTime !== undefined ? updates.startTime : c.startTime;
  db.prepare(
    "UPDATE campaigns SET status = ?, start_time = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, startTime, id);
  return getCampaignById(id);
}

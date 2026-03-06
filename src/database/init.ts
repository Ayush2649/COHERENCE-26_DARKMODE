/**
 * Initialize database: create tables from schema.sql.
 * Call from API route GET /api/db/init or from scripts.
 */

import { getDb } from "./connection";
import fs from "fs";
import path from "path";

export function initDatabase(): void {
  const db = getDb();
  // Resolve schema from project root (works in Next.js and Node)
  const schemaPath = path.join(process.cwd(), "src", "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
  // Migration: add campaign_id to leads if missing (existing DBs), then ensure index exists
  try {
    const tableInfo = db.prepare("PRAGMA table_info(leads)").all() as { name: string }[];
    const hasCampaignId = tableInfo.some((c) => c.name === "campaign_id");
    if (!hasCampaignId) {
      db.exec("ALTER TABLE leads ADD COLUMN campaign_id INTEGER DEFAULT NULL");
    }
    db.exec("CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id)");
  } catch {
    // Ignore (e.g. leads table doesn't exist yet)
  }
}

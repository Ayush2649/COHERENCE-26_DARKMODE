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
}

/**
 * SQLite database connection singleton.
 * Used by models and API routes. Path is under project root for MVP.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "outreach.db");

let db: Database.Database | null = null;

/**
 * Get the database instance. Creates DB file and runs schema if needed.
 */
export function getDb(): Database.Database {
  if (db) return db;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

/**
 * Close the connection (e.g. in tests or graceful shutdown).
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export { DB_PATH };

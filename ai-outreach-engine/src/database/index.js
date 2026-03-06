/**
 * Database Connection & Initialization (MVC: Model Layer)
 * 
 * Uses better-sqlite3 for a zero-config SQLite database.
 * - Creates the database file at project root: outreach.db
 * - Initializes all tables on first run
 * - Exports a singleton db connection
 * 
 * WHY SQLITE?
 * For a hackathon MVP, SQLite gives us:
 * - No server setup needed
 * - Single file database (easy to reset)
 * - Synchronous API (simpler code)
 * - Full SQL support
 */
const Database = require("better-sqlite3");
const path = require("path");

/* Database file lives in the project root */
const DB_PATH = path.join(process.cwd(), "outreach.db");

/* Create or open the database connection */
const db = new Database(DB_PATH);

/* Enable WAL mode for better concurrent read performance */
db.pragma("journal_mode = WAL");

/**
 * Initialize all tables if they don't exist.
 * Called once when the module is first imported.
 */
function initializeDatabase() {
  db.exec(`
    -- =============================================
    -- LEADS TABLE
    -- Stores contact information for outreach targets
    -- =============================================
    CREATE TABLE IF NOT EXISTS leads (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      company      TEXT DEFAULT '',
      role         TEXT DEFAULT '',
      status       TEXT DEFAULT 'new',
      currentStep  TEXT DEFAULT 'none',
      createdAt    TEXT DEFAULT (datetime('now')),
      updatedAt    TEXT DEFAULT (datetime('now'))
    );

    -- =============================================
    -- WORKFLOWS TABLE
    -- Stores visual workflow definitions as JSON
    -- nodes = array of React Flow nodes
    -- edges = array of React Flow edges
    -- =============================================
    CREATE TABLE IF NOT EXISTS workflows (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      nodes     TEXT DEFAULT '[]',
      edges     TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    -- =============================================
    -- CAMPAIGNS TABLE
    -- Tracks campaign execution state
    -- Links to a workflow via workflowId
    -- =============================================
    CREATE TABLE IF NOT EXISTS campaigns (
      id         TEXT PRIMARY KEY,
      workflowId TEXT NOT NULL,
      name       TEXT DEFAULT 'Untitled Campaign',
      status     TEXT DEFAULT 'draft',
      startTime  TEXT,
      endTime    TEXT,
      createdAt  TEXT DEFAULT (datetime('now')),
      updatedAt  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflowId) REFERENCES workflows(id)
    );

    -- =============================================
    -- EMAIL LOGS TABLE
    -- Records every email sent during campaigns
    -- Links to a lead and optionally a campaign
    -- =============================================
    CREATE TABLE IF NOT EXISTS email_logs (
      id         TEXT PRIMARY KEY,
      leadId     TEXT NOT NULL,
      campaignId TEXT,
      subject    TEXT DEFAULT '',
      message    TEXT NOT NULL,
      status     TEXT DEFAULT 'pending',
      sentAt     TEXT,
      createdAt  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (leadId) REFERENCES leads(id),
      FOREIGN KEY (campaignId) REFERENCES campaigns(id)
    );
  `);
}

/* Run initialization on first import */
initializeDatabase();

module.exports = db;

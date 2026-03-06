/**
 * Models Layer (MVC: Model)
 * 
 * This folder contains all database models for the AI Outreach Engine:
 * - Lead: Contact information for outreach targets
 * - Workflow: Visual workflow definitions (nodes + edges)
 * - Campaign: Campaign execution state
 * - EmailLog: Email sending history and status tracking
 * 
 * Each model provides CRUD operations and interacts with the SQLite database.
 */

export { default as Lead } from './Lead';
export { default as Workflow } from './Workflow';
export { default as Campaign } from './Campaign';
export { default as EmailLog } from './EmailLog';

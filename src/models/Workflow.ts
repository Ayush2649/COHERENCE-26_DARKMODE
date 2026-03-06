/**
 * Workflow model - MVC: Model
 * Represents a visual workflow definition (nodes + edges as JSON).
 * Used by the workflow builder and campaign engine.
 * Fields: id, name, nodes, edges
 */

import { getDb } from "@/database/connection";

/** React Flow node (minimal shape for storage) */
export interface WorkflowNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

/** React Flow edge */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  id: number;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowRow {
  id: number;
  name: string;
  nodes: string;
  edges: string;
  created_at: string;
  updated_at: string;
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    nodes: JSON.parse(row.nodes || "[]") as WorkflowNode[],
    edges: JSON.parse(row.edges || "[]") as WorkflowEdge[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Create a new workflow. */
export function createWorkflow(data: {
  name: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}): Workflow {
  const db = getDb();
  const nodes = JSON.stringify(data.nodes ?? []);
  const edges = JSON.stringify(data.edges ?? []);
  const stmt = db.prepare("INSERT INTO workflows (name, nodes, edges) VALUES (?, ?, ?)");
  const result = stmt.run(data.name, nodes, edges);
  return getWorkflowById(result.lastInsertRowid as number)!;
}

/** Get workflow by id. */
export function getWorkflowById(id: number): Workflow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as WorkflowRow | undefined;
  return row ? rowToWorkflow(row) : null;
}

/** List all workflows. */
export function getWorkflows(): Workflow[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM workflows ORDER BY id ASC").all() as WorkflowRow[];
  return rows.map(rowToWorkflow);
}

/** Update workflow name, nodes, and edges. */
export function updateWorkflow(
  id: number,
  updates: { name?: string; nodes?: WorkflowNode[]; edges?: WorkflowEdge[] }
): Workflow | null {
  const db = getDb();
  const w = getWorkflowById(id);
  if (!w) return null;
  const name = updates.name ?? w.name;
  const nodes = updates.nodes !== undefined ? JSON.stringify(updates.nodes) : undefined;
  const edges = updates.edges !== undefined ? JSON.stringify(updates.edges) : undefined;
  if (nodes !== undefined && edges !== undefined) {
    db.prepare("UPDATE workflows SET name = ?, nodes = ?, edges = ?, updated_at = datetime('now') WHERE id = ?").run(
      name,
      nodes,
      edges,
      id
    );
  } else if (nodes !== undefined) {
    db.prepare("UPDATE workflows SET name = ?, nodes = ?, updated_at = datetime('now') WHERE id = ?").run(
      name,
      nodes,
      id
    );
  } else if (edges !== undefined) {
    db.prepare("UPDATE workflows SET name = ?, edges = ?, updated_at = datetime('now') WHERE id = ?").run(
      name,
      edges,
      id
    );
  } else {
    db.prepare("UPDATE workflows SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id);
  }
  return getWorkflowById(id);
}

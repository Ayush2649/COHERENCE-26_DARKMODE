/**
 * Workflows API - MVC: Route + Controller
 * GET: list all workflows
 * POST: create workflow { name, nodes?, edges? }
 */

import { initDatabase } from "@/database/init";
import * as Workflow from "@/models/Workflow";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    initDatabase();
    const workflows = Workflow.getWorkflows();
    return NextResponse.json({ ok: true, workflows, count: workflows.length });
  } catch (err) {
    console.error("GET /api/workflows error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = (await request.json()) as { name: string; nodes?: unknown[]; edges?: unknown[] };
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Request body must include a non-empty 'name' string." },
        { status: 400 }
      );
    }
    const workflow = Workflow.createWorkflow({
      name: body.name.trim(),
      nodes: Array.isArray(body.nodes) ? (body.nodes as Workflow.WorkflowNode[]) : [],
      edges: Array.isArray(body.edges) ? (body.edges as Workflow.WorkflowEdge[]) : [],
    });
    return NextResponse.json({ ok: true, workflow });
  } catch (err) {
    console.error("POST /api/workflows error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

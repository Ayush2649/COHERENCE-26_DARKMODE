/**
 * Single workflow API - MVC: Route + Controller
 * GET: get workflow by id
 * PUT: update workflow { name?, nodes?, edges? }
 */

import { initDatabase } from "@/database/init";
import * as Workflow from "@/models/Workflow";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ ok: false, error: "Invalid workflow id" }, { status: 400 });
    }
    initDatabase();
    const workflow = Workflow.getWorkflowById(numId);
    if (!workflow) {
      return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, workflow });
  } catch (err) {
    console.error("GET /api/workflows/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ ok: false, error: "Invalid workflow id" }, { status: 400 });
    }
    initDatabase();
    const existing = Workflow.getWorkflowById(numId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });
    }
    const body = (await request.json()) as { name?: string; nodes?: unknown[]; edges?: unknown[] };
    const workflow = Workflow.updateWorkflow(numId, {
      name: body.name != null ? String(body.name).trim() : undefined,
      nodes: Array.isArray(body.nodes) ? (body.nodes as Workflow.WorkflowNode[]) : undefined,
      edges: Array.isArray(body.edges) ? (body.edges as Workflow.WorkflowEdge[]) : undefined,
    });
    return NextResponse.json({ ok: true, workflow });
  } catch (err) {
    console.error("PUT /api/workflows/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

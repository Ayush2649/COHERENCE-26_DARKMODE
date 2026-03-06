/**
 * Workflows API Route (MVC: Route/Controller Layer)
 * 
 * Handles CRUD operations for workflows.
 * 
 * GET    /api/workflows      → List all workflows
 * POST   /api/workflows      → Create a new workflow
 */
import { NextResponse } from "next/server";

async function getWorkflowModel() {
  const Workflow = require("@/models/Workflow");
  return Workflow;
}

/* GET — Retrieve all workflows */
export async function GET() {
  try {
    const Workflow = await getWorkflowModel();
    const workflows = Workflow.findAll();

    return NextResponse.json({
      success: true,
      count: workflows.length,
      data: workflows,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* POST — Create a new workflow */
export async function POST(request) {
  try {
    const Workflow = await getWorkflowModel();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Workflow name is required" },
        { status: 400 }
      );
    }

    const workflow = Workflow.create({
      name: body.name,
      nodes: body.nodes || [],
      edges: body.edges || [],
    });

    return NextResponse.json(
      { success: true, data: workflow },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

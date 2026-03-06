/**
 * API Route to update a specific node in an active workflow
 * PATCH /api/workflows/[id]/node
 */
import { NextResponse } from "next/server";

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    const { nodeId, updatedData } = body;
    
    if (!nodeId || !updatedData) {
      return NextResponse.json({ success: false, error: "nodeId and updatedData required" }, { status: 400 });
    }

    const Workflow = require("@/models/Workflow");
    
    const workflow = Workflow.findById(id);
    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 });
    }

    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    
    let nodeFound = false;
    let updatedNode = null;

    const newNodes = nodes.map(node => {
      if (node.id === nodeId) {
        nodeFound = true;
        // Merge data safely
        node.data = { ...node.data, ...updatedData };
        updatedNode = node;
      }
      return node;
    });

    if (!nodeFound) {
      return NextResponse.json({ success: false, error: "Node not found in workflow" }, { status: 404 });
    }

    // Save back to DB
    Workflow.update(id, { nodes: JSON.stringify(newNodes) });

    return NextResponse.json({
      success: true,
      updatedNode
    });

  } catch (error) {
    console.error("Patch Node Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

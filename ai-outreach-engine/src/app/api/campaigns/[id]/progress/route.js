/**
 * API Route to get Campaign Progress
 * GET /api/campaigns/[id]/progress
 */
import { NextResponse } from "next/server";

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    
    // Dynamic requires for SQLite
    const Campaign = require("@/models/Campaign");
    const Workflow = require("@/models/Workflow");
    const Lead = require("@/models/Lead");
    const EmailLog = require("@/models/EmailLog");

    const campaign = Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const workflow = Workflow.findById(campaign.workflowId);
    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 });
    }

    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const edges = typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;

    // Get active leads
    const allLeads = Lead.findAll();
    const activeLeads = allLeads.filter(l => l.currentStep && l.currentStep !== 'none' && l.status === 'contacted');
    
    const currentSteps = new Set(activeLeads.map(l => l.currentStep));

    // Also check EmailLog to verify execution (as requested in prompt)
    const logs = EmailLog.findByCampaignId(campaign.id);
    const hasSentEmails = logs.length > 0;

    // Simple Breadth-First Search (BFS) to order nodes by depth from Start
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
       return NextResponse.json({ success: false, error: "No start node" }, { status: 500 });
    }

    const nodeDistances = new Map();
    const queue = [{ id: startNode.id, dist: 0 }];
    nodeDistances.set(startNode.id, 0);

    // Build adjacency list
    const adj = {};
    for (const edge of edges) {
      if (!adj[edge.source]) adj[edge.source] = [];
      adj[edge.source].push(edge.target);
    }

    while (queue.length > 0) {
      const { id: currId, dist } = queue.shift();
      if (adj[currId]) {
        for (const target of adj[currId]) {
          if (!nodeDistances.has(target)) {
            nodeDistances.set(target, dist + 1);
            queue.push({ id: target, dist: dist + 1 });
          }
        }
      }
    }

    // Determine current node (the one with active leads closest to start)
    let currentNodeId = null;
    let minCurrentDist = Infinity;

    for (const stepId of currentSteps) {
      const dist = nodeDistances.get(stepId) || 0;
      if (dist < minCurrentDist) {
        minCurrentDist = dist;
        currentNodeId = stepId;
      }
    }

    // If no active leads and campaign is finished
    if (activeLeads.length === 0 && campaign.status === 'completed') {
      minCurrentDist = Infinity; // All completed
    } else if (activeLeads.length === 0 && campaign.status === 'running') {
      // Edge case: campaign running but no leads active?
      // Assume start node or end node
      currentNodeId = startNode.id;
      minCurrentDist = 0;
    }

    const completedNodeIds = [];
    const futureNodeIds = [];

    for (const node of nodes) {
      if (node.id === currentNodeId) continue;
      
      const dist = nodeDistances.get(node.id) || 0;
      if (dist < minCurrentDist) {
        completedNodeIds.push(node.id);
      } else {
        futureNodeIds.push(node.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        completedNodeIds,
        currentNodeId,
        futureNodeIds,
        hasSentEmails
      }
    });

  } catch (error) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

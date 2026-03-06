/**
 * Test database operations (for Step 2 verification).
 * GET /api/db/test - creates sample data, returns counts.
 */

import { initDatabase } from "@/database/init";
import * as Lead from "@/models/Lead";
import * as Workflow from "@/models/Workflow";
import * as Campaign from "@/models/Campaign";
import * as EmailLog from "@/models/EmailLog";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    initDatabase();

    // Create sample lead (unique email per run so repeated test doesn't fail)
    const lead = Lead.createLead({
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      company: "Acme",
      role: "Engineer",
    });

    // Create sample workflow
    const workflow = Workflow.createWorkflow({
      name: "Sample Workflow",
      nodes: [{ id: "start", type: "start", position: { x: 0, y: 0 } }],
      edges: [],
    });

    // Create campaign
    const campaign = Campaign.createCampaign(workflow.id);

    // Log a sample email
    EmailLog.createEmailLog({
      leadId: lead.id,
      campaignId: campaign.id,
      message: "Test email body",
      status: "sent",
    });

    const leads = Lead.getLeads();
    const workflows = Workflow.getWorkflows();
    const campaigns = Campaign.getCampaigns();

    return NextResponse.json({
      ok: true,
      message: "Database test passed.",
      counts: {
        leads: leads.length,
        workflows: workflows.length,
        campaigns: campaigns.length,
      },
      sampleLead: { id: lead.id, email: lead.email, name: lead.name },
      sampleWorkflow: { id: workflow.id, name: workflow.name },
    });
  } catch (err) {
    console.error("DB test error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

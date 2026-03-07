/**
 * Database Test & Seed API Route
 * 
 * GET  /api/test-db → Tests database connection and shows table info
 * POST /api/test-db → Seeds sample data into all tables for testing
 * 
 * This endpoint is for DEVELOPMENT ONLY.
 */
import { NextResponse } from "next/server";

/* GET — Test database connection and show table counts */
export async function GET() {
  try {
    const db = require("@/database");
    const Lead = require("@/models/Lead");
    const Workflow = require("@/models/Workflow");
    const Campaign = require("@/models/Campaign");
    const EmailLog = require("@/models/EmailLog");

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      tables: {
        leads: Lead.count(),
        workflows: Workflow.count(),
        campaigns: Campaign.count(),
        emailLogs: EmailLog.count(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* POST — Seed sample data for testing */
export async function POST() {
  try {
    const Lead = require("@/models/Lead");
    const Workflow = require("@/models/Workflow");
    const Campaign = require("@/models/Campaign");
    const EmailLog = require("@/models/EmailLog");

    /* --- Seed Leads --- */
    const sampleLeads = [
      { name: "John Smith", email: "john@tesla.com", company: "Tesla", role: "CTO" },
      { name: "Sarah Chen", email: "sarah@openai.com", company: "OpenAI", role: "Engineer" },
      { name: "Mike Johnson", email: "mike@stripe.com", company: "Stripe", role: "VP Sales" },
      { name: "Emily Davis", email: "emily@google.com", company: "Google", role: "Product Manager" },
      { name: "Alex Rivera", email: "alex@meta.com", company: "Meta", role: "Director" },
    ];
    const leadsInserted = Lead.bulkCreate(sampleLeads);

    /* --- Seed Workflow --- */
    const workflow = Workflow.create({
      name: "Cold Outreach Flow",
      nodes: [
        { id: "1", type: "start", position: { x: 250, y: 0 }, data: { label: "Start" } },
        { id: "2", type: "sendEmail", position: { x: 250, y: 220 }, data: { label: "Send Cold Email" } },
        { id: "3", type: "wait", position: { x: 250, y: 440 }, data: { label: "Wait 3 Hours" } },
        { id: "4", type: "condition", position: { x: 250, y: 660 }, data: { label: "Reply Received?" } },
        { id: "5", type: "sendFollowup", position: { x: 450, y: 880 }, data: { label: "Send Follow-up" } },
        { id: "6", type: "end", position: { x: 250, y: 1100 }, data: { label: "End" } },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e3-4", source: "3", target: "4" },
        { id: "e4-5", source: "4", target: "5", label: "No" },
        { id: "e4-6", source: "4", target: "6", label: "Yes" },
        { id: "e5-6", source: "5", target: "6" },
      ],
    });

    /* --- Seed Campaign --- */
    const campaign = Campaign.create({
      workflowId: workflow.id,
      name: "Q1 Cold Outreach",
    });

    /* --- Seed Email Logs --- */
    const allLeads = Lead.findAll();
    let emailCount = 0;
    for (const lead of allLeads.slice(0, 3)) {
      EmailLog.create({
        leadId: lead.id,
        campaignId: campaign.id,
        subject: "Let's connect!",
        message: `Hi ${lead.name}, I'd love to discuss how we can help ${lead.company}...`,
        status: "sent",
      });
      emailCount++;
    }

    return NextResponse.json({
      success: true,
      message: "Sample data seeded!",
      seeded: {
        leads: leadsInserted,
        workflows: 1,
        campaigns: 1,
        emailLogs: emailCount,
      },
      data: {
        workflow,
        campaign,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Start Campaign API - MVC: Controller (CampaignController)
 * POST body: { leadIds?: number[] } — if omitted, use all leads with status 'new'.
 * 1) Load workflow and leads
 * 2) Set campaign status running, assign leads (campaign_id + current_step = start)
 * 3) Run one workflow tick: execute one step per lead, then update current_step
 */

import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/database/init";
import * as Campaign from "@/models/Campaign";
import * as Workflow from "@/models/Workflow";
import * as Lead from "@/models/Lead";
import { getStartNodeId, executeStep } from "@/services/workflowEngine";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const campaignId = parseInt(id, 10);
    if (Number.isNaN(campaignId)) {
      return NextResponse.json({ ok: false, error: "Invalid campaign id" }, { status: 400 });
    }

    initDatabase();
    const campaign = Campaign.getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status !== "draft" && campaign.status !== "running") {
      return NextResponse.json(
        { ok: false, error: "Campaign is not draft or running" },
        { status: 400 }
      );
    }

    const workflow = Workflow.getWorkflowById(campaign.workflowId);
    if (!workflow) {
      return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });
    }

    const startNodeId = getStartNodeId(workflow);
    if (!startNodeId) {
      return NextResponse.json({ ok: false, error: "Workflow has no start node" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { leadIds?: number[] };
    let leads: Lead.Lead[];
    if (Array.isArray(body.leadIds) && body.leadIds.length > 0) {
      leads = body.leadIds
        .map((lid) => Lead.getLeadById(lid))
        .filter((l): l is Lead.Lead => l != null);
    } else {
      leads = Lead.getLeads({ status: "new" });
    }

    if (leads.length === 0) {
      return NextResponse.json({ ok: false, error: "No leads to run" }, { status: 400 });
    }

    Campaign.updateCampaign(campaignId, {
      status: "running",
      startTime: campaign.startTime ?? new Date().toISOString(),
    });

    const isNewRun = campaign.status === "draft";
    if (isNewRun) {
      for (const lead of leads) {
        Lead.updateLead(lead.id, { campaignId, currentStep: startNodeId });
      }
    }

    const campaignLeads = Lead.getLeadsByCampaignId(campaignId);
    const options = { prompt: "Write a friendly cold outreach email.", role: "Sales Manager" };
    const results: { leadId: number; nextNodeId: string | null; emailSent?: boolean }[] = [];

    for (const lead of campaignLeads) {
      const result = await executeStep(workflow, lead, campaignId, options);
      results.push({ leadId: lead.id, nextNodeId: result.nextNodeId, emailSent: result.emailSent });
      Lead.updateLead(lead.id, {
        currentStep: result.nextNodeId,
        status: result.nextNodeId == null ? "contacted" : lead.status,
      });
    }

    const allDone = results.every((r) => r.nextNodeId == null);
    if (allDone) {
      Campaign.updateCampaign(campaignId, { status: "completed" });
    }

    return NextResponse.json({
      ok: true,
      message: isNewRun ? "Campaign started." : "Campaign advanced one step.",
      leadsProcessed: campaignLeads.length,
      results,
    });
  } catch (err) {
    console.error("POST /api/campaigns/[id]/start error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

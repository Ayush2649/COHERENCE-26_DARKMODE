/**
 * Campaigns API - list and create.
 * GET: list campaigns
 * POST: create campaign { workflowId }
 */

import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/database/init";
import * as Campaign from "@/models/Campaign";

export async function GET() {
  try {
    initDatabase();
    const campaigns = Campaign.getCampaigns();
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    console.error("GET /api/campaigns error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = (await request.json().catch(() => ({}))) as { workflowId?: number };
    const workflowId = body.workflowId;
    if (typeof workflowId !== "number" || workflowId < 1) {
      return NextResponse.json(
        { ok: false, error: "Request body must include a valid workflowId (number)." },
        { status: 400 }
      );
    }
    const campaign = Campaign.createCampaign(workflowId);
    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    console.error("POST /api/campaigns error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

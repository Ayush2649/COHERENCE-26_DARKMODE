/**
 * Campaign logs API - list email logs for a campaign.
 * GET /api/campaigns/[id]/logs
 */

import { NextResponse } from "next/server";
import { initDatabase } from "@/database/init";
import * as Campaign from "@/models/Campaign";
import * as EmailLog from "@/models/EmailLog";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
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
    const logs = EmailLog.getEmailLogsByCampaignId(campaignId);
    return NextResponse.json({ ok: true, campaign, logs });
  } catch (err) {
    console.error("GET /api/campaigns/[id]/logs error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

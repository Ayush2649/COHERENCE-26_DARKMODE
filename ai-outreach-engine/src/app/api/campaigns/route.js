/**
 * Campaigns API Route (MVC: Route/Controller Layer)
 * 
 * GET    /api/campaigns      → List all campaigns
 * POST   /api/campaigns      → Create a new campaign
 */
import { NextResponse } from "next/server";

async function getCampaignModel() {
  const Campaign = require("@/models/Campaign");
  return Campaign;
}

/* GET — Retrieve all campaigns */
export async function GET(request) {
  try {
    const Campaign = await getCampaignModel();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const campaigns = Campaign.findAll(status || undefined);

    return NextResponse.json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* POST — Create a new campaign */
export async function POST(request) {
  try {
    const Campaign = await getCampaignModel();
    const body = await request.json();

    if (!body.workflowId) {
      return NextResponse.json(
        { success: false, error: "workflowId is required" },
        { status: 400 }
      );
    }

    const campaign = Campaign.create({
      workflowId: body.workflowId,
      name: body.name,
    });

    return NextResponse.json(
      { success: true, data: campaign },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

async function getEngine() {
  return require("@/services/CampaignEngine");
}

/* POST /api/campaigns/step */
export async function POST(request) {
  try {
    const Engine = await getEngine();
    const body = await request.json();
    
    if (!body.campaignId) {
      return NextResponse.json({ success: false, error: "Missing campaignId" }, { status: 400 });
    }

    const result = await Engine.processStep(body.campaignId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

async function getEngine() {
  return require("@/services/CampaignEngine");
}

/* POST /api/campaigns/start */
export async function POST(request) {
  try {
    const Engine = await getEngine();
    const body = await request.json();
    
    if (!body.workflowId || !body.name) {
      return NextResponse.json({ success: false, error: "Missing workflowId or name" }, { status: 400 });
    }

    const campaign = await Engine.startCampaign(body.workflowId, body.name);

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

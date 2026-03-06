import { NextResponse } from "next/server";

async function getEngine() {
  return require("@/services/CampaignEngine");
}

/* POST /api/campaigns/step */
export async function POST(request) {
  try {
    const Engine = await getEngine();
    const Lead = require("@/models/Lead");
    const body = await request.json();
    
    if (!body.campaignId) {
      return NextResponse.json({ success: false, error: "Missing campaignId" }, { status: 400 });
    }

    const result = await Engine.processStep(body.campaignId);

    // Calculate progress percentage
    const allLeads = Lead.findAll();
    const total = allLeads.filter(l => l.status !== 'new').length || 1;
    const completed = allLeads.filter(l => l.currentStep === 'none' && l.status !== 'new').length;
    const progress = Math.round((completed / total) * 100);

    return NextResponse.json({
      success: true,
      data: result,
      progress,
      completed,
      total,
      needsDelay: result.needsDelay || false,
      hasReadyLeads: result.hasReadyLeads !== undefined ? result.hasReadyLeads : true,
      nextReadyAt: result.nextReadyAt || null,
    });
  } catch (error) {
    console.error("Campaign step error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

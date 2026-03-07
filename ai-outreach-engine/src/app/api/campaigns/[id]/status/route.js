import { NextResponse } from "next/server";

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const Campaign = require("@/models/Campaign");
    const updated = Campaign.update(id, { status });

    if (!updated) {
       return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update campaign status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

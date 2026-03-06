/**
 * AI Generate API - MVC: Route + Controller (AIController)
 * POST body: { prompt, role, campaignContext?, leadData?: { name?, company?, role? } }
 * Returns: { ok, message } with generated email body.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMessage } from "@/services/aiService";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      role?: string;
      campaignContext?: string;
      leadData?: { name?: string; company?: string; role?: string };
    };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";

    if (!prompt || !role) {
      return NextResponse.json(
        { ok: false, error: "Both 'prompt' and 'role' are required." },
        { status: 400 }
      );
    }

    const message = await generateMessage({
      prompt,
      role,
      campaignContext: typeof body.campaignContext === "string" ? body.campaignContext.trim() : undefined,
      leadData: body.leadData && typeof body.leadData === "object" ? body.leadData : undefined,
    });

    return NextResponse.json({ ok: true, message });
  } catch (err) {
    console.error("POST /api/ai/generate error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate message";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

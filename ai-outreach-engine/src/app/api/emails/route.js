/**
 * Email Logs API Route (MVC: Route/Controller Layer)
 * 
 * GET    /api/emails         → List all email logs
 * GET    /api/emails?stats=1 → Get email statistics
 */
import { NextResponse } from "next/server";

async function getEmailLogModel() {
  const EmailLog = require("@/models/EmailLog");
  return EmailLog;
}

/* GET — Retrieve email logs or stats */
export async function GET(request) {
  try {
    const EmailLog = await getEmailLogModel();
    const { searchParams } = new URL(request.url);

    /* Return stats if ?stats=1 */
    if (searchParams.get("stats")) {
      const campaignId = searchParams.get("campaignId");
      const stats = EmailLog.getStats(campaignId || undefined);
      return NextResponse.json({ success: true, data: stats });
    }

    const status = searchParams.get("status");
    const logs = EmailLog.findAll(status || undefined);

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Dashboard API Route
 * 
 * GET /api/dashboard
 * Aggregates statistics from Leads, Campaigns, and EmailLogs 
 * to power the Recharts dashboard UI.
 */
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const Lead = require("@/models/Lead");
    const Campaign = require("@/models/Campaign");
    const EmailLog = require("@/models/EmailLog");

    // 1. Get Top-Level Metrics
    const totalLeads = Lead.count();
    const newLeads = Lead.count("new");
    const repliedLeads = Lead.count("replied");
    const convertedLeads = Lead.count("converted");
    
    const totalCampaigns = Campaign.count();
    const activeCampaigns = Campaign.count("running");

    const emailStats = EmailLog.getStats();

    // 2. Build Funnel Data
    const funnelData = [
      { name: "Total Uploaded", value: totalLeads },
      { name: "Contacted", value: totalLeads - newLeads },
      { name: "Replied", value: repliedLeads + convertedLeads }, 
      { name: "Converted", value: convertedLeads }
    ];

    // 3. Build Recent Activity (last 5 emails sent)
    // We'll just fetch all and slice for MVP
    const recentEmails = EmailLog.findAll().slice(0, 5).map(log => {
      const lead = Lead.findById(log.leadId);
      return {
        id: log.id,
        action: `Sent "${log.subject}"`,
        target: lead ? lead.name : "Unknown Lead",
        time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: log.status
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalLeads,
          activeCampaigns,
          emailsSent: emailStats.sent,
          conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
        },
        funnelData,
        recentActivity: recentEmails
      }
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

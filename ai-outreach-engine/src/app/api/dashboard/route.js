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

    // 3. Recent Activity (last 5)
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

    // 4. Emails by day (last 7 days) for line/area chart
    const db = require("@/database");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const iso = sevenDaysAgo.toISOString().slice(0, 10);
    const byDay = db.prepare(
      `SELECT date(createdAt) as day, COUNT(*) as count FROM email_logs WHERE date(createdAt) >= ? GROUP BY date(createdAt) ORDER BY day`
    ).all(iso);
    const dayMap = Object.fromEntries(byDay.map(r => [r.day, r.count]));
    const emailsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      emailsByDay.push({ day: label, emails: dayMap[day] || 0, full: day });
    }

    // 5. Lead status breakdown for pie chart
    const contactedCount = totalLeads - newLeads;
    const leadStatusBreakdown = [
      { name: "New", value: newLeads, fill: "var(--chart-1)" },
      { name: "Contacted", value: contactedCount, fill: "var(--chart-2)" },
      { name: "Replied", value: repliedLeads, fill: "var(--chart-3)" },
      { name: "Converted", value: convertedLeads, fill: "var(--chart-4)" }
    ].filter((d) => d.value > 0);

    // 6. Emails by campaign (for bar chart)
    const campaignsWithEmailCount = db.prepare(`
      SELECT c.id, c.name, COUNT(e.id) as emails
      FROM campaigns c
      LEFT JOIN email_logs e ON e.campaignId = c.id
      GROUP BY c.id
      HAVING COUNT(e.id) > 0
      ORDER BY emails DESC
      LIMIT 10
    `).all().map((r) => ({ name: r.name || "Unnamed", emails: r.emails, id: r.id }));

    // 7. Quick insights (meaningful bullets from data)
    const emailsThisWeek = emailsByDay.reduce((sum, d) => sum + (d.emails || 0), 0);
    const topStatus = leadStatusBreakdown.length
      ? leadStatusBreakdown.reduce((a, b) => (a.value >= b.value ? a : b), leadStatusBreakdown[0])
      : null;
    const insights = [];
    if (totalLeads > 0) {
      if (topStatus) insights.push(`Most leads are in "${topStatus.name}" stage (${topStatus.value})`);
      if (emailsThisWeek > 0) insights.push(`${emailsThisWeek} email${emailsThisWeek !== 1 ? "s" : ""} sent in the last 7 days`);
      if (convertedLeads > 0) insights.push(`${convertedLeads} lead${convertedLeads !== 1 ? "s" : ""} converted so far`);
      if (activeCampaigns > 0) insights.push(`${activeCampaigns} campaign${activeCampaigns !== 1 ? "s" : ""} currently running`);
    }
    if (insights.length === 0) insights.push("Upload leads and run a campaign to see insights here");

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
        recentActivity: recentEmails,
        emailsByDay,
        leadStatusBreakdown,
        campaignsWithEmailCount,
        insights
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

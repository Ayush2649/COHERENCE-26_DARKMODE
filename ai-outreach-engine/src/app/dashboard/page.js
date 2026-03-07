"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from "recharts";
import { Users, Mail, Rocket, Target, MailCheck, Zap, Lightbulb, TrendingUp } from "lucide-react";

/**
 * Monitoring Dashboard
 * 
 * Step 8: Visualizes aggregated metrics from the SQL schema
 */
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chart colors that stay visible in both light and dark mode
  const funnelColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];
  const pieColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];
  const campaignBarColors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

  const totalForPct = data?.funnelData?.reduce((s, d) => s + d.value, 0) || 1;
  const FunnelTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const pct = totalForPct ? Math.round((p.value / totalForPct) * 100) : 0;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md dark:border-white/10 dark:bg-[oklch(0.18_0.008_285)]">
        <div className="font-medium text-foreground">{p.name}</div>
        <div className="text-muted-foreground">{p.value} leads ({pct}%)</div>
      </div>
    );
  };
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const total = data?.leadStatusBreakdown?.reduce((s, d) => s + d.value, 0) || 1;
    const pct = total ? Math.round((p.value / total) * 100) : 0;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md dark:border-white/10 dark:bg-[oklch(0.18_0.008_285)]">
        <div className="font-medium text-foreground">{p.name}</div>
        <div className="text-muted-foreground">{p.value} ({pct}%)</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6 dark:border-white/10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live metrics from your campaigns, leads, and email activity
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            Refreshes every 10s
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Leads" value={data?.metrics.totalLeads} Icon={Users} isLoading={isLoading} subtext="In database" />
          <MetricCard title="Emails Sent" value={data?.metrics.emailsSent} Icon={Mail} isLoading={isLoading} subtext="All time" />
          <MetricCard title="Active Campaigns" value={data?.metrics.activeCampaigns} Icon={Rocket} isLoading={isLoading} subtext="Currently running" />
          <MetricCard
            title="Conversion Rate"
            value={data?.metrics.conversionRate !== undefined ? `${data.metrics.conversionRate}%` : null}
            Icon={Target}
            isLoading={isLoading}
            subtext="Leads → Converted"
          />
        </div>

        {/* Row: Emails over time + Lead status pie */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3 border border-border bg-card shadow-sm overflow-hidden dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Emails sent (last 7 days)</CardTitle>
              <CardDescription className="text-xs">Daily volume</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : data?.emailsByDay?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.emailsByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border dark:stroke-white/10" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--card-foreground)", fontSize: 12 }}
                      formatter={(value) => [value, "Emails"]}
                      labelFormatter={(label) => label}
                    />
                    <Area type="monotone" dataKey="emails" stroke="#6366f1" fill="url(#areaGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No email data yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border border-border bg-card shadow-sm overflow-hidden dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground">Lead status</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Breakdown by stage</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : data?.leadStatusBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.leadStatusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {data.leadStatusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No leads yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row: Emails by campaign + Quick insights */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3 border border-border bg-card shadow-sm overflow-hidden dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground">Emails by campaign</CardTitle>
              <CardDescription className="text-xs">Volume per campaign (top 10)</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : data?.campaignsWithEmailCount?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.campaignsWithEmailCount}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border dark:stroke-white/10" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--foreground)", fontSize: 11 }}
                      width={100}
                      tickFormatter={(v) => (v.length > 18 ? v.slice(0, 16) + "…" : v)}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--card-foreground)", fontSize: 12 }}
                      formatter={(value) => [value, "Emails sent"]}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="emails" radius={[0, 4, 4, 0]} barSize={22} fill="#6366f1">
                      {data.campaignsWithEmailCount.map((_, i) => (
                        <Cell key={i} fill={campaignBarColors[i % campaignBarColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No campaign email data yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border border-border bg-card shadow-sm dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Quick insights
              </CardTitle>
              <CardDescription className="text-xs">Data-driven summary</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
                </div>
              ) : data?.insights?.length > 0 ? (
                <ul className="space-y-3">
                  {data.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-primary/70" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Run campaigns to see insights.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4 border border-border bg-card shadow-sm overflow-hidden flex flex-col dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground">Conversion funnel</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Lead progression (count per stage)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : data?.funnelData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.funnelData} layout="vertical" margin={{ top: 12, right: 40, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" className="dark:stroke-white/10" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
                      width={120}
                    />
                    <Tooltip content={<FunnelTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36} label={{ position: "right", fill: "var(--foreground)", fontSize: 12, formatter: (v) => v }}>
                      {data.funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border border-border bg-card shadow-sm flex flex-col dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-foreground">Recent activity</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Latest emails sent</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : data?.recentActivity?.length > 0 ? (
                <div className="space-y-4">
                  {data.recentActivity.map((activity, i) => (
                    <div key={activity.id || i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25">
                        {activity.status === "sent" ? <MailCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{activity.target}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[180px] flex-col items-center justify-center text-sm text-muted-foreground">
                  <Mail className="h-8 w-8 opacity-40 mb-2" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, Icon, isLoading, subtext }) {
  return (
    <Card className="border border-border bg-card shadow-sm dark:bg-[oklch(0.16_0.008_285)] dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground dark:bg-white/10 dark:text-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-semibold text-foreground">{value !== null && value !== undefined ? value : "0"}</div>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

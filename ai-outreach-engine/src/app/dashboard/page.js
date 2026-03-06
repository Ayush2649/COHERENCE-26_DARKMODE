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
  Cell
} from "recharts";

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

  // Format array colors for funnel chart
  const funnelColors = [
    "hsl(var(--primary))", // Uploaded
    "hsl(var(--chart-2))", // Contacted
    "hsl(var(--chart-3))", // Replied
    "hsl(var(--chart-4))", // Converted
  ];

  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Real-time campaign metrics, funnel analysis, and outreach activity.
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary animate-pulse">
            Live Updates (10s)
          </Badge>
        </div>

        {/* Top 4 Metric Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard 
            title="Total Leads" 
            value={data?.metrics.totalLeads} 
            icon="👥" 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Emails Sent" 
            value={data?.metrics.emailsSent} 
            icon="📤" 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Active Campaigns" 
            value={data?.metrics.activeCampaigns} 
            icon="🚀" 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Conversion Rate" 
            value={data?.metrics.conversionRate !== undefined ? `${data.metrics.conversionRate}%` : null} 
            icon="🎯" 
            isLoading={isLoading} 
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Main Funnel Chart */}
          <Card className="lg:col-span-4 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Visualizing lead progression from upload to conversion.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[350px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : data?.funnelData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                      {data.funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="lg:col-span-3 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live log of campaign engine actions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pr-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : data?.recentActivity?.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {data.recentActivity.map((activity, i) => (
                    <div key={activity.id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                         {activity.status === 'sent' ? '📧' : '⚡'}
                      </div>
                      
                      {/* Event Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border/50 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{activity.target}</span>
                          <span className="text-xs text-muted-foreground font-mono">{activity.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground opacity-60">
                   <span className="text-4xl mb-2">📭</span>
                   <p className="text-sm">No recent activity.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}

// Helper component for top metrics
function MetricCard({ title, value, icon, isLoading }) {
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-xl opacity-80">{icon}</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-[100px]" />
        ) : (
          <div className="text-3xl font-bold">{value !== null && value !== undefined ? value : "0"}</div>
        )}
      </CardContent>
    </Card>
  );
}

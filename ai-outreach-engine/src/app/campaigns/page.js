"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Rocket, Pencil, Play, Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * Campaign Simulator Page (Step 6 & 7)
 * 
 * Instead of waiting 3 real days for a Wait Node, this page lets the user 
 * manually trigger the "next tick" of the campaign engine scheduler to see 
 * how leads progress through the workflow nodes in real-time.
 */
export default function CampaignsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [activeCampaign, setActiveCampaign] = useState(null);
  
  const [isStarting, setIsStarting] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  
  const [logs, setLogs] = useState([]);
  const [leadsStatus, setLeadsStatus] = useState({ total: 0, completed: 0 });

  // Load available workflows on mount
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch("/api/workflows");
        const data = await res.json();
        if (data.success) {
          setWorkflows(data.data);
          if (data.data.length > 0) setSelectedWorkflowId(data.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch workflows", err);
      }
    };
    fetchWorkflows();
  }, []);

  const startCampaign = async () => {
    if (!selectedWorkflowId) return;
    setIsStarting(true);
    
    try {
      const selectedWf = workflows.find(w => w.id === selectedWorkflowId);
      
      const res = await fetch("/api/campaigns/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          name: `Simulated: ${selectedWf.name} - ${new Date().toLocaleTimeString()}`
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setActiveCampaign(data.data);
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: "Campaign Started. Leads initialized at Start Node." }, ...prev]);
        updateLeadsStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const processStep = async () => {
    if (!activeCampaign) return;
    setIsStepping(true);
    
    try {
      const res = await fetch("/api/campaigns/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: activeCampaign.id })
      });
      
      const data = await res.json();
      if (data.success) {
        const result = data.data;
        
        if (result.logs.length === 0) {
          setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: "No active leads left to process." }, ...prev]);
        } else {
          // Add all new logs to the feed
          const newLogs = result.logs.map(log => ({
            time: new Date().toLocaleTimeString(),
            message: `${log.leadName} (${log.company || 'Unknown'}): ${log.action}`,
            type: log.nodeType,
            logType: log.logType || 'info'
          }));
          setLogs(prev => [...newLogs, ...prev]);
        }
        
        updateLeadsStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStepping(false);
    }
  };

  const updateLeadsStatus = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        const total = data.data.length;
        const completed = data.data.filter(l => l.currentStep === 'none' && l.status !== 'new').length;
        setLeadsStatus({ total, completed });
      }
    } catch (err) {}
  };

  const progressPercentage = leadsStatus.total === 0 ? 0 : Math.round((leadsStatus.completed / leadsStatus.total) * 100);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Step through the campaign engine and watch leads move through workflows.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">Step-by-step</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Simulation Control</CardTitle>
                <CardDescription>Select workflow and trigger execution steps.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {!activeCampaign ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Workflow:</label>
                      <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workflow..." />
                        </SelectTrigger>
                        <SelectContent>
                          {workflows.map(wf => (
                            <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      className="w-full gap-2"
                      onClick={startCampaign}
                      disabled={isStarting || !selectedWorkflowId}
                    >
                      <Rocket className="h-4 w-4" />
                      {isStarting ? "Initializing..." : "Start campaign"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Active Campaign</div>
                      <div className="font-medium truncate mb-3">{activeCampaign.name}</div>
                      
                      <Link href={`/workflows?load=${activeCampaign.workflowId}&campaignId=${activeCampaign.id}`}>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit workflow
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Campaign Progress</span>
                        <span className="font-medium">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        {leadsStatus.completed} of {leadsStatus.total} leads finished
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 gap-2"
                      onClick={processStep}
                      disabled={isStepping || progressPercentage === 100}
                    >
                      {isStepping ? <Radio className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
                      {isStepping ? "Processing..." : "Step forward"}
                    </Button>
                    
                    <div className="text-xs text-center text-muted-foreground">
                      Each click simulates 1 tick of the campaign engine.
                      Leads will wait real durations at Wait nodes.
                    </div>
                  </div>
                )}
                
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Execution Logs */}
          <div className="lg:col-span-2">
            <Card className="border-border/60 bg-card/80 shadow-sm h-full flex flex-col min-h-[500px]">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-base font-medium">Execution log</CardTitle>
                <CardDescription>Live feed of node executions for all active leads.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                
                {logs.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Radio className="mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm">Start a campaign to see live logs.</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-4 space-y-3 font-mono text-sm">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">[{log.time}]</span>
                        <div className="flex-1">
                          <span className={
                            log.logType === 'sent' ? 'text-green-500 font-medium' :
                            log.logType === 'waiting' ? 'text-amber-500 font-medium' :
                            log.logType === 'completed' ? 'text-purple-500 font-medium' :
                            log.type === 'sendEmail' || log.type === 'sendFollowup' ? 'text-blue-500 font-medium' :
                            log.type === 'condition' ? 'text-orange-500 font-medium' :
                            log.type === 'wait' ? 'text-amber-500 font-medium' :
                            log.type === 'end' ? 'text-destructive font-medium' :
                            'text-foreground'
                          }>
                            {log.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}

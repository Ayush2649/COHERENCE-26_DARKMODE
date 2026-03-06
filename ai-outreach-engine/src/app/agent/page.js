"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Simulate typewriter effect
const useTypewriter = (text, speed = 30) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayText("");
    if (!text) return;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayText;
};

export default function AgentPage() {
  const [prompt, setPrompt] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Agent State
  const [agentLogs, setAgentLogs] = useState([]); // [{id, status, text}]
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [campaignResult, setCampaignResult] = useState(null);
  const [error, setError] = useState(null);

  const logEndRef = useRef(null);
  
  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  // Fetch lead count on load
  useEffect(() => {
    fetch("/api/leads")
      .then(res => res.json())
      .then(data => {
        if (data.success) setTotalLeads(data.data.length);
      })
      .catch(() => {});
  }, []);

  const addLog = (text, status = "pending") => {
    const id = Date.now() + Math.random();
    setAgentLogs(prev => [...prev, { id, text, status }]);
    return id;
  };

  const updateLogStatus = (id, status, newText = null) => {
    setAgentLogs(prev => prev.map(log => {
      if (log.id === id) {
        return { ...log, status, text: newText || log.text };
      }
      return log;
    }));
  };

  const handleLaunch = async () => {
    if (!prompt.trim() || isLaunching) return;
    
    setIsLaunching(true);
    setAgentLogs([]);
    setCampaignResult(null);
    setError(null);
    setCurrentStepIndex(0);

    // Initial log
    const intentLogId = addLog("🔍 Understanding your campaign goal...", "pending");

    try {
      // We don't need real-time streaming sockets for a hackathon. 
      // We'll simulate the agent steps on the frontend by hardcoding the UI delays,
      // while the backend does all the complex work in one big API call.
      
      const responsePromise = fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      // --- SIMULATED REAL-TIME UI TIMELINE ---
      
      await new Promise(r => setTimeout(r, 1200));
      updateLogStatus(intentLogId, "success");
      
      const scanLogId = addLog("👥 Scanning leads database...", "pending");
      await new Promise(r => setTimeout(r, 1500));
      
      // Wait for actual API response to finish so we have the real numbers
      const response = await responsePromise;
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Agent encountered an error.");
      }

      updateLogStatus(scanLogId, "success", `👥 Found ${data.leadsTargeted} matching leads for "${data.targetAudience}"`);
      
      const planLogId = addLog("🗺️ Planning workflow structure...", "pending");
      await new Promise(r => setTimeout(r, 1000));
      updateLogStatus(planLogId, "success");

      // Simulate writing emails
      for (let i = 0; i < data.emails.length; i++) {
        const writeLogId = addLog(`✍️ Writing Email ${i + 1} of ${data.emails.length}...`, "pending");
        await new Promise(r => setTimeout(r, 800));
        updateLogStatus(writeLogId, "success");
      }

      const buildLogId = addLog("⚡ Building workflow nodes and edges...", "pending");
      await new Promise(r => setTimeout(r, 700));
      updateLogStatus(buildLogId, "success");
      
      const saveLogId = addLog("💾 Saving workflow to database...", "pending");
      await new Promise(r => setTimeout(r, 600));
      updateLogStatus(saveLogId, "success");

      const launchLogId = addLog("🚀 Creating campaign and assigning leads...", "pending");
      await new Promise(r => setTimeout(r, 800));
      updateLogStatus(launchLogId, "success");

      addLog("✅ Campaign is LIVE!", "success");
      
      // Show summary
      setCampaignResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message);
      addLog(`❌ Fatal Error: ${err.message}`, "error");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">Autonomous Campaign Agent</h1>
            <p className="mt-2 text-muted-foreground">
              Describe your goal. The AI will filter leads, build the workflow, write the copy, and launch it completely autonomously.
            </p>
          </div>
          <Badge className="bg-violet-500 hover:bg-violet-600">Beta</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 md:items-start">
          
          {/* Left Panel: Prompt Input (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <Card className="border-violet-500/20 bg-card/60 backdrop-blur-sm shadow-[0_0_30px_rgba(139,92,246,0.05)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span>Chat with Agent</span>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                  </span>
                </CardTitle>
                <CardDescription>
                  Tell the AI what kind of campaign you want to run.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Launch a 3-step cold outreach for SaaS founders about our new AI engine. Make the tone friendly but urgent."
                  className="min-h-[160px] resize-none focus-visible:ring-violet-500/50 bg-background/50 border-border/50 text-[15px] leading-relaxed"
                  disabled={isLaunching || campaignResult}
                />
                
                <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/50 p-3 rounded-lg border border-border/50">
                  <span>💡</span> 
                  <p><strong>Audience Filter:</strong> The agent will automatically search your uploaded leads to find matching roles or companies.</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {campaignResult ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      setCampaignResult(null);
                      setAgentLogs([]);
                      setPrompt("");
                    }}
                  >
                    🔄 Run Another Campaign
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-lg gap-2 relative overflow-hidden group shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                    onClick={handleLaunch}
                    disabled={isLaunching || !prompt.trim()}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isLaunching ? "Agent Working..." : "🚀 Launch Agent"}
                  </Button>
                )}
                
                <div className="w-full text-center text-xs text-muted-foreground font-medium">
                  Currently {totalLeads} leads in database ready for outreach.
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Right Panel: Thinking Log & Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Thinking Terminal */}
            <Card className="border-border/50 bg-[#0c0c0e] text-slate-300 shadow-xl overflow-hidden font-mono text-sm relative">
              <div className="bg-[#1a1b1e] border-b border-white/5 py-2 px-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-xs text-slate-500 font-medium tracking-wider">agent-terminal ~ /bin/bash</div>
              </div>
              
              <div className="p-6 h-[250px] overflow-y-auto space-y-3 custom-scrollbar relative">
                {agentLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                    <span className="text-4xl mb-3">🤖</span>
                    <p>Agent is resting. Submit a prompt to wake it up.</p>
                  </div>
                ) : (
                  agentLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start animate-in fade-in zoom-in-95 duration-300">
                      <div className="mt-0.5 shrink-0">
                        {log.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>}
                        {log.status === "success" && <span className="text-green-500 text-base leading-none">✓</span>}
                        {log.status === "error" && <span className="text-red-500 text-base leading-none">✕</span>}
                      </div>
                      <div className={`flex-1 ${log.status === "success" ? "text-slate-300" : log.status === "error" ? "text-red-400" : "text-violet-300"}`}>
                        {log.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </Card>

            {/* Campaign Summary Widget (Shows after completion) */}
            {campaignResult && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                <Card className="border-border/50 bg-card shadow-lg overflow-hidden border-t-4 border-t-green-500">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl mb-1">{campaignResult.campaignName}</CardTitle>
                        <CardDescription>Autonomously generated & launched by AI</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 px-3 py-1">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-2xl font-bold">{campaignResult.leadsTargeted}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase mt-1 tracking-wider">Leads Assigned</div>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-2xl font-bold">{campaignResult.workflowSteps}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase mt-1 tracking-wider">Nodes Built</div>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50 text-center">
                        <div className="text-2xl font-bold">{campaignResult.emails.length}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase mt-1 tracking-wider">Emails Written</div>
                      </div>
                    </div>

                    {/* Email Previews */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Generated Copy Sequence</h4>
                      {campaignResult.emails.map((email, i) => (
                        <div key={i} className="border border-border/60 rounded-lg overflow-hidden flex flex-col">
                          <div className="bg-muted/50 px-4 py-2 text-sm font-medium border-b border-border/60 flex items-center justify-between">
                            <span>Step {i + 1} Email</span>
                            <span className="text-xs text-muted-foreground font-mono">Subject: {email.subject}</span>
                          </div>
                          <div className="p-4 bg-background text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {email.body.replace(/<[^>]+>/g, '')}
                          </div>
                        </div>
                      ))}
                    </div>

                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t border-border/50 p-4 flex justify-end">
                    <Link href="/dashboard">
                      <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
                        <span>📊</span> View in Dashboard
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            )}
            
          </div>

        </div>
      </main>
    </div>
  );
}

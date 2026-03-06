"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const STORAGE_KEY = "agent_state";

/**
 * Autonomous Campaign Agent + Live Execution Console
 * Full sessionStorage persistence for cross-page navigation.
 */
export default function AgentPage() {
  const [prompt, setPrompt] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);

  // Agent thinking state
  const [agentLogs, setAgentLogs] = useState([]);
  const [campaignResult, setCampaignResult] = useState(null);
  const [error, setError] = useState(null);

  // Execution state
  const [phase, setPhase] = useState("idle"); // idle | thinking | executing | complete
  const [execLogs, setExecLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [completedLeads, setCompletedLeads] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(3000);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [resumeBanner, setResumeBanner] = useState(null);

  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const logEndRef = useRef(null);
  const execLogEndRef = useRef(null);
  const campaignIdRef = useRef(null);
  const workflowIdRef = useRef(null);
  const isRestoredRef = useRef(false);

  // -- LAYER 1: Save state to sessionStorage on every meaningful change --
  useEffect(() => {
    if (!campaignIdRef.current || phase === "idle" || phase === "thinking") return;
    const stateToSave = {
      campaignId: campaignIdRef.current,
      workflowId: workflowIdRef.current,
      campaignResult,
      execLogs,
      progress,
      completedLeads,
      totalProcessed,
      elapsedTime,
      speed,
      phase,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) { /* quota exceeded — ignore */ }
  }, [execLogs, progress, phase, speed, completedLeads, totalProcessed, elapsedTime, campaignResult]);

  // -- LAYER 2: Restore state on mount --
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      if (!state.campaignId) return;

      // Restore everything
      campaignIdRef.current = state.campaignId;
      workflowIdRef.current = state.workflowId;
      setCampaignResult(state.campaignResult);
      setExecLogs(state.execLogs || []);
      setProgress(state.progress || 0);
      setCompletedLeads(state.completedLeads || 0);
      setTotalProcessed(state.totalProcessed || 0);
      setElapsedTime(state.elapsedTime || 0);
      setSpeed(state.speed || 3000);

      if (state.phase === "complete" || state.progress >= 100) {
        setPhase("complete");
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        setPhase("executing");
        isRestoredRef.current = true;
        setResumeBanner(`↩️ Resumed from where you left off — Campaign was at ${state.progress}%`);
        setTimeout(() => setResumeBanner(null), 4000);
        // Auto-resume after a short delay so UI renders first
        setTimeout(() => startExecutionDirect(state.campaignId, state.speed || 3000), 600);
      }
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Auto-scroll
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [agentLogs]);
  useEffect(() => { execLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [execLogs]);

  // Fetch lead count on load
  useEffect(() => {
    fetch("/api/leads").then(r => r.json()).then(d => { if (d.success) setTotalLeads(d.data.length); }).catch(() => {});
  }, []);

  // Elapsed time counter
  useEffect(() => {
    if (phase === "executing" && isRunning) {
      if (!startTime) setStartTime(Date.now());
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const addLog = (text, status = "pending") => {
    const id = Date.now() + Math.random();
    setAgentLogs(prev => [...prev, { id, text, status }]);
    return id;
  };

  const updateLogStatus = (id, status, newText = null) => {
    setAgentLogs(prev => prev.map(log => log.id === id ? { ...log, status, text: newText || log.text } : log));
  };

  // --- EXECUTION ENGINE (direct version for restore, avoids stale closure) ---
  const startExecutionDirect = (cId, spd) => {
    setIsRunning(true);
    if (!startTime) setStartTime(Date.now());

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/campaigns/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: cId })
        });
        const data = await res.json();

        if (data.success && data.data) {
          if (data.data.logs && data.data.logs.length > 0) {
            const newLogs = data.data.logs.map(log => ({
              id: Date.now() + Math.random(),
              leadName: log.leadName,
              company: log.company || "Unknown",
              action: log.action,
              nodeType: log.nodeType,
              logType: log.logType || "info",
              time: new Date().toLocaleTimeString()
            }));
            setExecLogs(prev => [...prev, ...newLogs]);
          }
          setProgress(data.progress || 0);
          setCompletedLeads(data.completed || 0);
          setTotalProcessed(data.total || 0);

          if (data.progress >= 100) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setPhase("complete");
            sessionStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error("Execution step error:", err);
      }
    }, spd);
  };

  const startExecution = useCallback((cId) => {
    startExecutionDirect(cId || campaignIdRef.current, speed);
  }, [speed]);

  const pauseExecution = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resumeExecution = () => {
    startExecution(campaignIdRef.current);
  };

  // Speed change restarts interval
  useEffect(() => {
    if (isRunning && phase === "executing" && !isRestoredRef.current) {
      clearInterval(intervalRef.current);
      startExecutionDirect(campaignIdRef.current, speed);
    }
    isRestoredRef.current = false;
  }, [speed]);

  // -- LAYER 5: Pause + save before navigating to /workflows --
  const handleEditLiveWorkflow = () => {
    pauseExecution();
    // Force-save current state with paused flag
    const stateToSave = {
      campaignId: campaignIdRef.current,
      workflowId: workflowIdRef.current,
      campaignResult,
      execLogs,
      progress,
      completedLeads,
      totalProcessed,
      elapsedTime,
      speed,
      phase: "executing",
      isPaused: true,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    window.location.href = `/workflows?load=${workflowIdRef.current}&campaignId=${campaignIdRef.current}`;
  };

  // --- MAIN LAUNCH ---
  const handleLaunch = async () => {
    if (!prompt.trim() || isLaunching) return;
    setIsLaunching(true);
    setAgentLogs([]);
    setCampaignResult(null);
    setExecLogs([]);
    setError(null);
    setPhase("thinking");
    setProgress(0);
    setElapsedTime(0);
    setStartTime(null);

    const intentLogId = addLog("🔍 Understanding your campaign goal...", "pending");

    try {
      const responsePromise = fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      await new Promise(r => setTimeout(r, 1200));
      updateLogStatus(intentLogId, "success");

      const scanLogId = addLog("👥 Scanning leads database...", "pending");
      await new Promise(r => setTimeout(r, 1500));

      const response = await responsePromise;
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Agent encountered an error.");

      updateLogStatus(scanLogId, "success", `👥 Found ${data.leadsTargeted} matching leads for campaign`);

      const planLogId = addLog("🗺️ Planning workflow structure...", "pending");
      await new Promise(r => setTimeout(r, 1000));
      updateLogStatus(planLogId, "success");

      for (let i = 0; i < data.emails.length; i++) {
        const wId = addLog(`✍️ Writing Email ${i + 1} of ${data.emails.length}...`, "pending");
        await new Promise(r => setTimeout(r, 800));
        updateLogStatus(wId, "success");
      }

      const buildLogId = addLog("⚡ Building workflow nodes and edges...", "pending");
      await new Promise(r => setTimeout(r, 700));
      updateLogStatus(buildLogId, "success");

      const saveLogId = addLog("💾 Saving workflow to database...", "pending");
      await new Promise(r => setTimeout(r, 600));
      updateLogStatus(saveLogId, "success");

      const createLogId = addLog(`🚀 Campaign created — ${data.leadsTargeted} leads assigned`, "pending");
      await new Promise(r => setTimeout(r, 600));
      updateLogStatus(createLogId, "success");

      // Start campaign using existing start API
      const startRes = await fetch("/api/campaigns/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: data.workflowId, name: data.campaignName })
      });
      const startData = await startRes.json();

      const engineLogId = addLog("🚀 Starting execution engine...", "pending");
      await new Promise(r => setTimeout(r, 800));
      updateLogStatus(engineLogId, "success");

      const autoLogId = addLog("⚡ Auto-running campaign...", "pending");
      await new Promise(r => setTimeout(r, 600));
      updateLogStatus(autoLogId, "success");

      const activeCampaignId = startData.success ? startData.data.id : data.campaignId;
      campaignIdRef.current = activeCampaignId;
      workflowIdRef.current = data.workflowId;

      setCampaignResult(data);
      setPhase("executing");
      setIsLaunching(false);
      startExecution(activeCampaignId);

    } catch (err) {
      console.error(err);
      setError(err.message);
      addLog(`❌ Fatal Error: ${err.message}`, "error");
      setIsLaunching(false);
    }
  };

  // -- LAYER 4: Clear on reset --
  const resetPage = () => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    sessionStorage.removeItem(STORAGE_KEY);
    setPrompt(""); setAgentLogs([]); setCampaignResult(null); setExecLogs([]); setError(null);
    setPhase("idle"); setProgress(0); setElapsedTime(0); setStartTime(null); setIsRunning(false);
    campaignIdRef.current = null; workflowIdRef.current = null;
  };

  // Rich log entry renderer
  const renderLogEntry = (log) => {
    const t = log.logType || 'info';
    
    if (t === 'sent') {
      return (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-base shrink-0 mt-0.5">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{log.leadName} ({log.company})</p>
            <p className="text-xs text-green-500/80 mt-0.5">{log.action}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
        </div>
      );
    }

    if (t === 'blocked') {
      return (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-base shrink-0 mt-0.5">🚫</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{log.leadName} ({log.company})</p>
            <p className="text-xs text-red-500/80 mt-0.5">{log.action}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
        </div>
      );
    }

    if (t === 'waiting') {
      return (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-base shrink-0 mt-0.5">⏳</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{log.leadName} ({log.company})</p>
            <p className="text-xs text-amber-500/80 mt-0.5">{log.action}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
        </div>
      );
    }

    if (t === 'completed') {
      return (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-base shrink-0 mt-0.5">🏁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{log.leadName} ({log.company})</p>
            <p className="text-xs text-purple-500/80 mt-0.5">{log.action}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
        </div>
      );
    }

    if (t === 'condition') {
      return (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-base shrink-0 mt-0.5">🔀</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{log.leadName} ({log.company})</p>
            <p className="text-xs text-orange-500/80 mt-0.5">{log.action}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
        </div>
      );
    }

    // Default: start, info
    return (
      <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="text-base shrink-0 mt-0.5">{t === 'start' ? '▶️' : '🔄'}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-blue-500">{log.leadName} ({log.company})</span>
          <span className="text-sm text-muted-foreground"> — {log.action}</span>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">Autonomous Campaign Agent</h1>
            <p className="mt-2 text-muted-foreground">One prompt. Fully autonomous. Live editable.</p>
          </div>
          <Badge className="bg-violet-500 hover:bg-violet-600">Beta</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 md:items-start">

          {/* Left Panel: Prompt Input */}
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
                <CardDescription>Tell the AI what kind of campaign you want to run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. Launch a 3-step cold outreach for SaaS founders about our new AI engine. Make the tone friendly but urgent.'
                  className="min-h-[160px] resize-none focus-visible:ring-violet-500/50 bg-background/50 border-border/50 text-[15px] leading-relaxed"
                  disabled={phase !== "idle"}
                />
                <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/50 p-3 rounded-lg border border-border/50">
                  <span>💡</span>
                  <p><strong>Audience Filter:</strong> The agent will automatically search your uploaded leads to find matching roles or companies.</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {phase === "idle" ? (
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-lg gap-2 relative overflow-hidden group shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                    onClick={handleLaunch}
                    disabled={isLaunching || !prompt.trim()}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isLaunching ? "Agent Working..." : "🚀 Launch Agent"}
                  </Button>
                ) : phase === "complete" ? (
                  <Button className="w-full" variant="outline" onClick={resetPage}>🤖 Run Another Campaign</Button>
                ) : null}
                <div className="w-full text-center text-xs text-muted-foreground font-medium">
                  Currently {totalLeads} leads in database ready for outreach.
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 space-y-6">

            {/* Resume Banner */}
            {resumeBanner && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>↩️</span> {resumeBanner}
              </div>
            )}

            {/* Thinking Terminal */}
            {(phase === "thinking" || (phase !== "idle" && agentLogs.length > 0)) && (
              <Card className={`border-border/50 bg-[#0c0c0e] text-slate-300 shadow-xl overflow-hidden font-mono text-sm relative transition-all duration-500 ${phase !== "thinking" ? "max-h-[140px]" : ""}`}>
                <div className="bg-[#1a1b1e] border-b border-white/5 py-2 px-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto text-xs text-slate-500 font-medium tracking-wider">agent-planner</div>
                </div>
                <div className={`p-4 overflow-y-auto space-y-2 custom-scrollbar ${phase === "thinking" ? "h-[250px]" : "h-[80px]"}`}>
                  {agentLogs.map((log) => (
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
                  ))}
                  <div ref={logEndRef} />
                </div>
              </Card>
            )}

            {/* LIVE EXECUTION CONSOLE */}
            {(phase === "executing") && (campaignResult || isRestoredRef.current || execLogs.length > 0) && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both space-y-4">
                <Card className="border-border/50 bg-card shadow-lg overflow-hidden border-t-4 border-t-blue-500">
                  {/* Header */}
                  <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        🚀 Campaign Live {campaignResult ? `— ${campaignResult.campaignName}` : ""}
                        {isRunning && <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaignResult?.leadsTargeted || totalProcessed} leads targeted • {elapsedTime}s elapsed
                      </p>
                    </div>
                    <Badge variant="outline" className={isRunning ? "border-green-500/50 text-green-600 bg-green-500/10" : "border-amber-500/50 text-amber-600 bg-amber-500/10"}>
                      {isRunning ? "Running" : "Paused"}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="px-6 py-4 border-b border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="text-xs text-muted-foreground text-center pt-1.5">
                      {completedLeads} of {totalProcessed} leads completed
                    </div>
                  </div>

                  {/* Live Feed */}
                  <div className="px-6 py-3 border-b border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Execution Feed</h4>
                    <div className="h-[300px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                      {execLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                          <span className="text-3xl mb-2">⏳</span>
                          <p className="text-sm">Waiting for first execution tick...</p>
                        </div>
                      ) : (
                        execLogs.map((log) => renderLogEntry(log))
                      )}
                      <div ref={execLogEndRef} />
                    </div>
                  </div>

                  {/* Speed Control */}
                  <div className="px-6 py-3 border-b border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tick Speed</h4>
                    <div className="flex gap-2">
                      {[{ label: "1s", value: 1000 }, { label: "3s", value: 3000 }, { label: "5s", value: 5000 }].map(opt => (
                        <Button key={opt.value} size="sm" variant={speed === opt.value ? "default" : "outline"}
                          className={`flex-1 text-sm ${speed === opt.value ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                          onClick={() => setSpeed(opt.value)}>{opt.label}</Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2 flex-1" onClick={isRunning ? pauseExecution : resumeExecution}>
                      {isRunning ? "⏸ Pause" : "▶️ Resume"}
                    </Button>
                    <Button variant="outline" className="gap-2 flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400" onClick={handleEditLiveWorkflow}>
                      ✏️ Edit Live Workflow
                    </Button>
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="outline" className="gap-2 w-full">📊 View Dashboard</Button>
                    </Link>
                  </div>
                </Card>
              </div>
            )}

            {/* COMPLETION CARD */}
            {phase === "complete" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                <Card className="border-border/50 bg-card shadow-lg overflow-hidden border-t-4 border-t-green-500">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="text-5xl mb-2">🎉</div>
                    <h2 className="text-2xl font-bold">Campaign Complete!</h2>
                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                        <div className="text-2xl font-bold text-green-600">{totalProcessed}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase mt-1 tracking-wider">Leads Processed</div>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                        <div className="text-2xl font-bold text-blue-600">{execLogs.filter(l => l.nodeType === "sendEmail" || l.nodeType === "sendFollowup").length}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase mt-1 tracking-wider">Emails Sent</div>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                        <div className="text-2xl font-bold text-purple-600">{elapsedTime}s</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase mt-1 tracking-wider">Time Elapsed</div>
                      </div>
                    </div>
                    {campaignResult && campaignResult.emails && (
                      <div className="space-y-3 text-left max-w-lg mx-auto">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-center">Generated Copy Sequence</h4>
                        {campaignResult.emails.map((email, i) => (
                          <div key={i} className="border border-border/60 rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 text-sm font-medium border-b border-border/60 flex items-center justify-between">
                              <span>Step {i + 1}</span>
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{email.subject}</span>
                            </div>
                            <div className="p-3 bg-background text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-3">
                              {email.body.replace(/<[^>]+>/g, '')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 justify-center pt-2">
                      <Link href="/dashboard">
                        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">📊 View Full Dashboard</Button>
                      </Link>
                      <Button variant="outline" className="gap-2" onClick={resetPage}>🤖 Run Another Campaign</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Idle State */}
            {phase === "idle" && (
              <Card className="border-border/50 bg-[#0c0c0e] text-slate-300 shadow-xl overflow-hidden font-mono text-sm">
                <div className="bg-[#1a1b1e] border-b border-white/5 py-2 px-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto text-xs text-slate-500 font-medium tracking-wider">agent-terminal</div>
                </div>
                <div className="p-6 h-[250px] flex flex-col items-center justify-center text-slate-600 opacity-60">
                  <span className="text-4xl mb-3">🤖</span>
                  <p>Agent is resting. Submit a prompt to wake it up.</p>
                </div>
              </Card>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

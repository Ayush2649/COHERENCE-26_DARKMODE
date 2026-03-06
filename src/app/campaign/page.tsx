"use client";

/**
 * Campaign Simulator Page - MVC: View
 * Create campaign from workflow, start with leads, advance steps, inspect logs.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CampaignPage() {
  const [workflows, setWorkflows] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string; email: string; currentStep: string | null; status: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: number; workflowId: number; status: string }[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);
  const [logs, setLogs] = useState<{ id: number; leadId: number; message: string | null; sentAt: string }[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.ok) setWorkflows(data.workflows ?? []);
    } catch {
      setMessage({ type: "err", text: "Failed to load workflows" });
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.ok) setLeads(data.leads ?? []);
    } catch {
      setMessage({ type: "err", text: "Failed to load leads" });
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.ok) setCampaigns(data.campaigns ?? []);
    } catch {
      setMessage({ type: "err", text: "Failed to load campaigns" });
    }
  }, []);

  const createCampaign = useCallback(async () => {
    if (selectedWorkflowId == null) {
      setMessage({ type: "err", text: "Select a workflow first" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: selectedWorkflowId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Failed to create campaign" });
        return;
      }
      setMessage({ type: "ok", text: "Campaign created." });
      setCurrentCampaignId(data.campaign?.id ?? null);
      loadCampaigns();
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  }, [selectedWorkflowId, loadCampaigns]);

  const startCampaign = useCallback(async () => {
    if (currentCampaignId == null) {
      setMessage({ type: "err", text: "Create or select a campaign first" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const body = selectedLeadIds.size > 0 ? { leadIds: Array.from(selectedLeadIds) } : {};
      const res = await fetch(`/api/campaigns/${currentCampaignId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Failed to start" });
        return;
      }
      setMessage({ type: "ok", text: data.message ?? "Campaign advanced." });
      loadLeads();
      loadCampaigns();
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  }, [currentCampaignId, selectedLeadIds, loadLeads, loadCampaigns]);

  const loadLogs = useCallback(async () => {
    if (currentCampaignId == null) return;
    try {
      const res = await fetch(`/api/campaigns/${currentCampaignId}/logs`);
      const data = await res.json();
      if (data.ok) setLogs(data.logs ?? []);
    } catch {
      setMessage({ type: "err", text: "Failed to load logs" });
    }
  }, [currentCampaignId]);

  const toggleLead = (leadId: number) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Home</Link>
        </Button>
        <h1 className="text-2xl font-bold">Campaign Simulator</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Create a campaign from a workflow, assign leads, then Start / Advance to run workflow steps. Inspect logs to see sent messages.
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === "ok" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <section className="p-4 rounded-lg border border-border">
          <h2 className="font-semibold mb-2">1. Workflow & Campaign</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={loadWorkflows}>
              Load workflows
            </Button>
            {workflows.length > 0 && (
              <select
                className="h-9 px-2 rounded-md border border-input bg-background text-sm"
                value={selectedWorkflowId ?? ""}
                onChange={(e) => setSelectedWorkflowId(e.target.value ? parseInt(e.target.value, 10) : null)}
              >
                <option value="">Select workflow</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (#{w.id})
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" onClick={createCampaign} disabled={loading || selectedWorkflowId == null}>
              Create campaign
            </Button>
          </div>
        </section>

        <section className="p-4 rounded-lg border border-border">
          <h2 className="font-semibold mb-2">2. Leads (optional: select specific leads; otherwise all &quot;new&quot;)</h2>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <Button variant="outline" size="sm" onClick={loadLeads}>
              Load leads
            </Button>
          </div>
          {leads.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
              {leads.map((l) => (
                <label key={l.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.has(l.id)}
                    onChange={() => toggleLead(l.id)}
                  />
                  <span>{l.name} ({l.email})</span>
                  <span className="text-muted-foreground">— {l.currentStep ?? "—"} / {l.status}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="p-4 rounded-lg border border-border">
          <h2 className="font-semibold mb-2">3. Start / Advance campaign</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={loadCampaigns}>
              Load campaigns
            </Button>
            {campaigns.length > 0 && (
              <select
                className="h-9 px-2 rounded-md border border-input bg-background text-sm"
                value={currentCampaignId ?? ""}
                onChange={(e) => setCurrentCampaignId(e.target.value ? parseInt(e.target.value, 10) : null)}
              >
                <option value="">Select campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    Campaign #{c.id} (workflow {c.workflowId}) — {c.status}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" onClick={startCampaign} disabled={loading || currentCampaignId == null}>
              {loading ? "Running…" : "Start / Advance step"}
            </Button>
          </div>
        </section>

        <section className="p-4 rounded-lg border border-border">
          <h2 className="font-semibold mb-2">4. Inspect logs</h2>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={currentCampaignId == null} className="mb-2">
            Load campaign logs
          </Button>
          {logs.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-muted/30 text-sm">
                  <span className="text-muted-foreground">Lead #{log.leadId} · {log.sentAt}</span>
                  <pre className="mt-1 whitespace-pre-wrap font-sans">{log.message ?? ""}</pre>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

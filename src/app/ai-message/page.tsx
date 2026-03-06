"use client";

/**
 * AI Message Generator Page - MVC: View
 * User enters: Prompt, Role, Campaign Context; optional Lead Data for personalization.
 * Calls OpenAI via /api/ai/generate and displays the generated message.
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AIMessagePage() {
  const [prompt, setPrompt] = useState("Write a friendly cold outreach email.");
  const [role, setRole] = useState("Sales Manager");
  const [campaignContext, setCampaignContext] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerated(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          role: role.trim(),
          campaignContext: campaignContext.trim() || undefined,
          leadData:
            leadName || leadCompany || leadRole
              ? { name: leadName.trim() || undefined, company: leadCompany.trim() || undefined, role: leadRole.trim() || undefined }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      setGenerated(data.message ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Home</Link>
        </Button>
        <h1 className="text-2xl font-bold">AI Message Generator</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Enter a prompt, your role, and optional campaign/lead context. The AI will generate an outreach message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="e.g. Write a friendly cold outreach email."
            required
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="e.g. Sales Manager"
            required
          />
        </div>
        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-1">
            Campaign context (optional)
          </label>
          <textarea
            id="context"
            value={campaignContext}
            onChange={(e) => setCampaignContext(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="e.g. B2B SaaS launch, targeting tech leads"
          />
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-sm font-medium mb-2">Lead data (optional – for personalization)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Name"
            />
            <input
              type="text"
              value={leadCompany}
              onChange={(e) => setLeadCompany(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Company"
            />
            <input
              type="text"
              value={leadRole}
              onChange={(e) => setLeadRole(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Role"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Generating…" : "Generate message"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {generated && (
        <div className="mt-6 p-4 rounded-lg border border-border bg-muted/20">
          <p className="text-sm font-medium text-muted-foreground mb-2">Generated message</p>
          <pre className="whitespace-pre-wrap text-sm font-sans">{generated}</pre>
        </div>
      )}
    </main>
  );
}

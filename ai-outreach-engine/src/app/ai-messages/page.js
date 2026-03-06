"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * AI Message Generator Page
 * 
 * Allows users to write a prompt template with variables {{name}}, {{company}}, {{role}}
 * Select a sample lead from the database
 * Generate a personalized email subject and body using the OpenAI API
 */
export default function AIMessagesPage() {
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  
  const [promptTemplate, setPromptTemplate] = useState(
    "Write a friendly, brief cold email to {{name}} who is the {{role}} at {{company}}. Mention that we loved their recent product launch and want to show how our AI engine can help them scale their sales team's productivity."
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [error, setError] = useState("");

  // Fetch sample leads on load
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setLeads(data.data.slice(0, 5)); // Just take first 5 for testing
          setSelectedLeadId(data.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch leads", err);
      }
    };
    fetchLeads();
  }, []);

  const handleGenerate = async () => {
    if (!promptTemplate.trim() || !selectedLeadId) return;

    setIsGenerating(true);
    setError("");
    setGeneratedMessage(null);

    const lead = leads.find(l => l.id === selectedLeadId);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptTemplate,
          lead
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedMessage(data.data);
      } else {
        throw new Error(data.error || "Failed to generate message");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Message Generator</h1>
            <p className="mt-2 text-muted-foreground">
              Design your prompt templates and test AI personalization before launching campaigns.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary px-3 py-1 font-medium">
              OpenAI GPT-4o-mini
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Left Column: Prompt Configuration */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Prompt Designer</CardTitle>
                <CardDescription>
                  Write instructions for the AI. Use variables that will be replaced during the campaign.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="font-mono cursor-pointer hover:bg-primary/20" onClick={() => setPromptTemplate(p => p + " {{name}}")}>{"{{name}}"}</Badge>
                  <Badge variant="secondary" className="font-mono cursor-pointer hover:bg-primary/20" onClick={() => setPromptTemplate(p => p + " {{company}}")}>{"{{company}}"}</Badge>
                  <Badge variant="secondary" className="font-mono cursor-pointer hover:bg-primary/20" onClick={() => setPromptTemplate(p => p + " {{role}}")}>{"{{role}}"}</Badge>
                </div>
                
                <Textarea 
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="min-h-[200px] font-medium resize-y bg-background"
                  placeholder="E.g., Write a cold email to {{name}} at {{company}}..."
                />

                <div className="pt-4 border-t border-border/50">
                  <label className="text-sm font-medium mb-2 block">Test with Lead:</label>
                  {leads.length > 0 ? (
                    <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select a lead to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} • {lead.role} at {lead.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded border border-border">
                      No leads found. Please upload leads in Step 3 first.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !selectedLeadId || !promptTemplate}
                  className="w-full gap-2 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {isGenerating ? (
                    <span className="animate-pulse">🧠 Generating...</span>
                  ) : (
                    <span>✨ Generate Email Preview</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Generation Preview */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm h-full flex flex-col">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Output Preview</span>
                  {generatedMessage?.isMock && (
                    <Badge variant="destructive" className="text-xs">Mock Mode (No API Key)</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  This is exactly what {selectedLead?.name || "the lead"} will receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                
                {isGenerating ? (
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-[60px]" />
                       <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-[60px]" />
                       <div className="space-y-3 pt-2">
                         <Skeleton className="h-4 w-[80%]" />
                         <Skeleton className="h-4 w-[90%]" />
                         <Skeleton className="h-4 w-[75%]" />
                         <Skeleton className="h-4 w-[85%]" />
                         <Skeleton className="h-4 w-[60%]" />
                       </div>
                    </div>
                  </div>
                ) : generatedMessage ? (
                  <div className="flex flex-col h-full">
                    {/* Subject Line */}
                    <div className="border-b border-border/50 p-6 bg-card">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject</div>
                      <div className="text-lg font-medium">{generatedMessage.subject}</div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="p-6 overflow-y-auto flex-1 bg-background text-[15px] leading-relaxed">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message Body</div>
                      {/* Render HTML normally returned by AI safely (MVP) */}
                      <div 
                        dangerouslySetInnerHTML={{ __html: generatedMessage.body }} 
                        className="space-y-4"
                      />
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-6 h-full flex items-center justify-center">
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-70">
                    <span className="text-5xl mb-4">🪄</span>
                    <h3 className="text-lg font-medium text-foreground">Waiting for your prompt</h3>
                    <p className="text-sm max-w-xs mt-1">Select a lead, tweak the prompt, and click generate to see the AI magic.</p>
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

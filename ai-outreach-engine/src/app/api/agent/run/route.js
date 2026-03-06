/**
 * Autonomous Campaign Agent API Route
 * 
 * POST /api/agent/run
 * 
 * 1. Parses user prompt to JSON intent (GPT)
 * 2. Filters leads based on intent (SQLite)
 * 3. Plans workflow structure
 * 4. Writes N emails (GPT)
 * 5. Builds React Flow JSON graphs
 * 6. Saves Workflow and active Campaign to Database (SQLite)
 */
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

async function getModels() {
  const Lead = require("@/models/Lead");
  const Workflow = require("@/models/Workflow");
  const Campaign = require("@/models/Campaign");
  return { Lead, Workflow, Campaign };
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const { Lead, Workflow, Campaign } = await getModels();
    
    // Fallback Mock Mode (For Hackathon Judging without API Keys)
    const isMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy";

    // ----------------------------------------------------------------------
    // AGENT STEP 1 — Parse Intent
    // ----------------------------------------------------------------------
    let intent;
    if (isMock) {
      intent = {
        campaignName: "AI-Generated Fallback Demo",
        targetAudience: "founder saas ceo",
        numberOfSteps: 3,
        topic: "Exploring automated outreach possibilities",
        tone: "friendly"
      };
    } else {
      const intentCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a sales campaign planner. Extract structured intent from the user's campaign prompt.
Return ONLY valid JSON with no markdown, no backticks, no explanation. Format:
{
  "campaignName": "string",
  "targetAudience": "string (keywords to match against lead role/company fields)",
  "numberOfSteps": number (between 2 and 5),
  "topic": "string (what the outreach is about)",
  "tone": "professional | friendly | urgent"
}` 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
      intent = JSON.parse(intentCompletion.choices[0].message.content);
    }

    // Default bounds
    if (!intent.numberOfSteps || intent.numberOfSteps < 2) intent.numberOfSteps = 2;
    if (intent.numberOfSteps > 5) intent.numberOfSteps = 5;

    // ----------------------------------------------------------------------
    // AGENT STEP 2 — Filter Leads from DB
    // ----------------------------------------------------------------------
    const allLeads = Lead.findAll();
    let targetLeads = [];
    
    if (intent.targetAudience) {
      const keywords = intent.targetAudience.toLowerCase().split(' ').filter(w => w.length > 2);
      targetLeads = allLeads.filter(lead => {
        const role = (lead.role || "").toLowerCase();
        const company = (lead.company || "").toLowerCase();
        return keywords.some(kw => role.includes(kw) || company.includes(kw));
      });
    }

    // Fallback if filter is too narrow
    if (targetLeads.length < 3) {
      targetLeads = allLeads;
    }

    // ----------------------------------------------------------------------
    // AGENT STEP 3 — Plan Workflow
    // ----------------------------------------------------------------------
    const workflowPlan = [{ type: "start", label: "Start" }];
    
    let daysWait = 2;
    for (let i = 0; i < intent.numberOfSteps; i++) {
       workflowPlan.push({ type: "sendEmail", label: `Email ${i+1}`, emailIndex: i });
       if (i < intent.numberOfSteps - 1) {
         workflowPlan.push({ type: "wait", label: `Wait ${daysWait} Days`, days: daysWait });
         daysWait++; // 2 days, then 3 days, etc.
       }
    }
    workflowPlan.push({ type: "end", label: "End" });

    // ----------------------------------------------------------------------
    // AGENT STEP 4 — Write All Emails
    // ----------------------------------------------------------------------
    const emails = [];
    
    if (isMock) {
      for (let i = 0; i < intent.numberOfSteps; i++) {
        emails.push({
          subject: i === 0 ? "Quick question about {{company}}" : "Re: Quick question about {{company}}",
          body: `<p>Hi {{name}},</p><p>This is simulated email ${i+1} from the AI agent covering ${intent.topic}.</p><p>Hope to chat soon!</p>`
        });
      }
    } else {
      for (let i = 0; i < intent.numberOfSteps; i++) {
        const emailCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
             { 
               role: "system", 
               content: `You are an expert cold email copywriter. Write a short, personalized cold email.
Return ONLY valid JSON: { "subject": "string", "body": "string (plain text, max 150 words)" }
Use {{name}}, {{company}}, {{role}} as personalization variables.
This is email number ${i+1} of ${intent.numberOfSteps} in a sequence. 
Campaign topic: ${intent.topic}. Tone: ${intent.tone}.
Make each email in the sequence feel different — first is introduction, second is follow-up with value, third is final soft CTA.` 
             }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
        emails.push(JSON.parse(emailCompletion.choices[0].message.content));
      }
    }

    // ----------------------------------------------------------------------
    // AGENT STEP 5 — Build React Flow JSON
    // ----------------------------------------------------------------------
    const nodes = [];
    const edges = [];
    
    workflowPlan.forEach((step, index) => {
      const nodeId = `agent_node_${index}`;
      
      nodes.push({
        id: nodeId,
        type: step.type,
        position: { x: 250, y: index * 120 },
        data: { 
          label: step.label,
          ...(step.type === 'wait' && { duration: step.days, unit: "Days" }),
          ...(step.type === 'sendEmail' && { 
             subject: emails[step.emailIndex].subject, 
             body: emails[step.emailIndex].body 
          })
        }
      });

      if (index > 0) {
        const prevNodeId = `agent_node_${index - 1}`;
        edges.push({
          id: `e_${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          type: 'smoothstep',
          animated: true
        });
      }
    });

    // ----------------------------------------------------------------------
    // AGENT STEP 6 — Save to Database
    // ----------------------------------------------------------------------
    const workflowName = intent.campaignName || "AI Campaign Strategy";
    
    // Save workflow
    const newWorkflow = Workflow.create({
      name: workflowName,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges)
    });

    // Save and start campaign
    const newCampaign = Campaign.create({
      name: workflowName,
      workflowId: newWorkflow.id,
      status: "running"
    });

    // Attach target leads to the start node
    for (const lead of targetLeads) {
      Lead.update(lead.id, {
        status: 'contacted',
        currentStep: "agent_node_0" // Setup on start node
      });
    }

    // Return the summary back to the UI
    return NextResponse.json({
      success: true,
      campaignName: workflowName,
      leadsTargeted: targetLeads.length,
      workflowSteps: nodes.length,
      emails,
      workflowId: newWorkflow.id,
      campaignId: newCampaign.id
    });

  } catch (error) {
    console.error("Agent Run Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run agent" },
      { status: 500 }
    );
  }
}

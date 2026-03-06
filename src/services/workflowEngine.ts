/**
 * Workflow Engine - MVC: Service
 * Executes workflow steps for leads: move through nodes, generate/send email at sendEmail nodes,
 * wait at wait nodes, branch at condition, end at end node.
 */

import type { Workflow, WorkflowNode, WorkflowEdge } from "@/models/Workflow";
import type { Lead } from "@/models/Lead";
import { generateMessage } from "./aiService";
import { sendEmail } from "./emailService";
import * as EmailLog from "@/models/EmailLog";
import * as LeadModel from "@/models/Lead";

/** Default prompt/role for AI-generated emails when not provided by campaign */
const DEFAULT_PROMPT = "Write a friendly cold outreach email.";
const DEFAULT_ROLE = "Sales Manager";

/**
 * Get the start node id (first node of type "start", or first node).
 */
export function getStartNodeId(workflow: Workflow): string | null {
  const start = workflow.nodes.find((n) => n.type === "start");
  if (start) return start.id;
  return workflow.nodes[0]?.id ?? null;
}

/**
 * Get the next node id by following the edge from currentNodeId.
 * For condition nodes, sourceHandle "yes" or "no" can be used; we default to first edge.
 */
export function getNextNodeId(
  workflow: Workflow,
  currentNodeId: string,
  sourceHandle?: string | null
): string | null {
  const edge = workflow.edges.find(
    (e) => e.source === currentNodeId && (sourceHandle == null || e.sourceHandle === sourceHandle)
  );
  return edge?.target ?? null;
}

/**
 * Get node by id.
 */
export function getNode(workflow: Workflow, nodeId: string): WorkflowNode | undefined {
  return workflow.nodes.find((n) => n.id === nodeId);
}

/**
 * Execute one step for a lead: based on current node type, perform action and return next node id.
 * - start: move to next
 * - sendEmail / sendFollowUp: generate AI message, log to EmailLog (mock send), move to next
 * - wait: move to next (delay handled in Step 7 time simulation)
 * - condition: move to "yes" branch (MVP: no reply check)
 * - end: return null (lead done)
 */
export async function executeStep(
  workflow: Workflow,
  lead: Lead,
  campaignId: number,
  options?: { prompt?: string; role?: string; campaignContext?: string }
): Promise<{ nextNodeId: string | null; emailSent?: boolean }> {
  const nodeId = lead.currentStep;
  if (!nodeId) return { nextNodeId: null };

  const node = getNode(workflow, nodeId);
  if (!node) return { nextNodeId: null };

  const type = node.type ?? "default";

  switch (type) {
    case "start": {
      const next = getNextNodeId(workflow, nodeId);
      return { nextNodeId: next };
    }
    case "sendEmail":
    case "sendFollowUp": {
      const prompt = options?.prompt ?? DEFAULT_PROMPT;
      const role = options?.role ?? DEFAULT_ROLE;
      const message = await generateMessage({
        prompt,
        role,
        campaignContext: options?.campaignContext,
        leadData: { name: lead.name, company: lead.company ?? undefined, role: lead.role ?? undefined },
      });
      const subject = process.env.EMAIL_SUBJECT ?? "Quick outreach";
      const result = await sendEmail(lead.email, subject, message);
      const logStatus = result.sent ? "sent" : "failed";
      EmailLog.createEmailLog({ leadId: lead.id, campaignId, message, status: logStatus });
      LeadModel.updateLead(lead.id, { status: "contacted" });
      const next = getNextNodeId(workflow, nodeId);
      return { nextNodeId: next, emailSent: result.sent };
    }
    case "wait": {
      const next = getNextNodeId(workflow, nodeId);
      return { nextNodeId: next };
    }
    case "condition": {
      const next = getNextNodeId(workflow, nodeId, "yes");
      return { nextNodeId: next ?? getNextNodeId(workflow, nodeId) };
    }
    case "end":
      return { nextNodeId: null };
    default:
      const fallbackNext = getNextNodeId(workflow, nodeId);
      return { nextNodeId: fallbackNext };
  }
}

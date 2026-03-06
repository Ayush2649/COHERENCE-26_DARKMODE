/**
 * Campaign Engine Service
 * 
 * Handles the logic of moving leads through a workflow.
 * This simulates a job queue processor for our hackathon MVP.
 * 
 * Returns enriched log entries with `logType` for the live feed UI.
 * 
 * Key behaviours:
 * - Wait nodes enforce REAL durations (seconds, minutes, hours, days).
 * - Email nodes are processed ONE lead at a time per tick so the caller
 *   can insert a natural 2-second gap between sends.
 * - No demo mode — timing is always real.
 */
const Workflow = require("../models/Workflow");
const Lead = require("../models/Lead");
const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");
const SafetyService = require("./SafetyService");

/** Convert a duration + unit string to milliseconds */
function durationToMs(duration, unit) {
  const d = Number(duration) || 0;
  switch ((unit || "Days").toLowerCase()) {
    case "seconds": case "second": case "sec": case "s": return d * 1000;
    case "minutes": case "minute": case "min":           return d * 60_000;
    case "hours":   case "hour":   case "hr":            return d * 3_600_000;
    case "days":    case "day":                          return d * 86_400_000;
    default:                                             return d * 86_400_000;
  }
}

function generateMockEmail(lead, node) {
  // Use node-specific subject/body if available (from AI agent)
  if (node && node.data && node.data.subject) {
    return {
      subject: node.data.subject.replace(/\{\{name\}\}/g, lead.name || '').replace(/\{\{company\}\}/g, lead.company || '').replace(/\{\{role\}\}/g, lead.role || ''),
      body: (node.data.body || '').replace(/\{\{name\}\}/g, lead.name || '').replace(/\{\{company\}\}/g, lead.company || '').replace(/\{\{role\}\}/g, lead.role || '')
    };
  }
  return {
    subject: `Quick question regarding ${lead.company || 'your team'}`,
    body: `<p>Hi ${lead.name},</p><p>I noticed your work as ${lead.role || 'a leader'} at ${lead.company || 'your company'} and wanted to reach out.</p><p>Would you be open to a 5-minute chat next week?</p><p>Best,<br>Alex</p>`
  };
}

class CampaignEngine {
  /**
   * Initialize and start a campaign for all "new" leads.
   */
  static async startCampaign(workflowId, name) {
    const campaign = Campaign.create({ workflowId, name });
    
    const workflow = Workflow.findById(workflowId);
    if (!workflow) throw new Error("Workflow not found");
    
    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error("Workflow must have a Start node");

    const leads = Lead.findAll('new');
    for (const lead of leads) {
      Lead.update(lead.id, { 
        status: 'contacted', 
        currentStep: startNode.id,
        waitUntil: null
      });
    }

    return Campaign.update(campaign.id, { status: 'running', startTime: new Date().toISOString() });
  }

  /**
   * Process ONE tick of the campaign.
   * 
   * For email/followup nodes: processes only ONE lead per call so the
   * caller can add a natural 2-second gap between sends.
   * 
   * For all other nodes (start, wait, condition, end): processes ALL
   * leads in a single call.
   */
  static async processStep(campaignId) {
    const campaign = Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'running') return { logs: [] };

    // Re-read workflow from DB on every tick (so live edits apply)
    const workflow = Workflow.findById(campaign.workflowId);
    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const edges = typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;

    const allLeads = Lead.findAll();
    const activeLeads = allLeads.filter(l => l.currentStep && l.currentStep !== 'none' && l.status === 'contacted');

    const actionLogs = [];

    for (const lead of activeLeads) {
      const currentNode = nodes.find(n => n.id === lead.currentStep);
      if (!currentNode) continue;

      let nextNodeId = null;
      let logMessage = "";
      let logType = "info";
      let extraData = {};

      switch (currentNode.type) {
        case 'start': {
          const edge = edges.find(e => e.source === currentNode.id);
          if (edge) nextNodeId = edge.target;
          logMessage = `Started workflow`;
          logType = "start";
          break;
        }

        case 'sendEmail': {
          const emailData = generateMockEmail(lead, currentNode);
          
          const safetyCheck = SafetyService.checkSafety(lead.id, campaign.id, emailData.subject);
          if (!safetyCheck.safe) {
            // Duplicate — skip silently (don't show as blocked)
            const edge = edges.find(e => e.source === currentNode.id);
            if (edge) nextNodeId = edge.target;
            logMessage = `Skipped (duplicate)`;
            logType = "info";
            break;
          }

          EmailLog.create({
            leadId: lead.id,
            campaignId: campaign.id,
            subject: emailData.subject,
            message: emailData.body,
            status: 'sent'
          });
          
          const edge = edges.find(e => e.source === currentNode.id);
          if (edge) nextNodeId = edge.target;
          logMessage = `Email sent: "${emailData.subject}"`;
          logType = "sent";

          // After processing ONE email lead, push log and return immediately
          // so the caller can wait 2 seconds before the next send.
          if (nextNodeId && currentNode.type !== 'end') {
            Lead.update(lead.id, { currentStep: nextNodeId, waitUntil: null });
          }
          actionLogs.push({
            leadName: lead.name,
            company: lead.company,
            action: logMessage,
            nodeType: currentNode.type,
            logType,
            ...extraData
          });
          return { processedCount: 1, logs: actionLogs, needsDelay: true };
        }

        case 'wait': {
          const dur = (currentNode.data && currentNode.data.duration != null) ? currentNode.data.duration : 1;
          const unit = (currentNode.data && currentNode.data.unit) ? currentNode.data.unit : 'Days';
          const waitMs = durationToMs(dur, unit);

          // If lead doesn't have a waitUntil yet, set it now
          if (!lead.waitUntil) {
            const waitUntilTime = new Date(Date.now() + waitMs).toISOString();
            Lead.update(lead.id, { waitUntil: waitUntilTime });
            logMessage = `Waiting ${dur} ${unit}...`;
            logType = "waiting";
            extraData.remainingMs = waitMs;
            // Don't advance — lead stays on this node
            break;
          }

          // Check if wait has elapsed
          const waitUntilDate = new Date(lead.waitUntil);
          const remainingMs = waitUntilDate.getTime() - Date.now();

          if (remainingMs > 0) {
            // Still waiting
            logMessage = `Waiting... ${formatRemaining(remainingMs)} remaining`;
            logType = "waiting";
            extraData.remainingMs = remainingMs;
            break;
          }

          // Wait is over — advance to next node
          const edge = edges.find(e => e.source === currentNode.id);
          if (edge) nextNodeId = edge.target;
          logMessage = `Finished waiting (${dur} ${unit})`;
          logType = "waiting";
          // Clear waitUntil
          Lead.update(lead.id, { waitUntil: null });
          break;
        }
          
        case 'condition': {
          const didReply = Math.random() > 0.5;
          const handle = didReply ? 'yes' : 'no';
          
          const edge = edges.find(e => e.source === currentNode.id && e.sourceHandle === handle);
          if (edge) nextNodeId = edge.target;
          
          if (didReply) {
            Lead.update(lead.id, { status: 'replied' });
            logMessage = `Condition: Replied → Yes path`;
          } else {
            logMessage = `Condition: No Reply → No path`;
          }
          logType = "condition";
          break;
        }

        case 'sendFollowup': {
          const followupSubject = `Re: Quick question regarding ${lead.company}`;
          
          const safetyCheck = SafetyService.checkSafety(lead.id, campaign.id, followupSubject);
          if (!safetyCheck.safe) {
            const edge = edges.find(e => e.source === currentNode.id);
            if (edge) nextNodeId = edge.target;
            logMessage = `Skipped (duplicate)`;
            logType = "info";
            break;
          }

          EmailLog.create({
            leadId: lead.id,
            campaignId: campaign.id,
            subject: followupSubject,
            message: `<p>Hi ${lead.name},</p><p>Just following up on my last email!</p>`,
            status: 'sent'
          });
          
          const edge = edges.find(e => e.source === currentNode.id);
          if (edge) nextNodeId = edge.target;
          logMessage = `Follow-up sent`;
          logType = "sent";

          // Same one-at-a-time behaviour as sendEmail
          if (nextNodeId && currentNode.type !== 'end') {
            Lead.update(lead.id, { currentStep: nextNodeId, waitUntil: null });
          }
          actionLogs.push({
            leadName: lead.name,
            company: lead.company,
            action: logMessage,
            nodeType: currentNode.type,
            logType,
            ...extraData
          });
          return { processedCount: 1, logs: actionLogs, needsDelay: true };
        }

        case 'end': {
          Lead.update(lead.id, { currentStep: 'none', waitUntil: null });
          if (lead.status === 'contacted') {
             Lead.update(lead.id, { status: 'converted' });
          }
          logMessage = `Completed campaign`;
          logType = "completed";
          break;
        }
      }

      if (nextNodeId && currentNode.type !== 'end') {
        Lead.update(lead.id, { currentStep: nextNodeId, waitUntil: null });
      }

      actionLogs.push({
        leadName: lead.name,
        company: lead.company,
        action: logMessage,
        nodeType: currentNode.type,
        logType,
        ...extraData
      });
    }

    // Determine if there are leads ready to process on the NEXT tick
    // Re-read leads after processing to get updated state
    const updatedLeads = Lead.findAll();
    const stillActive = updatedLeads.filter(l => l.currentStep && l.currentStep !== 'none' && l.status === 'contacted');
    
    let hasReadyLeads = false;
    let nextReadyAt = null;

    for (const lead of stillActive) {
      const node = nodes.find(n => n.id === lead.currentStep);
      if (!node) continue;

      if (node.type === 'wait' && lead.waitUntil) {
        // Lead is waiting — check when it'll be ready
        const readyTime = new Date(lead.waitUntil).getTime();
        if (readyTime <= Date.now()) {
          hasReadyLeads = true; // wait already elapsed
        } else {
          // Track earliest future wait expiry
          if (!nextReadyAt || readyTime < nextReadyAt) {
            nextReadyAt = readyTime;
          }
        }
      } else {
        // Lead on a non-wait node = ready to process now
        hasReadyLeads = true;
      }
    }

    return { 
      processedCount: activeLeads.length, 
      logs: actionLogs, 
      hasReadyLeads, 
      nextReadyAt 
    };
  }
}

/** Human-friendly remaining time string */
function formatRemaining(ms) {
  if (ms <= 0) return "0s";
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr < 24) return `${hr}h ${remMin}m`;
  const days = Math.floor(hr / 24);
  const remHr = hr % 24;
  return `${days}d ${remHr}h`;
}

module.exports = CampaignEngine;

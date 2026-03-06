/**
 * Campaign Engine Service
 * 
 * Handles the logic of moving leads through a workflow.
 * This simulates a job queue processor for our hackathon MVP.
 * 
 * Returns enriched log entries with `logType` for the live feed UI.
 */
const Workflow = require("../models/Workflow");
const Lead = require("../models/Lead");
const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");
const SafetyService = require("./SafetyService");

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
        currentStep: startNode.id 
      });
    }

    return Campaign.update(campaign.id, { status: 'running', startTime: new Date().toISOString() });
  }

  /**
   * Process ONE lead per call to enable one-by-one staggered feeding.
   * Returns enriched logs with `logType` for the live feed UI.
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
            logMessage = `Safety Blocked: ${safetyCheck.reason}`;
            logType = "blocked";
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
          break;
        }

        case 'wait': {
          const edge = edges.find(e => e.source === currentNode.id);
          if (edge) nextNodeId = edge.target;
          const dur = currentNode.data.duration || 1;
          const unit = currentNode.data.unit || 'Days';
          logMessage = `Finished waiting (${dur} ${unit})`;
          logType = "waiting";
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
            logMessage = `Safety Blocked: ${safetyCheck.reason}`;
            logType = "blocked";
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
          break;
        }

        case 'end': {
          Lead.update(lead.id, { currentStep: 'none' });
          if (lead.status === 'contacted') {
             Lead.update(lead.id, { status: 'converted' });
          }
          logMessage = `Completed campaign`;
          logType = "completed";
          break;
        }
      }

      if (nextNodeId && currentNode.type !== 'end') {
        Lead.update(lead.id, { currentStep: nextNodeId });
      }

      actionLogs.push({
        leadName: lead.name,
        company: lead.company,
        action: logMessage,
        nodeType: currentNode.type,
        logType
      });
    }

    return { processedCount: activeLeads.length, logs: actionLogs };
  }
}

module.exports = CampaignEngine;

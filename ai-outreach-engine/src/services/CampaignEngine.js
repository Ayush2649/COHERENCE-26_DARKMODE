/**
 * Campaign Engine Service
 * 
 * Handles the logic of moving leads through a workflow.
 * This simulates a job queue processor for our hackathon MVP.
 */
const Workflow = require("../models/Workflow");
const Lead = require("../models/Lead");
const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");
const SafetyService = require("./SafetyService");

// In a real app, we'd use the actual API, but for simulation we can just mimic it or call it directly.
// To keep things simple and fast for the simulator, we'll use a local mock for AI generation here,
// since calling the actual HTTP route from within the server is trickier and slower.
function generateMockEmail(lead) {
  return {
    subject: `Quick question regarding ${lead.company || 'your team'}`,
    body: `<p>Hi ${lead.name},</p><p>I noticed your work as ${lead.role || 'a leader'} at ${lead.company || 'your company'} and wanted to reach out.</p><p>Would you be open to a 5-minute chat next week?</p><p>Best,<br>Alex</p>`
  };
}

class CampaignEngine {
  /**
   * Initialize and start a campaign for all "new" leads.
   * Creates Campaign record and sets leads to Start node.
   */
  static async startCampaign(workflowId, name) {
    const campaign = Campaign.create({ workflowId, name });
    
    // Get workflow to find start node
    const workflow = Workflow.findById(workflowId);
    if (!workflow) throw new Error("Workflow not found");
    
    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error("Workflow must have a Start node");

    // Get all new leads and attach them to start node
    const leads = Lead.findAll('new');
    for (const lead of leads) {
      Lead.update(lead.id, { 
        status: 'contacted', 
        currentStep: startNode.id 
      });
    }

    // Update campaign status
    return Campaign.update(campaign.id, { status: 'running', startTime: new Date().toISOString() });
  }

  /**
   * Process a single step for all leads currently in the campaign.
   * Returns a log of actions taken.
   */
  static async processStep(campaignId) {
    const campaign = Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'running') return { logs: [] };

    const workflow = Workflow.findById(campaign.workflowId);
    const nodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
    const edges = typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;

    // We only process leads that are currently engaged (not new, not unsubscribed, not converted)
    // For MVP, we'll just query all leads and filter in memory since we lack a specific campaign_lead join table
    const allLeads = Lead.findAll();
    const activeLeads = allLeads.filter(l => l.currentStep && l.currentStep !== 'none' && l.status === 'contacted');

    const actionLogs = [];

    for (const lead of activeLeads) {
      const currentNode = nodes.find(n => n.id === lead.currentStep);
      if (!currentNode) continue;

      let nextNodeId = null;
      let logMessage = "";

      switch (currentNode.type) {
        case 'start':
          // Move to next node immediately
          const edgeAfterStart = edges.find(e => e.source === currentNode.id);
          if (edgeAfterStart) nextNodeId = edgeAfterStart.target;
          logMessage = `Started workflow`;
          break;

        case 'sendEmail':
          // Generate AI email and log it
          const emailData = generateMockEmail(lead);
          
          // SAFETY CHECK
          const safetyCheck = SafetyService.checkSafety(lead.id, campaign.id, emailData.subject);
          if (!safetyCheck.safe) {
            logMessage = `Safety Blocked: ${safetyCheck.reason}`;
            break; // Do not advance node, remain here until next tick
          }

          EmailLog.create({
            leadId: lead.id,
            campaignId: campaign.id,
            subject: emailData.subject,
            message: emailData.body,
            status: 'sent'
          });
          
          const edgeAfterEmail = edges.find(e => e.source === currentNode.id);
          if (edgeAfterEmail) nextNodeId = edgeAfterEmail.target;
          logMessage = `Sent Welcome Email: "${emailData.subject}"`;
          break;

        case 'wait':
          // In a real system, we'd check timestamps. For this manual step simulator, 
          // processing this step just bypasses the wait and moves forward.
          const edgeAfterWait = edges.find(e => e.source === currentNode.id);
          if (edgeAfterWait) nextNodeId = edgeAfterWait.target;
          logMessage = `Finished waiting (${currentNode.data.duration || 1} ${currentNode.data.unit || 'Days'})`;
          break;
          
        case 'condition':
          // Simulate 50/50 chance of reply for the hackathon
          const didReply = Math.random() > 0.5;
          const handle = didReply ? 'yes' : 'no';
          
          const edgeAfterCondition = edges.find(e => e.source === currentNode.id && e.sourceHandle === handle);
          if (edgeAfterCondition) nextNodeId = edgeAfterCondition.target;
          
          if (didReply) {
            Lead.update(lead.id, { status: 'replied' });
            logMessage = `Condition evaluated: Replied (Yes path)`;
          } else {
            logMessage = `Condition evaluated: No Reply (No path)`;
          }
          break;

        case 'sendFollowup':
          const followupSubject = `Re: Quick question regarding ${lead.company}`;
          
          // SAFETY CHECK
          const safetyCheckFollowup = SafetyService.checkSafety(lead.id, campaign.id, followupSubject);
          if (!safetyCheckFollowup.safe) {
            logMessage = `Safety Blocked: ${safetyCheckFollowup.reason}`;
            break; // Do not advance node
          }

          EmailLog.create({
            leadId: lead.id,
            campaignId: campaign.id,
            subject: followupSubject,
            message: `<p>Hi ${lead.name},</p><p>Just following up on my last email!</p>`,
            status: 'sent'
          });
          
          const edgeAfterFollowup = edges.find(e => e.source === currentNode.id);
          if (edgeAfterFollowup) nextNodeId = edgeAfterFollowup.target;
          logMessage = `Sent Follow-up Email`;
          break;

        case 'end':
          Lead.update(lead.id, { currentStep: 'none' });
          if (lead.status === 'contacted') {
             Lead.update(lead.id, { status: 'converted' }); // Auto-convert if they reached end without replying
          }
          logMessage = `Reached End of Workflow`;
          break;
      }

      if (nextNodeId && currentNode.type !== 'end') {
        Lead.update(lead.id, { currentStep: nextNodeId });
      }

      actionLogs.push({
        leadName: lead.name,
        company: lead.company,
        action: logMessage,
        nodeType: currentNode.type
      });
    }

    return { processedCount: activeLeads.length, logs: actionLogs };
  }
}

module.exports = CampaignEngine;

/**
 * Custom workflow node types for React Flow.
 * default: fallback for unknown/missing node types (e.g. from API).
 */
import { StartNode } from "./StartNode";
import { SendEmailNode } from "./SendEmailNode";
import { WaitNode } from "./WaitNode";
import { ConditionNode } from "./ConditionNode";
import { SendFollowUpNode } from "./SendFollowUpNode";
import { EndNode } from "./EndNode";
import { DefaultNode } from "./DefaultNode";

const VALID_NODE_TYPES = new Set(["start", "sendEmail", "wait", "condition", "sendFollowUp", "end"]);

export const workflowNodeTypes = {
  default: DefaultNode,
  start: StartNode,
  sendEmail: SendEmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  sendFollowUp: SendFollowUpNode,
  end: EndNode,
};

/** Normalize node from API so it has type, position, data (avoids React Flow errors). */
export function normalizeNode(n: { id: string; type?: string; position?: { x: number; y: number }; data?: Record<string, unknown> }) {
  const type = n.type && VALID_NODE_TYPES.has(n.type) ? n.type : "default";
  return {
    id: n.id,
    type,
    position: typeof n.position?.x === "number" && typeof n.position?.y === "number"
      ? n.position
      : { x: 0, y: 0 },
    data: n.data && typeof n.data === "object" ? n.data : { label: type },
  };
}

export type WorkflowNodeType = keyof typeof workflowNodeTypes;

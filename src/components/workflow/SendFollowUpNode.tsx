"use client";

/**
 * Workflow node: Send Follow-up - follow-up email.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";

export function SendFollowUpNode({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 min-w-[140px] text-center font-medium text-cyan-800 dark:text-cyan-200",
        selected && "ring-2 ring-cyan-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-cyan-500" />
      <span>Send Follow-up</span>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-cyan-500" />
    </div>
  );
}

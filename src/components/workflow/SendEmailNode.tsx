"use client";

/**
 * Workflow node: Send Email - first touch email.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";

export function SendEmailNode({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-blue-50 dark:bg-blue-950/40 border-blue-500 min-w-[140px] text-center font-medium text-blue-800 dark:text-blue-200",
        selected && "ring-2 ring-blue-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-blue-500" />
      <span>Send Email</span>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-blue-500" />
    </div>
  );
}

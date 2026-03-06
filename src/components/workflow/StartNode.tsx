"use client";

/**
 * Workflow node: Start - entry point (only source handle, no target).
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";

export function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 min-w-[120px] text-center font-medium text-emerald-800 dark:text-emerald-200",
        selected && "ring-2 ring-emerald-400"
      )}
    >
      <span>Start</span>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-emerald-500" />
    </div>
  );
}

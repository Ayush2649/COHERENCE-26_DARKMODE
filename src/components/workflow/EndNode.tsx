"use client";

/**
 * Workflow node: End - exit (only target handle, no source).
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";

export function EndNode({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-red-50 dark:bg-red-950/40 border-red-500 min-w-[120px] text-center font-medium text-red-800 dark:text-red-200",
        selected && "ring-2 ring-red-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-red-500" />
      <span>End</span>
    </div>
  );
}

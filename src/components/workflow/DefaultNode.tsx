"use client";

/**
 * Fallback node for unknown types (e.g. loaded from API with missing/old type).
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";

export function DefaultNode({ selected, data, id }: NodeProps) {
  const label = (data?.label as string) ?? "Node";
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-gray-100 dark:bg-gray-800 border-gray-400 min-w-[100px] text-center font-medium text-gray-700 dark:text-gray-300 text-xs",
        selected && "ring-2 ring-gray-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-gray-500" />
      <span>{label}</span>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-gray-500" />
    </div>
  );
}

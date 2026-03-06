"use client";

/**
 * Workflow node: Wait - delay (e.g. 2–4 hours).
 */
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/utils/cn";

type WaitNodeData = { label?: string };
export function WaitNode(props: NodeProps<Node<WaitNodeData, "wait">>) {
  const { selected, data } = props;
  const label = data?.label ?? "Wait (2–4h)";
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-amber-50 dark:bg-amber-950/40 border-amber-500 min-w-[120px] text-center font-medium text-amber-800 dark:text-amber-200",
        selected && "ring-2 ring-amber-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-amber-500" />
      <span>{label}</span>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-amber-500" />
    </div>
  );
}

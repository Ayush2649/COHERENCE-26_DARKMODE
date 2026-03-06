"use client";

/**
 * Workflow node: Condition - branch (e.g. replied vs no reply).
 */
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/utils/cn";

type ConditionNodeData = { label?: string };
export function ConditionNode(props: NodeProps<Node<ConditionNodeData, "condition">>) {
  const { selected, data } = props;
  const label = data?.label ?? "Condition";
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-purple-50 dark:bg-purple-950/40 border-purple-500 min-w-[120px] text-center font-medium text-purple-800 dark:text-purple-200",
        selected && "ring-2 ring-purple-400"
      )}
    >
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-purple-500" />
      <span>{label}</span>
      <Handle type="source" position={Position.Bottom} id="yes" className="!left-[30%] !w-2 !h-2 !bg-purple-500" />
      <Handle type="source" position={Position.Bottom} id="no" className="!left-[70%] !w-2 !h-2 !bg-purple-500" />
    </div>
  );
}

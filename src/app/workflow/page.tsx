"use client";

/**
 * Workflow Builder Page - MVC: View
 * Visual workflow builder using React Flow. Save/load workflow as JSON (nodes + edges).
 * Renders flow only after mount to avoid hydration/SSR issues.
 */

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { workflowNodeTypes, normalizeNode, type WorkflowNodeType } from "@/components/workflow";

const NODE_TYPES: { type: WorkflowNodeType; label: string }[] = [
  { type: "start", label: "Start" },
  { type: "sendEmail", label: "Send Email" },
  { type: "wait", label: "Wait" },
  { type: "condition", label: "Condition" },
  { type: "sendFollowUp", label: "Send Follow-up" },
  { type: "end", label: "End" },
];

const initialNodes: Node[] = [
  { id: "start-1", type: "start", position: { x: 250, y: 0 }, data: {} },
];
const initialEdges: Edge[] = [];

function WorkflowBuilderInner() {
  const [mounted, setMounted] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [workflowList, setWorkflowList] = useState<{ id: number; name: string }[]>([]);

  // Render React Flow only after mount to avoid hydration mismatch (nodes/edges are client-only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: WorkflowNodeType) => {
      const id = `${type}-${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position: { x: 250 + (nds.length % 3) * 180, y: 100 + Math.floor(nds.length / 3) * 100 },
          data: type === "wait" ? { label: "Wait (2–4h)" } : type === "condition" ? { label: "Condition" } : {},
        },
      ]);
    },
    [setNodes]
  );

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.ok && Array.isArray(data.workflows)) {
        setWorkflowList(data.workflows.map((w: { id: number; name: string }) => ({ id: w.id, name: w.name })));
      }
    } catch {
      setMessage({ type: "err", text: "Failed to load workflows" });
    }
  }, []);

  const loadWorkflow = useCallback(
    async (id: number) => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/workflows/${id}`);
        const data = await res.json();
        if (!res.ok || !data.workflow) {
          setMessage({ type: "err", text: data.error ?? "Failed to load" });
          return;
        }
        const w = data.workflow;
        setWorkflowId(w.id);
        setWorkflowName(w.name);
        setNodes(
          Array.isArray(w.nodes) && w.nodes.length > 0
            ? w.nodes.map((n: { id: string; type?: string; position?: { x: number; y: number }; data?: Record<string, unknown> }) => normalizeNode(n))
            : initialNodes
        );
        setEdges(
          Array.isArray(w.edges) && w.edges.length > 0
            ? w.edges.map((e: { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }, i: number) => ({
                id: e.id || `e${i}-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle ?? undefined,
                targetHandle: e.targetHandle ?? undefined,
              }))
            : []
        );
        setMessage({ type: "ok", text: `Loaded "${w.name}"` });
      } catch {
        setMessage({ type: "err", text: "Request failed" });
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges]
  );

  const saveWorkflow = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const payload = {
      name: workflowName.trim() || "Unnamed Workflow",
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data ?? {},
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      })),
    };
    try {
      if (workflowId != null) {
        const res = await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: "err", text: data.error ?? "Failed to update" });
          return;
        }
        setMessage({ type: "ok", text: "Workflow updated." });
      } else {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: "err", text: data.error ?? "Failed to save" });
          return;
        }
        setWorkflowId(data.workflow?.id ?? null);
        setMessage({ type: "ok", text: "Workflow saved." });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    } finally {
      setSaving(false);
    }
  }, [workflowName, workflowId, nodes, edges]);

  return (
    <main className="flex flex-col h-screen">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center gap-3 p-3 border-b bg-muted/30 shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Home</Link>
        </Button>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name"
          className="h-9 px-3 rounded-md border border-input bg-background text-sm w-48"
        />
        <Button onClick={saveWorkflow} disabled={saving}>
          {saving ? "Saving…" : workflowId ? "Update workflow" : "Save workflow"}
        </Button>
        <Button variant="outline" size="sm" onClick={loadWorkflows}>
          Load list
        </Button>
        {workflowList.length > 0 && (
          <select
            className="h-9 px-2 rounded-md border border-input bg-background text-sm"
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              if (!Number.isNaN(id)) loadWorkflow(id);
            }}
            value=""
          >
            <option value="">Select workflow…</option>
            {workflowList.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (#{w.id})
              </option>
            ))}
          </select>
        )}
        {message && (
          <span
            className={
              message.type === "ok"
                ? "text-green-600 dark:text-green-400 text-sm"
                : "text-red-600 dark:text-red-400 text-sm"
            }
          >
            {message.text}
          </span>
        )}
      </header>

      {/* Add nodes panel */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-muted/20 shrink-0">
        {NODE_TYPES.map(({ type, label }) => (
          <Button key={type} variant="outline" size="sm" onClick={() => addNode(type)}>
            + {label}
          </Button>
        ))}
      </div>

      {/* React Flow canvas - only render when mounted to avoid hydration errors */}
      <div className="flex-1 min-h-0 w-full" style={{ minHeight: 400 }}>
        {mounted ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={workflowNodeTypes as NodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        ) : (
          <div className="h-full min-h-[400px] flex items-center justify-center bg-muted/20 text-muted-foreground">
            Loading workflow builder…
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <span className="text-muted-foreground">Loading…</span>
        </div>
      )}
    </main>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
}

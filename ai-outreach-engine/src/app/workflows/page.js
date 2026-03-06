"use client";

import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Required for React Flow to handle custom styles properly
import { useTheme } from "@/components/ThemeProvider";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

// Import our custom nodes
import { customNodeTypes } from "@/components/WorkflowNodes";

// Default starting workflow (Start -> Send Email)
const initialNodes = [
  { id: "1", type: "start", position: { x: 300, y: 50 }, data: { label: "Trigger: Added to Campaign" } },
  { id: "2", type: "sendEmail", position: { x: 300, y: 200 }, data: { label: "Generate AI Welcome Email" } }
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true }
];

let idSeed = 3;
const getId = () => `${idSeed++}`;

export default function WorkflowsPage() {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef(null);
  
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflowName, setWorkflowName] = useState("My First Automation");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  // Load workflows list from database
  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows");
      const data = await response.json();
      if (data.success) {
        setSavedWorkflows(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    }
  };

  // Switch to a different workflow
  const loadWorkflow = (workflow) => {
    setWorkflowName(workflow.name);
    
    // Parse the JSON strings from the database back into objects
    try {
      setNodes(typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes);
      setEdges(typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges);
      setIsLoadDialogOpen(false);
      setMessage("Workflow loaded!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error("Failed to parse workflow data", e);
      setMessage("Error parsing workflow data");
    }
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), []);

  // Add a new node to the flow
  const addNode = (type, label) => {
    const newNode = {
      id: getId(),
      type,
      position: { 
        x: 300 + (Math.random() * 50 - 25), 
        y: nodes.length > 0 ? Math.max(...nodes.map(n => n.position.y)) + 150 : 100 
      },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Save workflow to SQLite database
  const saveWorkflow = async () => {
    setIsSaving(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Saving the workflow JSON exactly identically to how Mailchimp/ReactFlow handles it
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage("Workflow saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error(data.error || "Failed to save workflow");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error saving workflow.");
    } finally {
      setIsSaving(false);
    }
  };

  // Determine background color based on theme
  const bgColor = theme === "dark" ? "#030014" : "#f8f9fc"; 
  const dotColor = theme === "dark" ? "#333" : "#cbd5e1";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      
      {/* Top Action Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border/50 bg-card/50 px-6 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Input 
            value={workflowName} 
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-64 font-medium border-transparent focus-visible:ring-1 bg-transparent hover:bg-muted/50 px-2 h-8"
          />
          {message && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              {message}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isLoadDialogOpen} onOpenChange={(open) => {
            setIsLoadDialogOpen(open);
            if (open) fetchWorkflows(); // Fetch when opened
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                📂 Load
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Saved Workflows</DialogTitle>
                <DialogDescription>
                  Select a workflow to load into the builder. Unsaved changes will be lost.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mt-2">
                {savedWorkflows.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No saved workflows yet.
                  </div>
                ) : (
                  savedWorkflows.map(wf => (
                    <Card 
                      key={wf.id} 
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-center"
                      onClick={() => loadWorkflow(wf)}
                    >
                      <div className="font-medium text-sm">{wf.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(wf.updatedAt).toLocaleDateString()}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={saveWorkflow} disabled={isSaving} size="sm" className="gap-2">
            {isSaving ? "Saving..." : "💾 Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 border-r border-border/50 bg-card/30 p-4 flex flex-col gap-4 z-10 backdrop-blur-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions</h3>
          
          <Card 
            className="p-3 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors border-border/50 flex items-center gap-3"
            onClick={() => addNode('sendEmail', 'Send Email')}
          >
            <span className="text-2xl">📧</span>
            <div className="text-sm font-medium">Send Email</div>
          </Card>
          
          <Card 
            className="p-3 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors border-border/50 flex items-center gap-3"
            onClick={() => addNode('sendFollowup', 'Follow-up Email')}
          >
            <span className="text-2xl">🔄</span>
            <div className="text-sm font-medium">Follow-up</div>
          </Card>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Rules / Logic</h3>
          
          <Card 
            className="p-3 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors border-border/50 flex items-center gap-3"
            onClick={() => addNode('wait', 'Time Delay')}
          >
            <span className="text-2xl">⏳</span>
            <div className="text-sm font-medium">Time Delay</div>
          </Card>
          
          <Card 
            className="p-3 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors border-border/50 flex items-center gap-3"
            onClick={() => addNode('condition', 'If / Else Split')}
          >
            <span className="text-2xl">🔀</span>
            <div className="text-sm font-medium">Condition Split</div>
          </Card>
          
          <Card 
            className="p-3 cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-colors border-border/50 flex items-center gap-3 mt-auto"
            onClick={() => addNode('end', 'End Flow')}
          >
            <span className="text-2xl">🛑</span>
            <div className="text-sm font-medium">End Workflow</div>
          </Card>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={customNodeTypes}
            fitView
            className="bg-grid-small"
          >
            {/* The Background component respects our theme colors */}
            <Background gap={24} size={2} color={dotColor} style={{ backgroundColor: bgColor }} />
            <Controls className="bg-card border-border fill-foreground" />
            <Panel position="bottom-right" className="bg-card/80 backdrop-blur-sm p-3 rounded-xl border border-border/50 text-xs text-muted-foreground shadow-sm mb-4 mr-4">
              Tip: Drag nodes to move, drag handles to connect
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

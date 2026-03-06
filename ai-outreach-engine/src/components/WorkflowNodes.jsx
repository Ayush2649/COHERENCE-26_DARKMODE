import { Handle, Position } from '@xyflow/react';

// Common node wrapper with ShadCN-like styling that adapts to light/dark themes
const NodeWrapper = ({ title, icon, colorClass, children, id, isStart = false, isEnd = false }) => {
  return (
    <div className={`relative min-w-[200px] rounded-xl border bg-card text-card-foreground shadow-sm ${colorClass}`}>
      {/* Input Handle (unless Start node) */}
      {!isStart && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="h-3 w-3 border-2 border-background bg-muted-foreground" 
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
      </div>

      {/* Output Handle (unless End node) */}
      {!isEnd && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="h-3 w-3 border-2 border-background bg-muted-foreground" 
        />
      )}
    </div>
  );
};

// Start Node
export const StartNode = ({ data, id }) => (
  <NodeWrapper 
    id={id} 
    title="Start Workflow" 
    icon="▶️" 
    colorClass="border-green-500/50 shadow-green-500/10" 
    isStart={true}
  >
    <div className="text-xs text-muted-foreground text-center py-1">
      {data.label || 'Trigger: Manual Start'}
    </div>
  </NodeWrapper>
);

// End Node
export const EndNode = ({ data, id }) => (
  <NodeWrapper 
    id={id} 
    title="End Workflow" 
    icon="🛑" 
    colorClass="border-destructive/50 shadow-destructive/10" 
    isEnd={true}
  >
    <div className="text-xs text-muted-foreground text-center py-1">
      {data.label || 'Action: Mark Completed'}
    </div>
  </NodeWrapper>
);

// Send Email Node
export const SendEmailNode = ({ data, id }) => (
  <NodeWrapper 
    id={id} 
    title="Send Email" 
    icon="📧" 
    colorClass="border-blue-500/50 shadow-blue-500/10"
  >
    <div className="text-xs space-y-2">
      <div className="bg-muted p-1.5 rounded truncate">
        Sub: {data.subject || 'Generating AI Subject...'}
      </div>
      <div className="text-muted-foreground">
        {data.label || 'Generate AI message & send'}
      </div>
    </div>
  </NodeWrapper>
);

// Wait Node
export const WaitNode = ({ data, id }) => (
  <NodeWrapper 
    id={id} 
    title="Time Delay" 
    icon="⏳" 
    colorClass="border-amber-500/50 shadow-amber-500/10"
  >
    <div className="text-center font-mono text-sm bg-muted/50 p-1.5 rounded">
      {data.duration || '1'} {data.unit || 'Days'}
    </div>
  </NodeWrapper>
);

// Follow-up Node
export const FollowUpNode = ({ data, id }) => (
  <NodeWrapper 
    id={id} 
    title="Send Follow-up" 
    icon="🔄" 
    colorClass="border-purple-500/50 shadow-purple-500/10"
  >
    <div className="text-xs text-muted-foreground text-center py-1">
      {data.label || 'If no reply, send again'}
    </div>
  </NodeWrapper>
);

// Condition Node (Split Path)
export const ConditionNode = ({ data, id }) => (
  <div className="relative min-w-[200px] rounded-xl border border-orange-500/50 bg-card text-card-foreground shadow-sm shadow-orange-500/10">
    <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-background bg-muted-foreground" />
    
    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
      <span className="text-lg">🔀</span>
      <span className="text-sm font-medium">Split Path</span>
    </div>

    <div className="p-3 text-xs text-center font-medium">
      {data.label || 'Did they reply?'}
    </div>

    {/* Two output handles - Yes and No */}
    <div className="relative h-6 border-t border-border/50 bg-muted/10 rounded-b-xl flex justify-between px-6 items-center">
      <div className="text-xs text-green-500 font-semibold">Yes</div>
      <div className="text-xs text-destructive font-semibold">No</div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="yes"
        className="h-3 w-3 border-2 border-background bg-green-500 left-[25%]" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="no"
        className="h-3 w-3 border-2 border-background bg-destructive left-[75%]" 
      />
    </div>
  </div>
);

// Export all node types mapped to standard strings
export const customNodeTypes = {
  start: StartNode,
  end: EndNode,
  sendEmail: SendEmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  sendFollowup: FollowUpNode,
};

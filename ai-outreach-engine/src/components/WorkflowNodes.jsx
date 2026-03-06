import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Common node wrapper with ShadCN-like styling that adapts to light/dark themes
const NodeWrapper = ({ title, icon, colorClass, children, id, isStart = false, isEnd = false, data }) => {
  let finalColorClass = colorClass;
  let overlayBadge = null;

  if (data?.nodeState) {
    if (data.nodeState === 'completed') {
      finalColorClass = "border-slate-400/50 shadow-slate-400/10 opacity-70 bg-muted/20 grayscale-[0.3]";
      overlayBadge = <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 absolute -top-3 right-2 shadow-sm">✅ Done</Badge>;
    } else if (data.nodeState === 'current') {
      finalColorClass = "border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-blue-500/5";
      overlayBadge = <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 absolute -top-3 right-2 shadow-sm">🔄 Running</Badge>;
    } else if (data.nodeState === 'future') {
      finalColorClass = "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-500/5 cursor-pointer ring-2 ring-amber-500/20 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-shadow";
      overlayBadge = <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 absolute -top-3 right-2 shadow-sm">✏️ Click to Edit</Badge>;
    }
  }

  // fast mode badge
  let fastModeBadge = null;
  if (data?.unit === 'seconds' || data?.unit === 'minutes') {
     fastModeBadge = <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 absolute -bottom-3 right-2 z-10 text-[10px] px-1.5 py-0 shadow-sm leading-tight">⚡ Fast Mode</Badge>;
  }

  return (
    <div className={`relative min-w-[200px] rounded-xl border bg-card text-card-foreground shadow-sm ${finalColorClass}`}>
      {overlayBadge}
      {fastModeBadge}
      
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
  <NodeWrapper id={id} title="Start Workflow" icon="▶️" colorClass="border-green-500/50 shadow-green-500/10" isStart={true} data={data}>
    <div className="text-xs text-muted-foreground text-center py-1">
      {data.label || 'Trigger: Manual Start'}
    </div>
  </NodeWrapper>
);

// End Node
export const EndNode = ({ data, id }) => (
  <NodeWrapper id={id} title="End Workflow" icon="🛑" colorClass="border-destructive/50 shadow-destructive/10" isEnd={true} data={data}>
    <div className="text-xs text-muted-foreground text-center py-1">
      {data.label || 'Action: Mark Completed'}
    </div>
  </NodeWrapper>
);

// Editable Node HOC wraps nodes that can be edited in the Popover
const withFutureEditing = (Component, EditFormContent) => {
  return function FutureEditableNode({ data, id }) {
    const [open, setOpen] = useState(false);

    if (data.nodeState === 'future') {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="cursor-pointer">
              <Component data={data} id={id} />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" side="right" align="start" sideOffset={15}>
            <EditFormContent data={data} id={id} close={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      );
    }
    
    // Readonly tooltip for completed/current
    if (data.nodeState === 'completed' || data.nodeState === 'current') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div><Component data={data} id={id} /></div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 text-sm" side="top">
            🔒 This node is locked (campaign is already past this).
          </PopoverContent>
        </Popover>
      );
    }

    // Default builder mode
    return <Component data={data} id={id} />;
  }
};

// Send Email Node
const BaseSendEmailNode = ({ data, id }) => (
  <NodeWrapper id={id} title="Send Email" icon="📧" colorClass="border-blue-500/50 shadow-blue-500/10" data={data}>
    <div className="text-xs space-y-2 w-full max-w-[200px]">
      <div className="bg-muted p-1.5 rounded truncate font-medium border border-border/50">
        Sub: {data.subject || 'Generating AI Subject...'}
      </div>
      <div className="text-muted-foreground line-clamp-2 leading-relaxed">
        {data.body ? data.body.replace(/<[^>]+>/g, '') : (data.label || 'Generate AI message & send')}
      </div>
    </div>
  </NodeWrapper>
);

const SendEmailForm = ({ data, id, close }) => {
  const [subject, setSubject] = useState(data.subject || "");
  const [body, setBody] = useState(data.body || "");

  const handleSave = () => {
    if (data.onSave) {
      data.onSave(id, { subject, body, label: "Sent manually edited email" });
    }
    close();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b pb-2 mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">✉️ Edit Email Content</h4>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Subject</Label>
        <Input size="sm" value={subject} onChange={e => setSubject(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Body text</Label>
        <Textarea className="h-24 resize-none text-sm" value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground flex gap-2 w-full flex-wrap">
        <span>{"{{name}}"}</span><span>{"{{company}}"}</span><span>{"{{role}}"}</span>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="gap-2">✅ Save Changes</Button>
      </div>
    </div>
  );
};

export const SendEmailNode = withFutureEditing(BaseSendEmailNode, SendEmailForm);

// Wait Node
const BaseWaitNode = ({ data, id }) => (
  <NodeWrapper id={id} title="Time Delay" icon="⏳" colorClass="border-amber-500/50 shadow-amber-500/10" data={data}>
    <div className="text-center font-mono text-sm bg-muted/50 p-1.5 rounded border border-border/50">
      Wait {data.duration || '1'} {data.unit || 'Days'}
    </div>
  </NodeWrapper>
);

const WaitForm = ({ data, id, close }) => {
  const [duration, setDuration] = useState(data.duration || "1");
  const [unit, setUnit] = useState(data.unit || "Days");

  const handleSave = () => {
    if (data.onSave) {
      data.onSave(id, { duration: parseFloat(duration), unit, label: `Wait ${duration} ${unit}` });
    }
    close();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b pb-2 mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">⏱ Edit Wait Duration</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Duration</Label>
          <Input type="number" step="1" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="Hours">Hours</SelectItem>
              <SelectItem value="Days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="gap-2">✅ Save Changes</Button>
      </div>
    </div>
  );
};

export const WaitNode = withFutureEditing(BaseWaitNode, WaitForm);

// Condition Node (Split Path)
const BaseConditionNode = ({ data, id }) => {
  let finalColorClass = "border-orange-500/50 shadow-orange-500/10";
  let overlayBadge = null;

  if (data?.nodeState) {
    if (data.nodeState === 'completed') {
      finalColorClass = "border-slate-400/50 shadow-slate-400/10 opacity-70 bg-muted/20 grayscale-[0.3]";
      overlayBadge = <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 absolute -top-3 right-2 shadow-sm z-10">✅ Done</Badge>;
    } else if (data.nodeState === 'current') {
      finalColorClass = "border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-blue-500/5";
      overlayBadge = <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 absolute -top-3 right-2 shadow-sm z-10">🔄 Running</Badge>;
    } else if (data.nodeState === 'future') {
      finalColorClass = "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-500/5 cursor-pointer ring-2 ring-amber-500/20 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-shadow";
      overlayBadge = <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 absolute -top-3 right-2 shadow-sm z-10">✏️ Click to Edit</Badge>;
    }
  }

  return (
    <div className={`relative min-w-[200px] rounded-xl border bg-card text-card-foreground shadow-sm ${finalColorClass}`}>
      {overlayBadge}
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-background bg-muted-foreground" />
      
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
        <span className="text-lg">🔀</span>
        <span className="text-sm font-medium">Split Path</span>
      </div>

      <div className="p-3 text-xs text-center font-medium bg-muted/10 mx-2 my-2 rounded border border-border/50">
        {data.conditionType || 'Did they reply?'}
      </div>

      <div className="relative h-6 border-t border-border/50 bg-muted/20 rounded-b-xl flex justify-between px-6 items-center">
        <div className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{data.yesLabel || 'Yes'}</div>
        <div className="text-[10px] text-destructive font-bold uppercase tracking-wider">{data.noLabel || 'No'}</div>
        
        <Handle type="source" position={Position.Bottom} id="yes" className="h-3 w-3 border-2 border-background bg-green-500 left-[25%]" />
        <Handle type="source" position={Position.Bottom} id="no" className="h-3 w-3 border-2 border-background bg-destructive left-[75%]" />
      </div>
    </div>
  );
};

const ConditionForm = ({ data, id, close }) => {
  const [conditionType, setConditionType] = useState(data.conditionType || "Replied");
  const [yesLabel, setYesLabel] = useState(data.yesLabel || "Yes");
  const [noLabel, setNoLabel] = useState(data.noLabel || "No");

  const handleSave = () => {
    if (data.onSave) {
      data.onSave(id, { conditionType, yesLabel, noLabel, label: `Condition: ${conditionType}` });
    }
    close();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b pb-2 mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">⚡ Edit Condition Logic</h4>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Condition Type</Label>
        <Select value={conditionType} onValueChange={setConditionType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Replied">Replied</SelectItem>
            <SelectItem value="Opened Email">Opened Email</SelectItem>
            <SelectItem value="Clicked Link">Clicked Link</SelectItem>
            <SelectItem value="Custom (50/50)">Custom (50/50)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-green-500">Yes Path Label</Label>
          <Input size="sm" value={yesLabel} onChange={e => setYesLabel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-red-500">No Path Label</Label>
          <Input size="sm" value={noLabel} onChange={e => setNoLabel(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="gap-2">✅ Save Changes</Button>
      </div>
    </div>
  );
};

export const ConditionNode = withFutureEditing(BaseConditionNode, ConditionForm);

// Follow-up doesn't need a complex form for now, use Email form
export const FollowUpNode = withFutureEditing(
  ({ data, id }) => (
    <NodeWrapper id={id} title="Send Follow-up" icon="🔄" colorClass="border-purple-500/50 shadow-purple-500/10" data={data}>
      <div className="text-xs space-y-2 w-full max-w-[200px]">
        <div className="bg-muted p-1.5 rounded truncate font-medium border border-border/50">
          Sub: {data.subject || 'Generating AI Follow-up...'}
        </div>
        <div className="text-muted-foreground line-clamp-2 leading-relaxed">
          {data.body ? data.body.replace(/<[^>]+>/g, '') : (data.label || 'If no reply, try again')}
        </div>
      </div>
    </NodeWrapper>
  ),
  SendEmailForm
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

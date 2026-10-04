export type NodeType =
  // Triggers
  | 'trigger_manual'
  | 'trigger_webhook'
  | 'trigger_schedule'
  | 'trigger_form'
  | 'trigger_event'
  // Actions
  | 'action_http'
  | 'action_code'
  | 'action_transform'
  | 'action_ai'
  | 'action_notification'
  | 'action_kv_store'
  | 'action_delay'
  | 'action_log'
  // Conditions & Flow Control
  | 'condition_if_else'
  | 'condition_switch'
  | 'control_parallel';

export type NodeCategory = 'trigger' | 'action' | 'condition' | 'transform' | 'ai';

export type ExecutionStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface BaseNodeData {
  label: string;
  type: NodeType;
  description?: string;
  category: NodeCategory;
  config: Record<string, any>;
  status?: ExecutionStatus;
  executionDuration?: number;
  lastOutput?: any;
  lastError?: string;
  isConfigured?: boolean;
  [key: string]: any;
}

export interface WorkflowVariable {
  key: string;
  value: any;
  nodeId: string;
  nodeLabel: string;
}

export interface StepExecutionLog {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  category: NodeCategory;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  inputData: any;
  outputData?: any;
  error?: string;
  logs: string[];
  retryCount?: number;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: NodeType;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  triggerPayload: any;
  stepLogs: StepExecutionLog[];
  finalOutput?: any;
  errorMessage?: string;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  badge?: string;
  nodes: any[];
  edges: any[];
  samplePayload?: any;
}

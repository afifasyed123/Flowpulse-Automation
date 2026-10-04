import React, { useState } from 'react';
import {
  Zap,
  Globe,
  Clock,
  FileText,
  Radio,
  Send,
  Code,
  Sparkles,
  Layers,
  Database,
  Timer,
  Terminal,
  GitBranch,
  Split,
  Workflow,
  Search,
  Plus,
  HelpCircle,
  FolderTree,
} from 'lucide-react';
import type { NodeCategory, NodeType } from '../../types/workflow';

interface NodeDefinition {
  type: NodeType;
  label: string;
  category: NodeCategory;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultConfig: Record<string, any>;
}

export const AVAILABLE_NODES: NodeDefinition[] = [
  // Triggers
  {
    type: 'trigger_manual',
    label: 'Manual Trigger',
    category: 'trigger',
    description: 'Start workflow manually on click with customized JSON test payload.',
    icon: Zap,
    defaultConfig: {
      defaultPayload: {
        event: 'manual_dispatch',
        user: { id: 'usr_101', name: 'Jordan Taylor', email: 'jordan@company.com' },
        data: { amount: 1500, priority: 'urgent' },
      },
    },
  },
  {
    type: 'trigger_webhook',
    label: 'Webhook Listener',
    category: 'trigger',
    description: 'Trigger instantly on incoming HTTP POST payload events from external apps.',
    icon: Globe,
    defaultConfig: {
      method: 'POST',
      endpoint: '/webhooks/v1/inbound-events',
      secret: 'whsec_auto_secret_9981',
    },
  },
  {
    type: 'trigger_schedule',
    label: 'Scheduled Cron Timer',
    category: 'trigger',
    description: 'Run workflow automatically on recurring cron intervals or schedules.',
    icon: Clock,
    defaultConfig: {
      cron: '*/15 * * * *',
      timezone: 'UTC',
    },
  },
  {
    type: 'trigger_form',
    label: 'Form Submission',
    category: 'trigger',
    description: 'Trigger when a user fills out a dynamic web form or survey.',
    icon: FileText,
    defaultConfig: {
      formName: 'Customer Support Intake',
      fields: ['email', 'message', 'urgency'],
    },
  },
  {
    type: 'trigger_event',
    label: 'Event Stream Poller',
    category: 'trigger',
    description: 'Poll message queues or RSS feeds for new records periodically.',
    icon: Radio,
    defaultConfig: {
      pollIntervalSec: 60,
      streamSource: 'kafka_events_queue',
    },
  },

  // Actions
  {
    type: 'action_http',
    label: 'HTTP REST API Request',
    category: 'action',
    description: 'Dispatch GET, POST, PUT, DELETE requests with headers and dynamic payload.',
    icon: Globe,
    defaultConfig: {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 5000,
      retryCount: 2,
    },
  },
  {
    type: 'action_code',
    label: 'JavaScript Sandbox',
    category: 'action',
    description: 'Execute custom JavaScript logic with input parameters and sandbox console.',
    icon: Code,
    defaultConfig: {
      code: '// Access input via `input` and workflow context via `context`\nconst transformed = {\n  processedAt: new Date().toISOString(),\n  originalData: input,\n  score: 95.4\n};\nreturn transformed;',
    },
  },
  {
    type: 'action_transform',
    label: 'Data Transform & JSON Map',
    category: 'transform',
    description: 'Map JSON fields, evaluate math expressions, or interpolate text templates.',
    icon: Layers,
    defaultConfig: {
      mode: 'json_map',
      mappings: {
        userId: '{{trigger.user.id}}',
        customerEmail: '{{trigger.user.email}}',
        processedTimestamp: '{{$isoDate}}',
      },
    },
  },
  {
    type: 'action_ai',
    label: 'AI Intelligence Processor',
    category: 'ai',
    description: 'Run AI sentiment analysis, customer ticket triage, entity extraction, or summarization.',
    icon: Sparkles,
    defaultConfig: {
      task: 'sentiment',
      prompt: 'Analyze sentiment for customer input: {{trigger.data.message}}',
    },
  },
  {
    type: 'action_notification',
    label: 'Dispatch Notification',
    category: 'action',
    description: 'Send alerts to Slack, Discord, Email, SMS, or PagerDuty channels.',
    icon: Send,
    defaultConfig: {
      channel: 'Slack #dev-alerts',
      subject: 'FlowPulse Workflow Alert',
      message: 'Workflow executed successfully for {{trigger.user.email}} at {{$now}}.',
    },
  },
  {
    type: 'action_kv_store',
    label: 'Database Key-Value Store',
    category: 'action',
    description: 'Store, retrieve, or increment state values across workflow executions.',
    icon: Database,
    defaultConfig: {
      operation: 'set',
      key: 'state.last_run',
      value: { timestamp: '{{$isoDate}}', execution: '{{$executionId}}' },
    },
  },
  {
    type: 'action_delay',
    label: 'Asynchronous Delay Timer',
    category: 'action',
    description: 'Pause execution for X seconds before resuming next downstream step.',
    icon: Timer,
    defaultConfig: {
      seconds: 2,
    },
  },
  {
    type: 'action_log',
    label: 'Structured Audit Log',
    category: 'action',
    description: 'Record diagnostic information with severity levels into execution history.',
    icon: Terminal,
    defaultConfig: {
      level: 'INFO',
      message: 'Checkpoint milestone reached at {{$now}}',
    },
  },

  // Conditions & Logic
  {
    type: 'condition_if_else',
    label: 'If / Else Router',
    category: 'condition',
    description: 'Branch workflow into True / False paths based on rule evaluations.',
    icon: GitBranch,
    defaultConfig: {
      leftValue: '{{trigger.data.amount}}',
      operator: 'greater_than',
      rightValue: 1000,
    },
  },
  {
    type: 'condition_switch',
    label: 'Multi-Branch Switch',
    category: 'condition',
    description: 'Match a variable against multiple custom case strings.',
    icon: Split,
    defaultConfig: {
      value: '{{trigger.data.priority}}',
      cases: ['urgent', 'normal', 'low'],
    },
  },
  {
    type: 'control_parallel',
    label: 'Parallel Branch Fork',
    category: 'action',
    description: 'Run multiple downstream tasks concurrently in parallel.',
    icon: Workflow,
    defaultConfig: {
      concurrency: 2,
    },
  },
];

interface NodeSidebarProps {
  onAddNode: (type: NodeType, defaultConfig: Record<string, any>, label: string, category: NodeCategory) => void;
}

export const NodeSidebar: React.FC<NodeSidebarProps> = ({ onAddNode }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const onDragStart = (event: React.DragEvent, nodeDef: NodeDefinition) => {
    event.dataTransfer.setData('application/reactflow-type', nodeDef.type);
    event.dataTransfer.setData('application/reactflow-label', nodeDef.label);
    event.dataTransfer.setData('application/reactflow-category', nodeDef.category);
    event.dataTransfer.setData('application/reactflow-config', JSON.stringify(nodeDef.defaultConfig));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = AVAILABLE_NODES.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase()) ||
      node.type.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || node.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'All', icon: FolderTree },
    { id: 'trigger', label: 'Triggers', icon: Zap },
    { id: 'action', label: 'Actions', icon: Globe },
    { id: 'condition', label: 'Logic', icon: GitBranch },
    { id: 'transform', label: 'Transform', icon: Layers },
    { id: 'ai', label: 'AI', icon: Sparkles },
  ];

  return (
    <aside className="w-80 h-full flex flex-col bg-[#0b0f19] border-r border-slate-800/80 text-slate-200 z-10 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/70 bg-[#070a12]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Block Palette
            </span>
          </div>
          <span className="text-[11px] bg-slate-800/80 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
            {filteredNodes.length} blocks
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search triggers, actions, AI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs (No emojis, clean icons) */}
      <div className="flex items-center gap-1.5 p-2 border-b border-slate-800/60 overflow-x-auto no-scrollbar bg-[#080c16]">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <CatIcon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {filteredNodes.map((node) => {
          const IconComp = node.icon;
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node)}
              className="group relative p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 hover:border-violet-500/50 cursor-grab active:cursor-grabbing transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#070a12] border border-slate-800 text-violet-400 group-hover:text-violet-300 group-hover:border-violet-500/30 transition-all">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {node.label}
                    </h5>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      {node.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAddNode(node.type, node.defaultConfig, node.label, node.category)}
                  title="Add to Canvas"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {node.description}
              </p>
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No matching blocks found.
          </div>
        )}
      </div>

      {/* Sidebar Footer Hint */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070a12] text-[11px] text-slate-400 flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <span>Drag blocks onto canvas or click (+) to insert.</span>
      </div>
    </aside>
  );
};

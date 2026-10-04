import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  Settings,
  Trash2,
} from 'lucide-react';
import type { BaseNodeData, NodeType } from '../../types/workflow';

const nodeIcons: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  trigger_manual: Zap,
  trigger_webhook: Globe,
  trigger_schedule: Clock,
  trigger_form: FileText,
  trigger_event: Radio,
  action_http: Globe,
  action_code: Code,
  action_transform: Layers,
  action_ai: Sparkles,
  action_notification: Send,
  action_kv_store: Database,
  action_delay: Timer,
  action_log: Terminal,
  condition_if_else: GitBranch,
  condition_switch: Split,
  control_parallel: Workflow,
};

const categoryTheme = {
  trigger: {
    bg: 'from-amber-500/15 via-purple-500/10 to-transparent',
    border: 'border-purple-500/40 hover:border-purple-400',
    headerBg: 'bg-purple-950/60 text-purple-200 border-purple-800/50',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  action: {
    bg: 'from-blue-500/15 via-cyan-500/10 to-transparent',
    border: 'border-blue-500/40 hover:border-blue-400',
    headerBg: 'bg-blue-950/60 text-blue-200 border-blue-800/50',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  condition: {
    bg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    border: 'border-amber-500/40 hover:border-amber-400',
    headerBg: 'bg-amber-950/60 text-amber-200 border-amber-800/50',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  transform: {
    bg: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    headerBg: 'bg-emerald-950/60 text-emerald-200 border-emerald-800/50',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  ai: {
    bg: 'from-pink-500/15 via-fuchsia-500/10 to-transparent',
    border: 'border-pink-500/40 hover:border-pink-400',
    headerBg: 'bg-pink-950/60 text-pink-200 border-pink-800/50',
    iconColor: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
};

interface CustomNodeProps {
  id: string;
  data: BaseNodeData & {
    onSelectNode?: (id: string) => void;
    onDeleteNode?: (id: string) => void;
    onTestNode?: (id: string) => void;
  };
  selected?: boolean;
}

export const CustomNode = memo(({ id, data, selected }: CustomNodeProps) => {
  const IconComponent = nodeIcons[data.type] || Zap;
  const theme = categoryTheme[data.category] || categoryTheme.action;

  // Status Styling
  let statusGlow = '';
  let statusBadge = null;

  if (data.status === 'running') {
    statusGlow = 'ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.4)] animate-pulse';
    statusBadge = (
      <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/50">
        <Loader2 className="w-3 h-3 animate-spin" /> Running
      </span>
    );
  } else if (data.status === 'success') {
    statusGlow = 'ring-1 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
    statusBadge = (
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50">
        <CheckCircle2 className="w-3 h-3" /> {data.executionDuration ? `${data.executionDuration}ms` : 'Success'}
      </span>
    );
  } else if (data.status === 'error') {
    statusGlow = 'ring-2 ring-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.4)]';
    statusBadge = (
      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/50">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  } else if (data.status === 'skipped') {
    statusGlow = 'opacity-40 grayscale';
    statusBadge = (
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
        <AlertCircle className="w-3 h-3" /> Skipped
      </span>
    );
  }

  const isTrigger = data.category === 'trigger';
  const isCondition = data.type === 'condition_if_else';
  const isSwitch = data.type === 'condition_switch';

  return (
    <div
      className={`relative group rounded-xl w-72 backdrop-blur-xl bg-slate-900/90 border transition-all duration-200 select-none ${theme.border} ${
        selected ? 'ring-2 ring-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.35)]' : 'shadow-xl'
      } ${statusGlow}`}
    >
      {/* Target Input Handle (Except Triggers) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3.5 h-3.5 !bg-indigo-400 border-2 !border-slate-950 rounded-full hover:scale-125 transition-transform"
        />
      )}

      {/* Node Header */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-t-xl border-b ${theme.headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg bg-slate-950/60 ${theme.iconColor}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 truncate">
            {data.category}
          </span>
        </div>

        {/* Quick Node Actions on hover */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {data.onTestNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onTestNode?.(id);
              }}
              title="Test Node"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-300 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {data.onSelectNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onSelectNode?.(id);
              }}
              title="Configure Node"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          {data.onDeleteNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDeleteNode?.(id);
              }}
              title="Delete Node"
              className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Node Body */}
      <div className={`p-3.5 bg-gradient-to-b ${theme.bg}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-semibold text-sm text-slate-100 leading-snug tracking-tight truncate">
            {data.label}
          </h4>
        </div>

        {/* Dynamic preview metadata */}
        <div className="text-xs text-slate-400 font-mono line-clamp-1 mb-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800/60">
          {data.config?.url ? (
            <span className="text-blue-300">{data.config.method || 'GET'} {data.config.url}</span>
          ) : data.config?.cron ? (
            <span className="text-amber-300">Cron: {data.config.cron}</span>
          ) : data.config?.task ? (
            <span className="text-pink-300">AI Task: {data.config.task}</span>
          ) : data.config?.channel ? (
            <span className="text-cyan-300">Target: {data.config.channel}</span>
          ) : data.config?.operator ? (
            <span className="text-amber-300">Rule: {data.config.operator}</span>
          ) : (
            <span>{data.type.replace(/_/g, ' ')}</span>
          )}
        </div>

        {/* Footer info: Status badge */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500 font-mono">ID: {id}</span>
          {statusBadge}
        </div>
      </div>

      {/* Handles for Flow Routing */}
      {isCondition ? (
        <>
          {/* True Handle */}
          <div className="relative">
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              style={{ top: '35%' }}
              className="w-3.5 h-3.5 !bg-emerald-400 border-2 !border-slate-950 rounded-full hover:scale-125 transition-transform"
            />
            <span className="absolute -right-12 top-[24%] text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-500/40">
              TRUE
            </span>
          </div>
          {/* False Handle */}
          <div className="relative">
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              style={{ top: '75%' }}
              className="w-3.5 h-3.5 !bg-rose-400 border-2 !border-slate-950 rounded-full hover:scale-125 transition-transform"
            />
            <span className="absolute -right-12 top-[64%] text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1 rounded border border-rose-500/40">
              FALSE
            </span>
          </div>
        </>
      ) : isSwitch ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="active"
            style={{ top: '30%' }}
            className="w-3.5 h-3.5 !bg-indigo-400 border-2 !border-slate-950 rounded-full"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="pending"
            style={{ top: '55%' }}
            className="w-3.5 h-3.5 !bg-amber-400 border-2 !border-slate-950 rounded-full"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="default"
            style={{ top: '80%' }}
            className="w-3.5 h-3.5 !bg-slate-400 border-2 !border-slate-950 rounded-full"
          />
        </>
      ) : (
        /* Standard Output Handle */
        <Handle
          type="source"
          position={Position.Right}
          className="w-3.5 h-3.5 !bg-indigo-400 border-2 !border-slate-950 rounded-full hover:scale-125 transition-transform"
        />
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Activity,
  AlertCircle,
  Pause,
  Play,
  Share2,
} from 'lucide-react';
import type { ExecutionRecord } from '../../types/workflow';

interface ExecutionDrawerProps {
  executionRecord: ExecutionRecord | null;
  isRunning: boolean;
  onClose: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export const ExecutionDrawer: React.FC<ExecutionDrawerProps> = ({
  executionRecord,
  isRunning,
  onClose,
  onPause,
  onResume,
  isPaused,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!executionRecord && !isRunning) return null;

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const copyToClipboard = (data: any, key: string) => {
    navigator.clipboard.writeText(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = executionRecord?.stepLogs || [];
  const status = isRunning ? 'running' : executionRecord?.status || 'success';

  return (
    <div className="fixed bottom-0 left-80 right-0 h-96 bg-slate-900/98 backdrop-blur-2xl border-t border-slate-800 shadow-2xl z-30 flex flex-col text-slate-200 animate-in slide-in-from-bottom duration-200">
      {/* Drawer Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-indigo-400'}`} />
            <h3 className="text-sm font-bold text-slate-100">Live Execution Logs</h3>
          </div>

          {/* Status badge */}
          {status === 'running' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Executing Pipeline...
            </span>
          ) : status === 'success' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Execution Succeeded ({executionRecord?.durationMs}ms)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">
              <XCircle className="w-3.5 h-3.5" />
              Execution Failed ({executionRecord?.durationMs}ms)
            </span>
          )}

          {executionRecord?.id && (
            <span className="text-xs text-slate-500 font-mono">Run: {executionRecord.id}</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <button
              onClick={isPaused ? onResume : onPause}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-slate-300 border border-slate-700"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {executionRecord && (
            <button
              onClick={() => copyToClipboard(executionRecord, 'full_run')}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700"
            >
              {copiedKey === 'full_run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              Export Log
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {steps.length === 0 && isRunning && (
          <div className="flex items-center justify-center h-32 text-slate-500 text-xs gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
            Initializing DAG execution engine...
          </div>
        )}

        {steps.map((step, idx) => {
          const isExpanded = !!expandedSteps[step.nodeId];
          const isSuccess = step.status === 'success';
          const isSkipped = step.status === 'skipped';
          const isError = step.status === 'error';

          return (
            <div
              key={step.nodeId + idx}
              className={`rounded-xl border transition-all ${
                isError
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : isSkipped
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Step Header */}
              <div
                onClick={() => toggleStep(step.nodeId)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs font-mono w-5">#{idx + 1}</span>

                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  ) : isSkipped ? (
                    <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  )}

                  <span className="text-xs font-semibold text-slate-200">{step.nodeLabel}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {step.nodeType}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {step.durationMs !== undefined ? `${step.durationMs}ms` : '...'}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Step Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                  {/* Left: Input & Logs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-400">Input Data / Resolved Config</span>
                      <button
                        onClick={() => copyToClipboard(step.inputData, `in_${step.nodeId}`)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === `in_${step.nodeId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="bg-slate-900 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto border border-slate-800">
                      {JSON.stringify(step.inputData, null, 2)}
                    </pre>

                    {step.logs && step.logs.length > 0 && (
                      <div className="mt-2">
                        <span className="font-semibold text-slate-400 block mb-1">Execution Steps Trace</span>
                        <div className="bg-slate-900 rounded-lg p-2 text-[10px] font-mono text-slate-400 space-y-0.5 border border-slate-800">
                          {step.logs.map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Output Payload / Error */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-400">Step Output Data</span>
                      {step.outputData && (
                        <button
                          onClick={() => copyToClipboard(step.outputData, `out_${step.nodeId}`)}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === `out_${step.nodeId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      )}
                    </div>

                    {step.error ? (
                      <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-lg text-rose-300 font-mono text-[11px]">
                        <strong>Error:</strong> {step.error}
                      </div>
                    ) : (
                      <pre className="bg-slate-900 rounded-lg p-2.5 text-[11px] font-mono text-emerald-300 max-h-40 overflow-y-auto border border-slate-800">
                        {JSON.stringify(step.outputData, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { X, History, CheckCircle2, XCircle, Eye, Trash2 } from 'lucide-react';
import type { ExecutionRecord } from '../../types/workflow';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExecutionRecord[];
  onSelectRun: (record: ExecutionRecord) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRun,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Execution History Timeline</h3>
              <p className="text-xs text-slate-400">
                Audit logs and results from previous workflow executions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-950/30 border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Runs List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No executions recorded yet. Run a workflow to view history logs here!
            </div>
          ) : (
            history.map((run) => {
              const isSuccess = run.status === 'success';
              return (
                <div
                  key={run.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {isSuccess ? (
                      <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 font-mono">{run.id}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {run.triggerType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Started: {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-slate-300 block">
                        {run.durationMs}ms
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {run.stepLogs.length} steps executed
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectRun(run);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Log
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

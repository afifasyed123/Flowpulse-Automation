import React from 'react';
import { X, BarChart3, TrendingUp, CheckCircle, Clock, Zap, Layers } from 'lucide-react';
import type { ExecutionRecord } from '../../types/workflow';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExecutionRecord[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  if (!isOpen) return null;

  const totalRuns = history.length;
  const successRuns = history.filter((h) => h.status === 'success').length;
  const failedRuns = history.filter((h) => h.status === 'error').length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
  const avgDuration =
    totalRuns > 0 ? Math.round(history.reduce((acc, cur) => acc + cur.durationMs, 0) / totalRuns) : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Execution Metrics &amp; Analytics</h3>
              <p className="text-xs text-slate-400">
                Performance indicators, SLA reliability, and throughput insights.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Total Runs</span>
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">{totalRuns}</span>
              <span className="text-[10px] text-slate-500 block mt-1">all time triggers</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Success Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{successRate}%</span>
              <span className="text-[10px] text-emerald-500/80 block mt-1">{successRuns} passed / {failedRuns} failed</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Avg Duration</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-bold text-amber-400 font-mono">{avgDuration}ms</span>
              <span className="text-[10px] text-slate-500 block mt-1">end-to-end latency</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Reliability SLA</span>
                <CheckCircle className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-2xl font-bold text-cyan-400 font-mono">99.98%</span>
              <span className="text-[10px] text-slate-500 block mt-1">uptime target</span>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Execution Latency Distribution
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Fast (&lt; 200ms)</span>
                  <span>{history.filter((h) => h.durationMs < 200).length} runs</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalRuns > 0 ? (history.filter((h) => h.durationMs < 200).length / totalRuns) * 100 : 80}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Medium (200ms - 800ms)</span>
                  <span>{history.filter((h) => h.durationMs >= 200 && h.durationMs < 800).length} runs</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalRuns > 0 ? (history.filter((h) => h.durationMs >= 200 && h.durationMs < 800).length / totalRuns) * 100 : 20}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

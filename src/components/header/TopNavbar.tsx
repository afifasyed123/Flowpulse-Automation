import React from 'react';
import {
  Play,
  Sparkles,
  Layers,
  History,
  BarChart3,
  Globe,
  Save,
  Download,
  Upload,
  RotateCcw,
  Workflow,
  Loader2,
  Check,
} from 'lucide-react';

interface TopNavbarProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  onRunWorkflow: () => void;
  isRunning: boolean;
  onOpenTemplates: () => void;
  onOpenAiGenerator: () => void;
  onOpenWebhookTester: () => void;
  onOpenHistory: () => void;
  onOpenAnalytics: () => void;
  onSaveWorkflow: () => void;
  onExportWorkflow: () => void;
  onImportWorkflow: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCanvas: () => void;
  hasSaved?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  workflowName,
  onWorkflowNameChange,
  onRunWorkflow,
  isRunning,
  onOpenTemplates,
  onOpenAiGenerator,
  onOpenWebhookTester,
  onOpenHistory,
  onOpenAnalytics,
  onSaveWorkflow,
  onExportWorkflow,
  onImportWorkflow,
  onClearCanvas,
  hasSaved,
}) => {
  return (
    <header className="h-14 bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 flex items-center justify-between text-slate-200 z-20 select-none">
      {/* Brand & Workflow Title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-md">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent hidden sm:inline">
            FlowPulse
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Workflow Rename */}
        <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onWorkflowNameChange(e.target.value)}
            className="text-sm font-semibold bg-transparent hover:bg-slate-850 focus:bg-slate-900 px-2 py-1 rounded-lg border border-transparent focus:border-violet-500/80 text-slate-100 focus:outline-none transition-colors truncate"
            title="Click to rename workflow"
          />
        </div>
      </div>

      {/* Center Tools: Templates, AI, Webhook Simulator */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <button
          onClick={onOpenAiGenerator}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden md:inline">AI Builder</span>
        </button>

        <button
          onClick={onOpenWebhookTester}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Webhook Test</span>
        </button>
      </div>

      {/* Right Controls: Save, Export, Import, Stats, Run */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHistory}
          title="Execution History Timeline"
          className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenAnalytics}
          title="Workflow Metrics & Analytics"
          className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Save & Export */}
        <button
          onClick={onSaveWorkflow}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
          title="Save to Local Storage"
        >
          {hasSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden lg:inline">{hasSaved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={onExportWorkflow}
          className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
          title="Export Workflow JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <label
          className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-all"
          title="Import Workflow JSON"
        >
          <Upload className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={onImportWorkflow} className="hidden" />
        </label>

        <button
          onClick={onClearCanvas}
          className="p-2 rounded-lg bg-slate-900/70 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
          title="Clear Canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Primary Run Workflow CTA */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-violet-950/50 transition-all active:scale-95"
          title="Run full workflow (Ctrl + Enter)"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" /> Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white text-white" /> Run Workflow
            </>
          )}
        </button>
      </div>
    </header>
  );
};

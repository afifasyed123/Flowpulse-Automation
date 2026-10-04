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
    <header className="h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 flex items-center justify-between text-slate-200 z-20 select-none">
      {/* Brand & Workflow Title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent hidden sm:inline">
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
            className="text-sm font-semibold bg-transparent hover:bg-slate-800/60 focus:bg-slate-800/80 px-2 py-1 rounded-lg border border-transparent focus:border-indigo-500 text-slate-100 focus:outline-none transition-colors truncate"
            title="Click to rename workflow"
          />
        </div>
      </div>

      {/* Center Tools: Templates, AI, Webhook Simulator */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <button
          onClick={onOpenAiGenerator}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden md:inline">AI Builder</span>
        </button>

        <button
          onClick={onOpenWebhookTester}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Webhook Test</span>
        </button>
      </div>

      {/* Right Controls: Save, Export, Import, Stats, Run */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHistory}
          title="Execution History Timeline"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenAnalytics}
          title="Workflow Metrics & Analytics"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Save & Export */}
        <button
          onClick={onSaveWorkflow}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
          title="Save to Local Storage"
        >
          {hasSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden lg:inline">{hasSaved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={onExportWorkflow}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
          title="Export Workflow JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <label
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 cursor-pointer transition-all"
          title="Import Workflow JSON"
        >
          <Upload className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={onImportWorkflow} className="hidden" />
        </label>

        <button
          onClick={onClearCanvas}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all"
          title="Reset / Clear Canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Primary Run Workflow CTA */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          title="Run full workflow (Ctrl + Enter)"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Run Workflow
            </>
          )}
        </button>
      </div>
    </header>
  );
};

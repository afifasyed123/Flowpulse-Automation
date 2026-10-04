import React from 'react';
import { X, Zap, Activity, Bot, Split, Sparkles, ArrowRight } from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../../data/templates';
import type { WorkflowTemplate } from '../../types/workflow';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Activity,
  Bot,
  Split,
  Sparkles,
};

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Workflow Template Library</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select a pre-configured, production-ready automation workflow to get started instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
          {WORKFLOW_TEMPLATES.map((tpl) => {
            const IconComp = iconMap[tpl.icon] || Zap;
            return (
              <div
                key={tpl.id}
                className="group relative p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-slate-950 transition-all duration-200 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    {tpl.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                        {tpl.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white mb-1.5">
                    {tpl.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 block mb-2">
                    {tpl.category} • {tpl.nodes.length} nodes
                  </span>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-400 font-medium">Ready to deploy</span>
                  <button
                    onClick={() => {
                      onSelectTemplate(tpl);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all"
                  >
                    Use Template <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

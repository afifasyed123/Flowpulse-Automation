import React, { useState } from 'react';
import { X, Sparkles, Bot, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { generateWorkflowFromPrompt } from '../../engine/aiWorkflowGenerator';
import type { GeneratedWorkflow } from '../../engine/aiWorkflowGenerator';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedWorkflow: (wf: GeneratedWorkflow) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedWorkflow,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedWorkflow | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'When a lead signs up via webhook, check if annual budget >= $50,000, if yes alert VIP Slack channel, else store in CRM queue.',
    'Every 15 minutes, ping our payment microservice API. If status is not 200, execute auto-restart code script and send urgent alert to Ops.',
    'When customer submits a ticket form, run AI sentiment analysis. If negative, immediately escalate to Tier-3 team on Slack.',
    'Listen for GitHub release webhooks, format changelog with data transform, and dispatch notification to Discord channel.',
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPreview(null);

    setTimeout(() => {
      const generated = generateWorkflowFromPrompt(prompt);
      setGeneratedPreview(generated);
      setIsGenerating(false);
    }, 700);
  };

  const handleApply = () => {
    if (generatedPreview) {
      onApplyGeneratedWorkflow(generatedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Natural Language Workflow Generator</h3>
              <p className="text-xs text-slate-400">
                Describe your automation logic in plain English, and FlowPulse AI will generate the wired DAG.
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              What workflow would you like to build?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. When a webhook arrives, extract user email, query the API, check if status is active, and send a Slack notification..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 leading-relaxed font-sans"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg transition-all"
              >
                {isGenerating ? (
                  <>
                    <Bot className="w-3.5 h-3.5 animate-spin" /> Synthesizing DAG...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Generate Workflow
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Or click a prompt idea:</span>
            </div>
            <div className="space-y-1.5">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(sp)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all line-clamp-1"
                >
                  "{sp}"
                </button>
              ))}
            </div>
          </div>

          {/* Generated Result Preview */}
          {generatedPreview && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Workflow Generated Successfully!</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {generatedPreview.nodes.length} Nodes • {generatedPreview.edges.length} Edges
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {generatedPreview.nodes.map((n, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-300"
                  >
                    {i + 1}. {n.data.label}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApply}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition-all"
                >
                  Load to Visual Editor <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

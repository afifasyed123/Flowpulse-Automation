import React, { useState } from 'react';
import { X, Globe, Copy, Check, Send, Terminal } from 'lucide-react';

interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerWebhook: (payload: any) => void;
}

export const WebhookTesterModal: React.FC<WebhookTesterModalProps> = ({
  isOpen,
  onClose,
  onTriggerWebhook,
}) => {
  const [copied, setCopied] = useState(false);
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      {
        event: 'order.created',
        orderId: 'ord_live_8849',
        customer: {
          name: 'Elena Rostova',
          email: 'elena@cybernetics.io',
          company: 'Cybernetics AI',
        },
        annualBudget: 75000,
        currency: 'USD',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const webhookUrl = 'https://flowpulse.internal/api/v1/webhooks/inbound-live-stream';
  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-FlowPulse-Signature: sha256=9f83...a12c" \\
  -d '${payloadText.replace(/\n\s*/g, ' ')}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFireWebhook = () => {
    try {
      const parsed = JSON.parse(payloadText);
      setJsonError(null);
      onTriggerWebhook(parsed);
      onClose();
    } catch (err: any) {
      setJsonError('Invalid JSON format: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Webhook Event Simulator</h3>
              <p className="text-xs text-slate-400">
                Trigger your workflow via simulated incoming webhook payloads.
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Listening Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* cURL snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> cURL Command
              </label>
              <button
                onClick={handleCopyCurl}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy cURL
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {curlSnippet}
            </pre>
          </div>

          {/* JSON Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Test Webhook Payload (JSON)
            </label>
            <textarea
              rows={6}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-500"
            />
            {jsonError && (
              <p className="text-rose-400 text-xs mt-1 font-medium">{jsonError}</p>
            )}
          </div>

          {/* Fire button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleFireWebhook}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Test Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

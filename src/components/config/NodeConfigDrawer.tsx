import React, { useState } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Code2,
  Info,
} from 'lucide-react';
import type { BaseNodeData } from '../../types/workflow';
import { WorkflowExecutor } from '../../engine/executor';

interface NodeConfigDrawerProps {
  nodeId: string | null;
  nodeData: BaseNodeData | null;
  allNodes: Array<{ id: string; data: BaseNodeData }>;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, updatedData: Partial<BaseNodeData>) => void;
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  nodeId,
  nodeData,
  allNodes,
  onClose,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'variables'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!nodeId || !nodeData) return null;

  const config = nodeData.config || {};

  const handleFieldChange = (key: string, value: any) => {
    onUpdateConfig(nodeId, {
      config: {
        ...config,
        [key]: value,
      },
    });
  };

  const handleLabelChange = (newLabel: string) => {
    onUpdateConfig(nodeId, {
      label: newLabel,
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run single isolated node test
  const handleTestSingleNode = async () => {
    setIsTesting(true);
    setTestOutput(null);
    setTestLogs([]);

    try {
      const mockGraph = {
        nodes: [{ id: nodeId, data: nodeData }],
        edges: [],
      };
      const executor = new WorkflowExecutor(mockGraph, {
        triggerPayload: {
          event: 'single_node_test',
          user: { id: 'usr_mock_1', email: 'tester@flowpulse.io', name: 'Dev Tester', plan: 'Pro' },
          data: { amount: 2500, score: 88, status: 'active', message: 'Test message for isolation validation' },
        },
      });

      const singleLog = await executor.executeSingleNode(mockGraph.nodes[0]);
      setTestOutput(singleLog.outputData || { status: singleLog.status, error: singleLog.error });
      setTestLogs(singleLog.logs || []);
    } catch (err: any) {
      setTestOutput({ error: err.message });
      setTestLogs([`Error executing test: ${err.message}`]);
    } finally {
      setIsTesting(false);
    }
  };

  // Extract upstream variables for helper
  const availableVariables = [
    { label: 'Built-in Current Timestamp', value: '{{$now}}', example: '"2:45:00 PM"' },
    { label: 'Built-in ISO Date', value: '{{$isoDate}}', example: '"2026-10-04T14:30:00.000Z"' },
    { label: 'Built-in Unique UUID', value: '{{$uuid}}', example: '"d82a1b9c-..."' },
    { label: 'Trigger User Email', value: '{{trigger.user.email}}', example: '"user@example.com"' },
    { label: 'Trigger User Name', value: '{{trigger.user.name}}', example: '"Alex Rivera"' },
    { label: 'Trigger Payload Data', value: '{{trigger.data}}', example: '{"amount": 1500}' },
  ];

  allNodes.forEach((n) => {
    if (n.id !== nodeId) {
      availableVariables.push({
        label: `Output from [${n.data.label}]`,
        value: `{{nodes.${n.id}.output}}`,
        example: `Result of node ${n.id}`,
      });
    }
  });

  return (
    <div className="fixed top-0 right-0 h-full w-[460px] bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-40 flex flex-col text-slate-200 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {nodeData.type}
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {nodeId}</span>
          </div>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="text-base font-semibold bg-transparent hover:bg-slate-800/60 focus:bg-slate-800/80 px-1.5 py-0.5 rounded border border-transparent focus:border-indigo-500 text-slate-100 w-full focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 px-4 bg-slate-950/30">
        <button
          onClick={() => setActiveTab('config')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'config'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'test'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-3 h-3" /> Test Sandbox
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'variables'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Variables (&#123;&#123;&#125;&#125;)
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'config' && (
          <>
            {/* --- HTTP ACTION CONFIG --- */}
            {nodeData.type === 'action_http' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    HTTP Method &amp; Endpoint URL
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={config.method || 'GET'}
                      onChange={(e) => handleFieldChange('method', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                    <input
                      type="text"
                      placeholder="https://api.example.com/data"
                      value={config.url || ''}
                      onChange={(e) => handleFieldChange('url', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Request Headers (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={
                      typeof config.headers === 'string'
                        ? config.headers
                        : JSON.stringify(config.headers || { 'Content-Type': 'application/json' }, null, 2)
                    }
                    onChange={(e) => {
                      try {
                        handleFieldChange('headers', JSON.parse(e.target.value));
                      } catch {
                        handleFieldChange('headers', e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {config.method !== 'GET' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Request Body (Supports &#123;&#123;expressions&#125;&#125;)
                    </label>
                    <textarea
                      rows={4}
                      value={
                        typeof config.body === 'string'
                          ? config.body
                          : JSON.stringify(config.body || { email: '{{trigger.user.email}}' }, null, 2)
                      }
                      onChange={(e) => handleFieldChange('body', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-blue-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Retries & Timeout */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Retries</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={config.retryCount || 1}
                      onChange={(e) => handleFieldChange('retryCount', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Timeout (ms)</label>
                    <input
                      type="number"
                      step={500}
                      value={config.timeoutMs || 5000}
                      onChange={(e) => handleFieldChange('timeoutMs', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- JAVASCRIPT CODE ACTION --- */}
            {nodeData.type === 'action_code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" /> JavaScript Script
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Parameters: (input, context, console, env)</span>
                </div>
                <textarea
                  rows={9}
                  value={config.code || ''}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar"
                />
                <p className="text-[11px] text-slate-400">
                  Return any JSON object from this function. It will be passed to downstream nodes.
                </p>
              </div>
            )}

            {/* --- AI INTELLIGENCE CONFIG --- */}
            {nodeData.type === 'action_ai' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    AI Task Type
                  </label>
                  <select
                    value={config.task || 'sentiment'}
                    onChange={(e) => handleFieldChange('task', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-pink-300 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sentiment">Sentiment &amp; Urgency Analyzer</option>
                    <option value="classify">Ticket Classifier &amp; Router</option>
                    <option value="extract">Entity &amp; Contact Extractor</option>
                    <option value="summarize">Text Summarizer &amp; Digest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    AI Prompt Template
                  </label>
                  <textarea
                    rows={4}
                    value={config.prompt || ''}
                    onChange={(e) => handleFieldChange('prompt', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    placeholder="e.g. Analyze tone of message: {{trigger.message}}"
                  />
                </div>
              </div>
            )}

            {/* --- DATA TRANSFORM CONFIG --- */}
            {nodeData.type === 'action_transform' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Transform Mode
                  </label>
                  <select
                    value={config.mode || 'json_map'}
                    onChange={(e) => handleFieldChange('mode', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-medium"
                  >
                    <option value="json_map">JSON Schema Mapping</option>
                    <option value="template">Text Template Interpolation</option>
                    <option value="math">Math Arithmetic Operation</option>
                  </select>
                </div>

                {config.mode === 'template' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Template String
                    </label>
                    <textarea
                      rows={4}
                      value={config.template || 'Hello {{trigger.user.name}}, order {{trigger.orderId}} is confirmed!'}
                      onChange={(e) => handleFieldChange('template', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                ) : config.mode === 'math' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Operand A</label>
                        <input
                          type="text"
                          value={config.numA || '{{trigger.amount}}'}
                          onChange={(e) => handleFieldChange('numA', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Operation</label>
                        <select
                          value={config.operation || 'multiply'}
                          onChange={(e) => handleFieldChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="add">+</option>
                          <option value="subtract">-</option>
                          <option value="multiply">×</option>
                          <option value="divide">÷</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Operand B</label>
                        <input
                          type="text"
                          value={config.numB || '1.2'}
                          onChange={(e) => handleFieldChange('numB', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Schema Mapping (JSON)
                    </label>
                    <textarea
                      rows={5}
                      value={
                        typeof config.mappings === 'string'
                          ? config.mappings
                          : JSON.stringify(
                              config.mappings || {
                                customerName: '{{trigger.user.name}}',
                                email: '{{trigger.user.email}}',
                                recorded: '{{$isoDate}}',
                              },
                              null,
                              2
                            )
                      }
                      onChange={(e) => {
                        try {
                          handleFieldChange('mappings', JSON.parse(e.target.value));
                        } catch {
                          handleFieldChange('mappings', e.target.value);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-emerald-300 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* --- NOTIFICATION CONFIG --- */}
            {nodeData.type === 'action_notification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Delivery Channel
                  </label>
                  <input
                    type="text"
                    value={config.channel || 'Slack #alerts'}
                    onChange={(e) => handleFieldChange('channel', e.target.value)}
                    placeholder="e.g. Slack #alerts, Discord #general, Email"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={config.subject || 'Workflow Alert'}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Message Body Template
                  </label>
                  <textarea
                    rows={4}
                    value={config.message || ''}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-sans"
                    placeholder="Message to send..."
                  />
                </div>
              </div>
            )}

            {/* --- IF / ELSE CONDITION CONFIG --- */}
            {nodeData.type === 'condition_if_else' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    When true, follows the <strong>TRUE (green)</strong> handle. When false, follows the{' '}
                    <strong>FALSE (red)</strong> handle.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Left Operand (Field / Variable)
                  </label>
                  <input
                    type="text"
                    value={config.leftValue || '{{trigger.data.amount}}'}
                    onChange={(e) => handleFieldChange('leftValue', e.target.value)}
                    placeholder="{{trigger.data.amount}}"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Operator
                  </label>
                  <select
                    value={config.operator || 'greater_than'}
                    onChange={(e) => handleFieldChange('operator', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold"
                  >
                    <option value="greater_than">Greater than (&gt;)</option>
                    <option value="greater_or_equal">Greater than or equal (&ge;)</option>
                    <option value="less_than">Less than (&lt;)</option>
                    <option value="less_or_equal">Less than or equal (&le;)</option>
                    <option value="equals">Equals (==)</option>
                    <option value="not_equals">Not equals (!=)</option>
                    <option value="contains">Contains substring</option>
                    <option value="not_empty">Is not empty / null</option>
                    <option value="regex">Matches Regex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Right Operand (Comparison Value)
                  </label>
                  <input
                    type="text"
                    value={config.rightValue !== undefined ? config.rightValue : 1000}
                    onChange={(e) => handleFieldChange('rightValue', e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {/* --- DELAY ACTION CONFIG --- */}
            {nodeData.type === 'action_delay' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Delay Duration (Seconds)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={config.seconds || 2}
                    onChange={(e) => handleFieldChange('seconds', Number(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-sm font-bold text-indigo-400 font-mono w-12 text-right">
                    {config.seconds || 2}s
                  </span>
                </div>
              </div>
            )}

            {/* --- KV STORE CONFIG --- */}
            {nodeData.type === 'action_kv_store' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Storage Operation
                  </label>
                  <select
                    value={config.operation || 'set'}
                    onChange={(e) => handleFieldChange('operation', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="set">SET (Save / Overwrite Key)</option>
                    <option value="get">GET (Retrieve Key)</option>
                    <option value="increment">INCREMENT (Counter +1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={config.key || 'users.last_login'}
                    onChange={(e) => handleFieldChange('key', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                {config.operation === 'set' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Value (Supports JSON &amp; Variables)
                    </label>
                    <textarea
                      rows={3}
                      value={
                        typeof config.value === 'string'
                          ? config.value
                          : JSON.stringify(config.value || { status: 'processed' }, null, 2)
                      }
                      onChange={(e) => handleFieldChange('value', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-cyan-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* --- AUDIT LOG CONFIG --- */}
            {nodeData.type === 'action_log' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Log Level
                  </label>
                  <select
                    value={config.level || 'INFO'}
                    onChange={(e) => handleFieldChange('level', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Log Message
                  </label>
                  <textarea
                    rows={3}
                    value={config.message || ''}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* --- TRIGGER CONFIGS --- */}
            {nodeData.category === 'trigger' && (
              <div className="space-y-4">
                {nodeData.type === 'trigger_schedule' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Cron Schedule Expression
                    </label>
                    <input
                      type="text"
                      value={config.cron || '*/15 * * * *'}
                      onChange={(e) => handleFieldChange('cron', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['*/5 * * * * (5m)', '0 * * * * (1h)', '0 0 * * * (Daily)'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleFieldChange('cron', p.split(' ')[0] + ' * * * *')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {nodeData.type === 'trigger_webhook' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Webhook Endpoint Path
                    </label>
                    <input
                      type="text"
                      value={config.endpoint || '/webhooks/v1/inbound'}
                      onChange={(e) => handleFieldChange('endpoint', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Default Test Payload (JSON)
                  </label>
                  <textarea
                    rows={5}
                    value={
                      typeof config.defaultPayload === 'string'
                        ? config.defaultPayload
                        : JSON.stringify(
                            config.defaultPayload || {
                              event: 'order.placed',
                              user: { id: 'usr_882', email: 'sam@example.com', name: 'Sam Taylor' },
                              data: { amount: 3200, currency: 'USD' },
                            },
                            null,
                            2
                          )
                    }
                    onChange={(e) => {
                      try {
                        handleFieldChange('defaultPayload', JSON.parse(e.target.value));
                      } catch {
                        handleFieldChange('defaultPayload', e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-purple-300"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* --- TEST SANDBOX TAB --- */}
        {activeTab === 'test' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">Test Node in Isolation</span>
                <button
                  onClick={handleTestSingleNode}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isTesting ? 'Running...' : 'Run Test'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Runs this node with sample context and displays immediate output and logs.
              </p>
            </div>

            {testLogs.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Console &amp; Execution Logs
                </span>
                <div className="bg-slate-950 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 max-h-36 overflow-y-auto space-y-1 border border-slate-800">
                  {testLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            {testOutput && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Output Data Payload
                </span>
                <pre className="bg-slate-950 rounded-lg p-3 text-[11px] font-mono text-emerald-300 max-h-56 overflow-y-auto border border-slate-800">
                  {JSON.stringify(testOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* --- VARIABLES HELPER TAB --- */}
        {activeTab === 'variables' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any variable expression below to copy and paste into any text field or JSON body.
            </p>

            <div className="space-y-2">
              {availableVariables.map((v, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between group transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] text-slate-400 block">{v.label}</span>
                    <code className="text-xs text-indigo-300 font-mono block truncate font-bold">
                      {v.value}
                    </code>
                    <span className="text-[10px] text-slate-500 font-mono">Ex: {v.example}</span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(v.value, v.value)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all flex-shrink-0"
                    title="Copy expression"
                  >
                    {copiedKey === v.value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

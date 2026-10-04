import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type {
  Node,
  Connection,
  ReactFlowInstance,
} from '@xyflow/react';
import confetti from 'canvas-confetti';

import type { BaseNodeData, ExecutionRecord, NodeCategory, NodeType, WorkflowTemplate } from './types/workflow';
import { WORKFLOW_TEMPLATES } from './data/templates';
import { WorkflowExecutor } from './engine/executor';
import type { GeneratedWorkflow } from './engine/aiWorkflowGenerator';

import { TopNavbar } from './components/header/TopNavbar';
import { NodeSidebar } from './components/sidebar/NodeSidebar';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas';
import { NodeConfigDrawer } from './components/config/NodeConfigDrawer';
import { ExecutionDrawer } from './components/execution/ExecutionDrawer';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { AiGeneratorModal } from './components/modals/AiGeneratorModal';
import { WebhookTesterModal } from './components/modals/WebhookTesterModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { AnalyticsModal } from './components/modals/AnalyticsModal';

export const App: React.FC = () => {
  // Initial default workflow from Lead Enrichment template
  const defaultTemplate = WORKFLOW_TEMPLATES[0];

  const [workflowName, setWorkflowName] = useState<string>('VIP Lead Enrichment & CRM Pipeline');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BaseNodeData>>(defaultTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultTemplate.edges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Selected Node for Config Drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Execution & Logs State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [executionRecord, setExecutionRecord] = useState<ExecutionRecord | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState<boolean>(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isWebhookTesterOpen, setIsWebhookTesterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const activeExecutorRef = useRef<WorkflowExecutor | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load saved workflow or history from LocalStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('flowpulse_history');
      if (savedHistory) {
        setExecutionHistory(JSON.parse(savedHistory));
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  // Keyboard Shortcuts (Ctrl+Enter to run, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunWorkflow();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWorkflow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, workflowName]);

  // Connect Handles
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Quick Action: Delete Node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setNodes, setEdges]
  );

  // Quick Action: Test Node Single
  const handleTestNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Add Node from Sidebar Palette
  const handleAddNode = useCallback(
    (type: NodeType, defaultConfig: Record<string, any>, label: string, category: NodeCategory) => {
      const id = `node_${Date.now().toString(36)}`;
      const position = {
        x: 300 + Math.random() * 150,
        y: 180 + Math.random() * 150,
      };

      const newNode: Node<BaseNodeData> = {
        id,
        type: 'customNode',
        position,
        data: {
          label,
          type,
          category,
          config: defaultConfig,
          status: 'idle',
          onSelectNode: (targetId: string) => setSelectedNodeId(targetId),
          onDeleteNode: (targetId: string) => handleDeleteNode(targetId),
          onTestNode: (targetId: string) => handleTestNode(targetId),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    [handleDeleteNode, handleTestNode, setNodes]
  );

  // Drag & Drop Node onto Canvas
  const handleDropNode = useCallback(
    (type: NodeType, label: string, category: NodeCategory, config: any, position: { x: number; y: number }) => {
      const id = `node_${Date.now().toString(36)}`;
      const newNode: Node<BaseNodeData> = {
        id,
        type: 'customNode',
        position,
        data: {
          label,
          type,
          category,
          config,
          status: 'idle',
          onSelectNode: (targetId: string) => setSelectedNodeId(targetId),
          onDeleteNode: (targetId: string) => handleDeleteNode(targetId),
          onTestNode: (targetId: string) => handleTestNode(targetId),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    [handleDeleteNode, handleTestNode, setNodes]
  );

  // Update Node Config / Label
  const handleUpdateConfig = useCallback(
    (nodeId: string, updatedData: Partial<BaseNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updatedData,
                config: {
                  ...node.data.config,
                  ...(updatedData.config || {}),
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Attach callbacks to nodes whenever nodes change
  const augmentedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onSelectNode: (id: string) => setSelectedNodeId(id),
      onDeleteNode: (id: string) => handleDeleteNode(id),
      onTestNode: (id: string) => handleTestNode(id),
    },
  }));

  // Run Workflow Execution Engine
  const handleRunWorkflow = async (customPayload?: any) => {
    if (isRunning) return;

    // Check if canvas is empty
    if (!nodes || nodes.length === 0) {
      showToast('Canvas is empty. Drag blocks from the palette or choose a template to run.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setShowLogsDrawer(true);

    // Reset all node statuses to idle
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle', executionDuration: undefined },
      }))
    );

    // Reset edge styling
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        className: '',
      }))
    );

    const graph = {
      nodes: nodes.map((n) => ({ id: n.id, data: n.data, position: n.position })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };

    const executor = new WorkflowExecutor(graph, {
      triggerPayload: customPayload,
      stepDelayMs: 400, // Visual delay to show step-by-step progress
      onNodeStart: (nodeId) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'running' } }
              : n
          )
        );
        // Animate incoming edge
        setEdges((eds) =>
          eds.map((e) =>
            e.target === nodeId ? { ...e, className: 'running' } : e
          )
        );
      },
      onNodeFinish: (nodeId, stepLog) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: stepLog.status,
                    executionDuration: stepLog.durationMs,
                    lastOutput: stepLog.outputData,
                    lastError: stepLog.error,
                  },
                }
              : n
          )
        );
        setEdges((eds) =>
          eds.map((e) =>
            e.source === nodeId
              ? { ...e, className: stepLog.status === 'success' ? 'success' : '' }
              : e
          )
        );
      },
    });

    activeExecutorRef.current = executor;

    try {
      const record = await executor.execute();
      setExecutionRecord(record);

      // Save to history
      const newHistory = [record, ...executionHistory].slice(0, 50);
      setExecutionHistory(newHistory);
      try {
        localStorage.setItem('flowpulse_history', JSON.stringify(newHistory));
      } catch {
        // Ignore storage error
      }

      // ONLY celebrate if execution actually succeeded AND executed at least 1 step!
      if (record.status === 'success' && record.stepLogs && record.stepLogs.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#10b981', '#06b6d4', '#f59e0b'],
        });
      }
    } catch (err: any) {
      console.error('Workflow execution failed:', err);
    } finally {
      setIsRunning(false);
      activeExecutorRef.current = null;
    }
  };

  // Pause / Resume Debugger
  const handlePauseExecution = () => {
    activeExecutorRef.current?.pause();
    setIsPaused(true);
  };

  const handleResumeExecution = () => {
    activeExecutorRef.current?.resume();
    setIsPaused(false);
  };

  // Select Template
  const handleSelectTemplate = (tpl: WorkflowTemplate) => {
    setWorkflowName(tpl.title);
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
    setSelectedNodeId(null);
    setExecutionRecord(null);
    setShowLogsDrawer(false);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
    }, 100);
  };

  // Apply AI Generated Workflow
  const handleApplyAiWorkflow = (wf: GeneratedWorkflow) => {
    setWorkflowName(wf.title);
    setNodes(wf.nodes);
    setEdges(wf.edges);
    setSelectedNodeId(null);
    setExecutionRecord(null);
    setShowLogsDrawer(false);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
    }, 100);
  };

  // Save to LocalStorage
  const handleSaveWorkflow = () => {
    const currentWf = {
      name: workflowName,
      nodes,
      edges,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('flowpulse_saved_workflow', JSON.stringify(currentWf));
    setHasSaved(true);
    showToast('Workflow saved successfully.');
    setTimeout(() => setHasSaved(false), 2000);
  };

  // Export JSON file
  const handleExportWorkflow = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            name: workflowName,
            nodes,
            edges,
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${workflowName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_workflow.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.nodes && parsed.edges) {
          if (parsed.name) setWorkflowName(parsed.name);
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          setSelectedNodeId(null);
          setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 100);
          showToast('Workflow imported successfully.');
        }
      } catch (err: any) {
        alert('Invalid workflow JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset / Clear Canvas
  const handleClearCanvas = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Clear all blocks from the canvas?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setExecutionRecord(null);
      setShowLogsDrawer(false);
      showToast('Canvas cleared.');
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a13] font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-slate-700 text-xs font-medium text-slate-200 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <TopNavbar
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        onRunWorkflow={() => handleRunWorkflow()}
        isRunning={isRunning}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenWebhookTester={() => setIsWebhookTesterOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onSaveWorkflow={handleSaveWorkflow}
        onExportWorkflow={handleExportWorkflow}
        onImportWorkflow={handleImportWorkflow}
        onClearCanvas={handleClearCanvas}
        hasSaved={hasSaved}
      />

      {/* Main Workspace: Left Sidebar + Visual Canvas */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Block Palette Sidebar */}
        <NodeSidebar onAddNode={handleAddNode} />

        {/* Center Visual Workflow Canvas */}
        <WorkflowCanvas
          nodes={augmentedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDropNode={handleDropNode}
          reactFlowInstance={reactFlowInstance}
          setReactFlowInstance={setReactFlowInstance}
        />

        {/* Right Node Configuration Drawer */}
        <NodeConfigDrawer
          nodeId={selectedNodeId}
          nodeData={selectedNode ? selectedNode.data : null}
          allNodes={nodes.map((n) => ({ id: n.id, data: n.data }))}
          onClose={() => setSelectedNodeId(null)}
          onUpdateConfig={handleUpdateConfig}
        />

        {/* Bottom Live Execution Logs Drawer */}
        {showLogsDrawer && (
          <ExecutionDrawer
            executionRecord={executionRecord}
            isRunning={isRunning}
            isPaused={isPaused}
            onClose={() => setShowLogsDrawer(false)}
            onPause={handlePauseExecution}
            onResume={handleResumeExecution}
          />
        )}
      </div>

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <AiGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onApplyGeneratedWorkflow={handleApplyAiWorkflow}
      />

      <WebhookTesterModal
        isOpen={isWebhookTesterOpen}
        onClose={() => setIsWebhookTesterOpen(false)}
        onTriggerWebhook={(payload) => handleRunWorkflow(payload)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={executionHistory}
        onSelectRun={(run) => {
          setExecutionRecord(run);
          setShowLogsDrawer(true);
        }}
        onClearHistory={() => {
          setExecutionHistory([]);
          localStorage.removeItem('flowpulse_history');
        }}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        history={executionHistory}
      />
    </div>
  );
};

export default App;

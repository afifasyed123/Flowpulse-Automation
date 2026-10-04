import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
} from '@xyflow/react';
import { CustomNode } from '../nodes/CustomNode';
import type { BaseNodeData, NodeCategory, NodeType } from '../../types/workflow';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

interface WorkflowCanvasProps {
  nodes: Node<BaseNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<BaseNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onDropNode: (type: NodeType, label: string, category: NodeCategory, config: any, position: { x: number; y: number }) => void;
  reactFlowInstance: any;
  setReactFlowInstance: (instance: any) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDropNode,
  setReactFlowInstance,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type') as NodeType;
      const label = event.dataTransfer.getData('application/reactflow-label');
      const category = event.dataTransfer.getData('application/reactflow-category') as NodeCategory;
      const configStr = event.dataTransfer.getData('application/reactflow-config');

      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      let config = {};
      try {
        config = JSON.parse(configStr);
      } catch {
        config = {};
      }

      onDropNode(type, label, category, config, position);
    },
    [onDropNode]
  );

  return (
    <div className="flex-1 h-full w-full relative bg-slate-950" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
        className="touch-none"
      >
        {/* Canvas Background with subtle grid dots */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#334155"
          className="opacity-40"
        />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(node) => {
            const n = node as Node<BaseNodeData>;
            if (n.data?.category === 'trigger') return '#a855f7';
            if (n.data?.category === 'condition') return '#f59e0b';
            if (n.data?.category === 'transform') return '#10b981';
            if (n.data?.category === 'ai') return '#ec4899';
            return '#3b82f6';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          position="bottom-left"
          className="!m-4 !border-slate-800 shadow-2xl"
          zoomable
          pannable
        />

        {/* Floating Canvas Controls */}
        <Controls
          position="bottom-left"
          className="!m-4 !mb-40 !border-slate-800 shadow-2xl"
          showInteractive={false}
        />

        {/* Bottom Legend Overlay */}
        <Panel position="top-right" className="!m-4">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Trigger
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Action
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Condition
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" /> AI
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

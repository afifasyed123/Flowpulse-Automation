import type { BaseNodeData, NodeType } from '../types/workflow';

export interface GeneratedWorkflow {
  title: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: BaseNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    animated?: boolean;
  }>;
}

export function generateWorkflowFromPrompt(prompt: string): GeneratedWorkflow {
  const p = prompt.toLowerCase();

  // 1. Determine Trigger
  let triggerType: NodeType = 'trigger_manual';
  let triggerLabel = 'Manual Trigger';
  let triggerConfig: Record<string, any> = {
    defaultPayload: { event: 'custom_trigger', data: { amount: 1500, user: 'alex@example.com' } },
  };

  if (p.includes('webhook') || p.includes('stripe') || p.includes('github') || p.includes('payment')) {
    triggerType = 'trigger_webhook';
    triggerLabel = 'Incoming Webhook Event';
    triggerConfig = { method: 'POST', endpoint: '/webhooks/ai-generated' };
  } else if (p.includes('every') || p.includes('schedule') || p.includes('cron') || p.includes('daily') || p.includes('hourly')) {
    triggerType = 'trigger_schedule';
    triggerLabel = 'Scheduled Timer (Cron)';
    triggerConfig = { cron: p.includes('hourly') ? '0 * * * *' : '*/15 * * * *' };
  } else if (p.includes('form') || p.includes('submit') || p.includes('ticket') || p.includes('feedback')) {
    triggerType = 'trigger_form';
    triggerLabel = 'Customer Submission Form';
    triggerConfig = { formTitle: 'Inbound Feedback Form' };
  }

  // 2. Identify Intermediate Actions & Conditions
  const nodes: GeneratedWorkflow['nodes'] = [];
  const edges: GeneratedWorkflow['edges'] = [];

  let currentX = 50;
  const baseY = 220;
  let prevNodeId = 'node_1';

  // Add Trigger Node
  nodes.push({
    id: prevNodeId,
    type: 'customNode',
    position: { x: currentX, y: baseY },
    data: {
      label: triggerLabel,
      type: triggerType,
      category: 'trigger',
      config: triggerConfig,
    },
  });

  let nodeCounter = 2;

  // Check for AI / Sentiment
  if (p.includes('ai') || p.includes('sentiment') || p.includes('summarize') || p.includes('classify')) {
    currentX += 340;
    const aiNodeId = `node_${nodeCounter++}`;
    const task = p.includes('sentiment') ? 'sentiment' : p.includes('classify') ? 'classify' : 'summarize';
    nodes.push({
      id: aiNodeId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: `AI ${task.toUpperCase()} Intelligence`,
        type: 'action_ai',
        category: 'ai',
        config: {
          task,
          prompt: `Analyze incoming input: {{trigger.text || trigger.data}}`,
        },
      },
    });
    edges.push({ id: `e_${prevNodeId}_${aiNodeId}`, source: prevNodeId, target: aiNodeId, animated: true });
    prevNodeId = aiNodeId;
  }

  // Check for HTTP / API fetch
  if (p.includes('api') || p.includes('http') || p.includes('fetch') || p.includes('ping') || p.includes('clearbit')) {
    currentX += 340;
    const httpNodeId = `node_${nodeCounter++}`;
    nodes.push({
      id: httpNodeId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: 'HTTP REST API Request',
        type: 'action_http',
        category: 'action',
        config: {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET',
          retryCount: 2,
        },
      },
    });
    edges.push({ id: `e_${prevNodeId}_${httpNodeId}`, source: prevNodeId, target: httpNodeId, animated: true });
    prevNodeId = httpNodeId;
  }

  // Check for Condition / Branching
  const hasCondition = p.includes('if') || p.includes('check') || p.includes('filter') || p.includes('greater') || p.includes('condition');

  if (hasCondition) {
    currentX += 340;
    const condNodeId = `node_${nodeCounter++}`;
    
    // Extract condition if possible
    let operator = 'greater_than';
    let rightVal: any = 100;
    if (p.includes('negative')) {
      operator = 'equals';
      rightVal = 'NEGATIVE';
    } else if (p.includes('200')) {
      operator = 'equals';
      rightVal = 200;
    }

    nodes.push({
      id: condNodeId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: 'Condition Check & Route',
        type: 'condition_if_else',
        category: 'condition',
        config: {
          leftValue: '{{trigger.amount || nodes.node_2.output.sentiment || 150}}',
          operator,
          rightValue: rightVal,
        },
      },
    });
    edges.push({ id: `e_${prevNodeId}_${condNodeId}`, source: prevNodeId, target: condNodeId, animated: true });

    // Branch A (True)
    currentX += 360;
    const trueActionId = `node_${nodeCounter++}`;
    nodes.push({
      id: trueActionId,
      type: 'customNode',
      position: { x: currentX, y: baseY - 120 },
      data: {
        label: p.includes('slack') ? 'Send Slack Alert (#priority)' : 'Dispatch Priority Notification',
        type: 'action_notification',
        category: 'action',
        config: {
          channel: 'Slack #alerts-channel',
          subject: 'Priority Trigger Notification',
          message: 'Workflow condition met! Target value: {{trigger.amount || "verified"}}',
        },
      },
    });
    edges.push({
      id: `e_${condNodeId}_${trueActionId}`,
      source: condNodeId,
      target: trueActionId,
      sourceHandle: 'true',
      animated: true,
    });

    // Branch B (False)
    const falseActionId = `node_${nodeCounter++}`;
    nodes.push({
      id: falseActionId,
      type: 'customNode',
      position: { x: currentX, y: baseY + 120 },
      data: {
        label: 'Log / Store to Database',
        type: 'action_kv_store',
        category: 'action',
        config: {
          operation: 'set',
          key: 'records.{{$uuid}}',
          value: { status: 'standard_processed', time: '{{$now}}' },
        },
      },
    });
    edges.push({
      id: `e_${condNodeId}_${falseActionId}`,
      source: condNodeId,
      target: falseActionId,
      sourceHandle: 'false',
      animated: true,
    });

    // Final Join Audit Log
    currentX += 340;
    const finalLogId = `node_${nodeCounter++}`;
    nodes.push({
      id: finalLogId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: 'Audit Log Execution',
        type: 'action_log',
        category: 'action',
        config: {
          level: 'INFO',
          message: 'AI generated workflow finished execution run {{$uuid}}',
        },
      },
    });
    edges.push({ id: `e_${trueActionId}_${finalLogId}`, source: trueActionId, target: finalLogId, animated: true });
    edges.push({ id: `e_${falseActionId}_${finalLogId}`, source: falseActionId, target: finalLogId, animated: true });
  } else {
    // Linear pipeline
    currentX += 340;
    const actionId = `node_${nodeCounter++}`;
    nodes.push({
      id: actionId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: 'Dispatch Notification',
        type: 'action_notification',
        category: 'action',
        config: {
          channel: 'Slack #general',
          subject: 'Workflow Automated Dispatch',
          message: 'Automation task executed successfully at {{$now}}',
        },
      },
    });
    edges.push({ id: `e_${prevNodeId}_${actionId}`, source: prevNodeId, target: actionId, animated: true });

    currentX += 340;
    const logId = `node_${nodeCounter++}`;
    nodes.push({
      id: logId,
      type: 'customNode',
      position: { x: currentX, y: baseY },
      data: {
        label: 'Audit & Metric Store',
        type: 'action_log',
        category: 'action',
        config: {
          level: 'INFO',
          message: 'Completed pipeline with run id {{$uuid}}',
        },
      },
    });
    edges.push({ id: `e_${actionId}_${logId}`, source: actionId, target: logId, animated: true });
  }

  return {
    title: prompt.slice(0, 48) + (prompt.length > 48 ? '...' : ''),
    description: `Auto-generated workflow DAG based on instruction: "${prompt}"`,
    nodes,
    edges,
  };
}

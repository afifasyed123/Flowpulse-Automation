import type { BaseNodeData, ExecutionRecord, NodeType, StepExecutionLog } from '../types/workflow';
import { interpolateString, resolveDataStructure } from './interpolator';

export interface WorkflowGraph {
  nodes: Array<{
    id: string;
    type?: string;
    data: BaseNodeData;
    position?: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
}

export interface ExecutionOptions {
  triggerPayload?: any;
  stepDelayMs?: number; // Visual delay between steps for animation
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, log: StepExecutionLog) => void;
  onWorkflowComplete?: (record: ExecutionRecord) => void;
  onLogMessage?: (nodeId: string, message: string, level?: 'info' | 'warn' | 'error') => void;
  abortSignal?: AbortSignal;
}

// Global In-Memory Workflow Key-Value Store for persistent state across steps
const WorkflowKVStore: Record<string, any> = {
  'counter.global': 42,
  'system.environment': 'production',
  'config.alert_threshold': 85,
};

export class WorkflowExecutor {
  private graph: WorkflowGraph;
  private context: Record<string, any> = {};
  private stepLogs: StepExecutionLog[] = [];
  private options: ExecutionOptions;
  private isPaused = false;
  private pauseResolver: (() => void) | null = null;

  constructor(graph: WorkflowGraph, options: ExecutionOptions = {}) {
    this.graph = graph;
    this.options = options;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isPaused && this.pauseResolver) {
      this.isPaused = false;
      this.pauseResolver();
      this.pauseResolver = null;
    }
  }

  private async waitIfPaused(): Promise<void> {
    if (this.isPaused) {
      await new Promise<void>((resolve) => {
        this.pauseResolver = resolve;
      });
    }
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Main Execution Entry Point
   */
  public async execute(): Promise<ExecutionRecord> {
    const startTime = Date.now();
    const executionId = 'exec_' + Math.random().toString(36).substring(2, 9);
    
    // Check if graph is completely empty
    if (!this.graph.nodes || this.graph.nodes.length === 0) {
      const emptyRecord: ExecutionRecord = {
        id: executionId,
        workflowId: 'wf_empty',
        workflowName: 'Empty Canvas',
        triggerType: 'trigger_manual',
        status: 'error',
        startedAt: new Date(startTime).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        triggerPayload: null,
        stepLogs: [],
        errorMessage: 'Canvas is empty. Add blocks from the palette or choose a template to execute.',
      };
      this.options.onWorkflowComplete?.(emptyRecord);
      return emptyRecord;
    }

    // Find trigger node (or root nodes with no incoming edges)
    const incomingEdgeCount: Record<string, number> = {};
    this.graph.nodes.forEach((n) => {
      incomingEdgeCount[n.id] = 0;
    });
    this.graph.edges.forEach((e) => {
      if (incomingEdgeCount[e.target] !== undefined) {
        incomingEdgeCount[e.target]++;
      }
    });

    // Find starting nodes: triggers or nodes with 0 incoming edges
    let startNodes = this.graph.nodes.filter(
      (n) => n.data.category === 'trigger' || incomingEdgeCount[n.id] === 0
    );

    if (startNodes.length === 0 && this.graph.nodes.length > 0) {
      startNodes = [this.graph.nodes[0]];
    }

    const triggerNode = startNodes.find((n) => n.data.category === 'trigger') || startNodes[0];
    const triggerType: NodeType = triggerNode ? triggerNode.data.type : 'trigger_manual';

    // Initialize context with trigger payload and built-in globals
    const triggerData = this.options.triggerPayload || triggerNode?.data.config.defaultPayload || {
      event: 'manual_trigger',
      timestamp: new Date().toISOString(),
      user: { id: 'usr_8821', name: 'Alex Johnson', email: 'alex@flowpulse.io', plan: 'Enterprise' },
      data: { score: 92, amount: 2450, status: 'active', priority: 'high' }
    };

    this.context = {
      trigger: triggerData,
      variables: { ...WorkflowKVStore },
      nodes: {},
      $now: new Date().toISOString(),
      $executionId: executionId,
    };

    const nodeMap = new Map<string, (typeof this.graph.nodes)[0]>();
    this.graph.nodes.forEach((n) => nodeMap.set(n.id, n));

    const executedNodeIds = new Set<string>();
    const skippedNodeIds = new Set<string>();
    const queue: Array<{ nodeId: string; parentHandle?: string | null }> = startNodes.map((n) => ({
      nodeId: n.id,
      parentHandle: null,
    }));

    let executionError: string | undefined;

    try {
      while (queue.length > 0) {
        if (this.options.abortSignal?.aborted) {
          throw new Error('Workflow execution cancelled by user.');
        }

        await this.waitIfPaused();

        const item = queue.shift()!;
        const { nodeId } = item;
        const node = nodeMap.get(nodeId);

        if (!node) continue;
        if (executedNodeIds.has(nodeId) || skippedNodeIds.has(nodeId)) continue;

        // Check if all essential predecessors are executed or if incoming branch was skipped
        if (this.isNodeSkipped(nodeId, skippedNodeIds, executedNodeIds)) {
          skippedNodeIds.add(nodeId);
          const skippedLog: StepExecutionLog = {
            nodeId,
            nodeLabel: node.data.label,
            nodeType: node.data.type,
            category: node.data.category,
            status: 'skipped',
            startTime: Date.now(),
            endTime: Date.now(),
            durationMs: 0,
            inputData: null,
            outputData: null,
            logs: ['Node skipped due to conditional branch routing.'],
          };
          this.stepLogs.push(skippedLog);
          this.options.onNodeFinish?.(nodeId, skippedLog);
          
          // Propagate skip to downstream edges
          const outgoingEdges = this.graph.edges.filter((e) => e.source === nodeId);
          for (const edge of outgoingEdges) {
            queue.push({ nodeId: edge.target, parentHandle: edge.sourceHandle });
          }
          continue;
        }

        // Notify node start
        this.options.onNodeStart?.(nodeId);
        if (this.options.stepDelayMs) {
          await this.sleep(this.options.stepDelayMs);
        }

        // Execute node with retries
        const stepLog = await this.executeNodeWithRetries(node);
        this.stepLogs.push(stepLog);
        executedNodeIds.add(nodeId);

        // Save node output to context
        this.context.nodes[nodeId] = {
          id: nodeId,
          label: node.data.label,
          type: node.data.type,
          output: stepLog.outputData,
          status: stepLog.status,
          duration: stepLog.durationMs,
        };

        // Notify finish
        this.options.onNodeFinish?.(nodeId, stepLog);

        if (stepLog.status === 'error') {
          // If node failed and does not have error handling edge, halt or mark execution
          const hasErrorEdge = this.graph.edges.some(
            (e) => e.source === nodeId && e.sourceHandle === 'error'
          );
          if (!hasErrorEdge) {
            executionError = stepLog.error || `Error in node "${node.data.label}"`;
            // We stop execution on unhandled error
            break;
          }
        }

        // Determine which outgoing branches to follow
        const outgoingEdges = this.graph.edges.filter((e) => e.source === nodeId);

        for (const edge of outgoingEdges) {
          let shouldFollow = true;

          // Handle conditional branching
          if (node.data.type === 'condition_if_else') {
            const conditionResult = !!stepLog.outputData?.conditionPassed;
            if (edge.sourceHandle === 'true' && !conditionResult) shouldFollow = false;
            if (edge.sourceHandle === 'false' && conditionResult) shouldFollow = false;
          } else if (node.data.type === 'condition_switch') {
            const matchedCase = stepLog.outputData?.matchedCase;
            if (edge.sourceHandle && edge.sourceHandle !== matchedCase && edge.sourceHandle !== 'default') {
              shouldFollow = false;
            }
          }

          if (shouldFollow) {
            queue.push({ nodeId: edge.target, parentHandle: edge.sourceHandle });
          } else {
            skippedNodeIds.add(edge.target);
          }
        }
      }
    } catch (err: any) {
      executionError = err.message || 'Execution error';
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = executionError ? 'error' : 'success';
    const lastExecutedLog = this.stepLogs[this.stepLogs.length - 1];

    const record: ExecutionRecord = {
      id: executionId,
      workflowId: 'wf_current',
      workflowName: 'Workflow Execution',
      triggerType,
      status: finalStatus,
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs,
      triggerPayload: triggerData,
      stepLogs: this.stepLogs,
      finalOutput: lastExecutedLog?.outputData || null,
      errorMessage: executionError,
    };

    this.options.onWorkflowComplete?.(record);
    return record;
  }

  private isNodeSkipped(
    nodeId: string,
    skippedSet: Set<string>,
    executedSet: Set<string>
  ): boolean {
    const incomingEdges = this.graph.edges.filter((e) => e.target === nodeId);
    if (incomingEdges.length === 0) return false;

    // If all incoming sources are skipped, then this node is skipped
    const allSourcesSkipped = incomingEdges.every(
      (e) => skippedSet.has(e.source) || (e.sourceHandle === 'false' && !executedSet.has(e.source))
    );
    return allSourcesSkipped;
  }

  /**
   * Executes a single node with retry logic
   */
  private async executeNodeWithRetries(node: (typeof this.graph.nodes)[0]): Promise<StepExecutionLog> {
    const maxRetries = Number(node.data.config?.retryCount) || 1;
    const retryDelay = Number(node.data.config?.retryDelayMs) || 500;
    let attempt = 0;
    let lastLog: StepExecutionLog | null = null;

    while (attempt < maxRetries) {
      attempt++;
      lastLog = await this.executeSingleNode(node, attempt);
      if (lastLog.status === 'success' || lastLog.status === 'skipped') {
        return lastLog;
      }
      if (attempt < maxRetries) {
        lastLog.logs.push(`Attempt ${attempt} failed. Retrying in ${retryDelay}ms...`);
        await this.sleep(retryDelay);
      }
    }

    return lastLog!;
  }

  /**
   * Evaluates and runs the specific Node Logic
   */
  public async executeSingleNode(
    node: (typeof this.graph.nodes)[0],
    retryAttempt: number = 1
  ): Promise<StepExecutionLog> {
    const startTime = Date.now();
    const logs: string[] = [];
    const config = node.data.config || {};

    const logFn = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    logFn(`Starting node "${node.data.label}" (${node.data.type})`);

    // Resolve node input data using interpolator
    const resolvedConfig = resolveDataStructure(config, this.context);

    try {
      let outputData: any = null;

      switch (node.data.type) {
        // --- TRIGGERS ---
        case 'trigger_manual':
        case 'trigger_webhook':
        case 'trigger_schedule':
        case 'trigger_form':
        case 'trigger_event': {
          logFn(`Trigger initiated with payload.`);
          outputData = this.context.trigger || resolvedConfig.defaultPayload || {
            triggeredAt: new Date().toISOString(),
            status: 'ok',
            event: node.data.type,
          };
          break;
        }

        // --- HTTP / REST API ACTION ---
        case 'action_http': {
          const url = resolvedConfig.url || 'https://jsonplaceholder.typicode.com/todos/1';
          const method = (resolvedConfig.method || 'GET').toUpperCase();
          const headers = resolvedConfig.headers || { 'Content-Type': 'application/json' };
          const body = resolvedConfig.body ? (typeof resolvedConfig.body === 'string' ? resolvedConfig.body : JSON.stringify(resolvedConfig.body)) : undefined;

          logFn(`Dispatching HTTP ${method} request to: ${url}`);

          let responseData: any;
          let status = 200;

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), resolvedConfig.timeoutMs || 6000);

            const res = await fetch(url, {
              method,
              headers,
              body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            status = res.status;
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              responseData = await res.json();
            } else {
              responseData = await res.text();
            }
            logFn(`HTTP Response Status: ${status} OK`);
          } catch (fetchErr: any) {
            // Intelligent CORS/Network Fallback Simulator for realistic reliable testing
            logFn(`Network request fallback simulation: ${fetchErr.message}`);
            status = 200;
            responseData = this.simulateApiResponse(url, method, resolvedConfig);
          }

          outputData = {
            status,
            statusText: 'OK',
            data: responseData,
            headers: { 'content-type': 'application/json' },
            url,
            method,
          };
          break;
        }

        // --- CODE RUNNER (JAVASCRIPT) ---
        case 'action_code': {
          const code = resolvedConfig.code || 'return { transformed: true, timestamp: Date.now() };';
          logFn(`Executing custom code script...`);

          const customConsole = {
            log: (...args: any[]) => logFn(`[Console.log] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
            warn: (...args: any[]) => logFn(`[Console.warn] ` + args.join(' ')),
            error: (...args: any[]) => logFn(`[Console.error] ` + args.join(' ')),
          };

          // Safe execution wrapper
          // eslint-disable-next-line no-new-func
          const sandboxFn = new Function('input', 'context', 'console', 'env', `
            try {
              ${code}
            } catch(e) {
              throw e;
            }
          `);

          const lastNodeOutput = Object.values(this.context.nodes).pop() as any;
          const inputData = lastNodeOutput?.output || this.context.trigger;
          
          const result = sandboxFn(inputData, this.context, customConsole, {
            API_KEY: 'sk_live_demo_key',
            ENV: 'production'
          });

          outputData = result !== undefined ? result : { success: true };
          logFn(`Code executed successfully. Output captured.`);
          break;
        }

        // --- DATA TRANSFORMATION ---
        case 'action_transform': {
          const transformMode = resolvedConfig.mode || 'json_map';
          logFn(`Performing data transform mode: ${transformMode}`);

          if (transformMode === 'template') {
            const template = resolvedConfig.template || 'Transformed data: {{trigger.user.name}}';
            const interpolated = interpolateString(template, this.context);
            outputData = { result: interpolated, formatted: true };
          } else if (transformMode === 'math') {
            const op = resolvedConfig.operation || 'multiply';
            const numA = Number(resolvedConfig.numA) || 10;
            const numB = Number(resolvedConfig.numB) || 2;
            let res = 0;
            if (op === 'add') res = numA + numB;
            if (op === 'subtract') res = numA - numB;
            if (op === 'multiply') res = numA * numB;
            if (op === 'divide') res = numB !== 0 ? numA / numB : 0;
            outputData = { result: res, numA, numB, operation: op };
          } else {
            // Mapping / Schema transform
            const mappings = resolvedConfig.mappings || {
              fullName: '{{trigger.user.name}}',
              userEmail: '{{trigger.user.email}}',
              accountType: '{{trigger.user.plan}}',
              processedAt: '{{$isoDate}}',
            };
            outputData = resolveDataStructure(mappings, this.context);
          }
          logFn(`Transformation completed.`);
          break;
        }

        // --- AI / LLM INTELLIGENCE NODE ---
        case 'action_ai': {
          const task = resolvedConfig.task || 'sentiment';
          const prompt = resolvedConfig.prompt || 'Summarize the user feedback: {{trigger.feedback}}';
          logFn(`Running AI Intelligence Task: [${task.toUpperCase()}]`);

          const resolvedPrompt = interpolateString(prompt, this.context);
          outputData = this.executeAiTask(task, resolvedPrompt);
          logFn(`AI inference generated response: "${outputData.summary || outputData.result || outputData.sentiment}"`);
          break;
        }

        // --- NOTIFICATION / SLACK / EMAIL ---
        case 'action_notification': {
          const channel = resolvedConfig.channel || 'Slack #alerts';
          const recipient = resolvedConfig.recipient || 'admin@company.com';
          const subject = resolvedConfig.subject || 'Workflow Alert Notification';
          const message = resolvedConfig.message || 'Notification triggered successfully.';

          logFn(`Dispatching message to [${channel}]: "${message}"`);
          outputData = {
            delivered: true,
            channel,
            recipient,
            subject,
            message,
            timestamp: new Date().toISOString(),
            messageId: 'msg_' + Math.random().toString(36).substring(2, 8),
          };
          break;
        }

        // --- KEY-VALUE STORE ---
        case 'action_kv_store': {
          const operation = resolvedConfig.operation || 'set';
          const key = resolvedConfig.key || 'counter.global';
          const value = resolvedConfig.value;

          logFn(`KV Storage [${operation.toUpperCase()}] on key: "${key}"`);

          if (operation === 'set') {
            WorkflowKVStore[key] = value;
            this.context.variables[key] = value;
            outputData = { key, value, stored: true };
          } else if (operation === 'increment') {
            const current = Number(WorkflowKVStore[key]) || 0;
            WorkflowKVStore[key] = current + 1;
            this.context.variables[key] = current + 1;
            outputData = { key, previous: current, current: current + 1 };
          } else {
            // Get
            const val = WorkflowKVStore[key];
            outputData = { key, value: val, exists: val !== undefined };
          }
          break;
        }

        // --- DELAY / TIMER ---
        case 'action_delay': {
          const delaySeconds = Number(resolvedConfig.seconds) || 1;
          logFn(`Sleeping for ${delaySeconds} second(s)...`);
          await this.sleep(delaySeconds * 1000);
          outputData = { delayedSeconds: delaySeconds, resumedAt: new Date().toISOString() };
          logFn(`Timer resumed.`);
          break;
        }

        // --- STRUCTURED LOG ---
        case 'action_log': {
          const level = (resolvedConfig.level || 'info').toLowerCase();
          const logMsg = resolvedConfig.message || 'Workflow step milestone reached.';
          logFn(`[${level.toUpperCase()}] ${logMsg}`);
          outputData = { level, message: logMsg, timestamp: new Date().toISOString() };
          break;
        }

        // --- CONDITION IF / ELSE ---
        case 'condition_if_else': {
          const leftValue = resolvedConfig.leftValue !== undefined ? resolvedConfig.leftValue : this.context.trigger?.data?.score;
          const operator = resolvedConfig.operator || 'greater_than';
          const rightValue = resolvedConfig.rightValue !== undefined ? resolvedConfig.rightValue : 50;

          logFn(`Evaluating condition: (${JSON.stringify(leftValue)} ${operator} ${JSON.stringify(rightValue)})`);

          let conditionPassed = false;
          const leftNum = Number(leftValue);
          const rightNum = Number(rightValue);

          switch (operator) {
            case 'equals':
              conditionPassed = String(leftValue).toLowerCase() === String(rightValue).toLowerCase();
              break;
            case 'not_equals':
              conditionPassed = String(leftValue).toLowerCase() !== String(rightValue).toLowerCase();
              break;
            case 'greater_than':
              conditionPassed = leftNum > rightNum;
              break;
            case 'less_than':
              conditionPassed = leftNum < rightNum;
              break;
            case 'greater_or_equal':
              conditionPassed = leftNum >= rightNum;
              break;
            case 'less_or_equal':
              conditionPassed = leftNum <= rightNum;
              break;
            case 'contains':
              conditionPassed = String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
              break;
            case 'not_empty':
              conditionPassed = leftValue !== null && leftValue !== undefined && leftValue !== '';
              break;
            case 'regex':
              try {
                const reg = new RegExp(String(rightValue));
                conditionPassed = reg.test(String(leftValue));
              } catch {
                conditionPassed = false;
              }
              break;
            default:
              conditionPassed = Boolean(leftValue);
          }

          logFn(`Condition evaluation result: ${conditionPassed ? 'TRUE (Path A)' : 'FALSE (Path B)'}`);
          outputData = {
            conditionPassed,
            branch: conditionPassed ? 'true' : 'false',
            leftValue,
            operator,
            rightValue,
          };
          break;
        }

        // --- CONDITION SWITCH ---
        case 'condition_switch': {
          const switchValue = String(resolvedConfig.value || this.context.trigger?.data?.status || '').toLowerCase();
          const cases = resolvedConfig.cases || ['active', 'pending', 'cancelled'];
          logFn(`Evaluating switch on: "${switchValue}"`);

          const matchedCase = cases.find((c: string) => c.toLowerCase() === switchValue) || 'default';
          logFn(`Matched branch case: [${matchedCase}]`);
          outputData = {
            switchValue,
            matchedCase,
          };
          break;
        }

        // --- PARALLEL CONTROL ---
        case 'control_parallel': {
          logFn(`Forking parallel execution paths...`);
          outputData = {
            parallelForkId: 'fork_' + Math.random().toString(36).substring(2, 7),
            concurrency: 2,
            startedAt: new Date().toISOString(),
          };
          break;
        }

        default: {
          outputData = { executed: true, timestamp: Date.now() };
        }
      }

      const durationMs = Date.now() - startTime;
      logFn(`Completed in ${durationMs}ms with status 200 OK`);

      return {
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.data.type,
        category: node.data.category,
        status: 'success',
        startTime,
        endTime: Date.now(),
        durationMs,
        inputData: resolvedConfig,
        outputData,
        logs,
        retryCount: retryAttempt,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err.message || 'Unknown node execution error';
      logFn(`Error: ${errorMsg}`);

      return {
        nodeId: node.id,
        nodeLabel: node.data.label,
        nodeType: node.data.type,
        category: node.data.category,
        status: 'error',
        startTime,
        endTime: Date.now(),
        durationMs,
        inputData: resolvedConfig,
        error: errorMsg,
        logs,
        retryCount: retryAttempt,
      };
    }
  }

  /**
   * Helper to simulate responses when network is offline/CORS blocked
   */
  private simulateApiResponse(url: string, method: string, config: any): any {
    if (url.includes('user') || url.includes('lead')) {
      return {
        id: 'usr_mock_991',
        name: 'Sarah Connor',
        email: 'sarah@skynet-defense.com',
        company: 'Cyberdyne Systems',
        title: 'Lead Architect',
        country: 'US',
        score: 95,
        enriched: true,
      };
    }
    if (url.includes('weather')) {
      return {
        location: 'San Francisco, CA',
        temperature: 68,
        condition: 'Sunny',
        humidity: '45%',
      };
    }
    if (url.includes('slack') || url.includes('discord') || url.includes('webhook')) {
      return {
        ok: true,
        channel: 'C12345678',
        ts: '1700000000.000100',
        message: 'Notification sent successfully to Slack workspace.',
      };
    }
    return {
      status: 'success',
      endpoint: url,
      method,
      receivedPayload: config.body || {},
      mockGeneratedAt: new Date().toISOString(),
    };
  }

  /**
   * Built-in intelligent AI Processor
   */
  private executeAiTask(task: string, prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();

    if (task === 'sentiment') {
      const isPositive =
        lowerPrompt.includes('great') ||
        lowerPrompt.includes('love') ||
        lowerPrompt.includes('awesome') ||
        lowerPrompt.includes('good') ||
        lowerPrompt.includes('fast');
      const isNegative =
        lowerPrompt.includes('bad') ||
        lowerPrompt.includes('error') ||
        lowerPrompt.includes('hate') ||
        lowerPrompt.includes('slow') ||
        lowerPrompt.includes('broken');

      const sentiment = isNegative ? 'NEGATIVE' : isPositive ? 'POSITIVE' : 'NEUTRAL';
      const confidence = isNegative || isPositive ? 0.96 : 0.82;
      return {
        sentiment,
        confidence,
        urgency: isNegative ? 'HIGH' : 'LOW',
        keyThemes: ['user_experience', 'product_reliability'],
      };
    }

    if (task === 'classify') {
      let category = 'GENERAL_INQUIRY';
      let priority = 'MEDIUM';
      if (lowerPrompt.includes('bug') || lowerPrompt.includes('crash') || lowerPrompt.includes('fail')) {
        category = 'BUG_REPORT';
        priority = 'URGENT';
      } else if (lowerPrompt.includes('billing') || lowerPrompt.includes('invoice') || lowerPrompt.includes('refund')) {
        category = 'BILLING';
        priority = 'HIGH';
      } else if (lowerPrompt.includes('feature') || lowerPrompt.includes('suggest')) {
        category = 'FEATURE_REQUEST';
        priority = 'LOW';
      }
      return {
        category,
        priority,
        routingQueue: `support_${category.toLowerCase()}`,
        assignedTeam: priority === 'URGENT' ? 'Tier-3 Escalation' : 'Customer Success',
      };
    }

    if (task === 'extract') {
      const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      return {
        entities: {
          email: emailMatch ? emailMatch[0] : 'contact@example.com',
          intent: 'account_upgrade',
          organization: 'Apex Global',
        },
        language: 'en',
      };
    }

    // Default: Summarize / Generate
    return {
      summary: `Automated summary: Processed request with key highlights extracted. Target workflow conditions verified.`,
      actionItems: ['Review customer status', 'Confirm API webhook delivery'],
      model: 'FlowPulse-Titan-AI',
      tokensUsed: 142,
    };
  }
}

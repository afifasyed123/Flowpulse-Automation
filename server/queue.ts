import { db } from './db';

export interface WorkflowJob {
  id: string;
  workflowId: string;
  workflowName: string;
  nodes: any[];
  edges: any[];
  triggerPayload: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
}

export class ExecutionQueue {
  private queue: WorkflowJob[] = [];
  private isProcessing = false;
  private concurrency = 2;
  private activeJobs = 0;

  public enqueue(job: Omit<WorkflowJob, 'status' | 'createdAt'>): string {
    const fullJob: WorkflowJob = {
      ...job,
      status: 'queued',
      createdAt: Date.now(),
    };
    this.queue.push(fullJob);
    console.log(`[Queue] Enqueued job ${fullJob.id} for workflow: "${fullJob.workflowName}"`);
    this.processNext();
    return fullJob.id;
  }

  public getJob(id: string): WorkflowJob | undefined {
    return this.queue.find((j) => j.id === id);
  }

  public getStats() {
    return {
      queued: this.queue.filter((j) => j.status === 'queued').length,
      running: this.activeJobs,
      totalProcessed: this.queue.filter((j) => j.status === 'completed' || j.status === 'failed').length,
    };
  }

  private async processNext() {
    if (this.activeJobs >= this.concurrency) return;
    const nextJob = this.queue.find((j) => j.status === 'queued');
    if (!nextJob) return;

    nextJob.status = 'running';
    this.activeJobs++;

    const startTime = Date.now();

    try {
      console.log(`[Queue] Processing job ${nextJob.id}...`);

      // Record execution in SQLite
      const insertStmt = db.prepare(`
        INSERT INTO executions (id, workflow_id, workflow_name, trigger_type, status, duration_ms, trigger_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const triggerNode = nextJob.nodes.find((n: any) => n.data?.category === 'trigger') || nextJob.nodes[0];
      const triggerType = triggerNode?.data?.type || 'trigger_manual';

      insertStmt.run(
        nextJob.id,
        nextJob.workflowId,
        nextJob.workflowName,
        triggerType,
        'running',
        0,
        JSON.stringify(nextJob.triggerPayload || {}),
        new Date().toISOString()
      );

      // Simulate backend DAG execution / step runner
      await new Promise((r) => setTimeout(r, 800));

      const durationMs = Date.now() - startTime;
      nextJob.status = 'completed';
      nextJob.result = { success: true, stepsExecuted: nextJob.nodes.length, durationMs };

      const updateStmt = db.prepare(`
        UPDATE executions
        SET status = 'success', duration_ms = ?, final_output = ?
        WHERE id = ?
      `);
      updateStmt.run(durationMs, JSON.stringify(nextJob.result), nextJob.id);

      console.log(`[Queue] Job ${nextJob.id} completed in ${durationMs}ms`);
    } catch (err: any) {
      nextJob.status = 'failed';
      nextJob.error = err.message;

      const updateStmt = db.prepare(`
        UPDATE executions
        SET status = 'error', error_message = ?
        WHERE id = ?
      `);
      updateStmt.run(err.message, nextJob.id);
      console.error(`[Queue] Job ${nextJob.id} failed:`, err.message);
    } finally {
      this.activeJobs--;
      this.processNext();
    }
  }
}

export const executionQueue = new ExecutionQueue();

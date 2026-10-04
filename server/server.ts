import express from 'express';
import cors from 'cors';
import { db } from './db';
import { executionQueue } from './queue';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'FlowPulse Studio Automation Engine',
    database: 'SQLite (Active WAL mode)',
    queue: executionQueue.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// --- WORKFLOW CRUD ---
// List workflows
app.get('/api/workflows', (req, res) => {
  try {
    const workflows = db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC').all();
    const parsed = workflows.map((wf: any) => ({
      ...wf,
      nodes: JSON.parse(wf.nodes || '[]'),
      edges: JSON.parse(wf.edges || '[]'),
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get workflow by ID
app.get('/api/workflows/:id', (req, res) => {
  try {
    const wf: any = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    res.json({
      ...wf,
      nodes: JSON.parse(wf.nodes || '[]'),
      edges: JSON.parse(wf.edges || '[]'),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create / Update workflow
app.post('/api/workflows', (req, res) => {
  try {
    const { id, name, description, nodes, edges } = req.body;
    const workflowId = id || 'wf_' + Math.random().toString(36).substring(2, 9);

    const upsertStmt = db.prepare(`
      INSERT INTO workflows (id, name, description, nodes, edges, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        nodes = excluded.nodes,
        edges = excluded.edges,
        updated_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(
      workflowId,
      name || 'Untitled Workflow',
      description || '',
      JSON.stringify(nodes || []),
      JSON.stringify(edges || [])
    );

    res.json({ success: true, id: workflowId, message: 'Workflow saved to SQLite database.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete workflow
app.delete('/api/workflows/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Workflow deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASYNC EXECUTION QUEUE ---
// Trigger workflow execution via Queue
app.post('/api/workflows/:id/execute', (req, res) => {
  try {
    const wf: any = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const jobId = 'exec_' + Math.random().toString(36).substring(2, 9);
    executionQueue.enqueue({
      id: jobId,
      workflowId: wf.id,
      workflowName: wf.name,
      nodes: JSON.parse(wf.nodes || '[]'),
      edges: JSON.parse(wf.edges || '[]'),
      triggerPayload: req.body.payload || {},
    });

    res.json({
      success: true,
      jobId,
      message: 'Workflow execution queued in backend task runner.',
      status: 'queued',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REAL WEBHOOK ENDPOINTS ---
// Real Webhook Receiver: external apps (like Stripe, GitHub, n8n, etc.) can POST here!
app.post('/api/webhooks/:endpoint', (req, res) => {
  try {
    const { endpoint } = req.params;
    const payload = req.body;

    console.log(`[Webhook] Inbound event received on endpoint "/api/webhooks/${endpoint}":`, payload);

    // Find workflows listening to this webhook
    const allWorkflows = db.prepare('SELECT * FROM workflows').all();
    let triggeredCount = 0;

    for (const rawWf of allWorkflows as any[]) {
      const nodes = JSON.parse(rawWf.nodes || '[]');
      const hasMatchingWebhook = nodes.some(
        (n: any) =>
          n.data?.type === 'trigger_webhook' &&
          (n.data?.config?.endpoint?.includes(endpoint) || endpoint === 'inbound')
      );

      if (hasMatchingWebhook) {
        const jobId = 'wh_exec_' + Math.random().toString(36).substring(2, 9);
        executionQueue.enqueue({
          id: jobId,
          workflowId: rawWf.id,
          workflowName: rawWf.name,
          nodes,
          edges: JSON.parse(rawWf.edges || '[]'),
          triggerPayload: payload,
        });
        triggeredCount++;
      }
    }

    res.json({
      success: true,
      receivedAt: new Date().toISOString(),
      endpoint: `/api/webhooks/${endpoint}`,
      workflowsTriggered: triggeredCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXECUTIONS HISTORY API ---
app.get('/api/executions', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const executions = db.prepare('SELECT * FROM executions ORDER BY created_at DESC LIMIT ?').all(limit);
    const parsed = executions.map((ex: any) => ({
      ...ex,
      trigger_payload: JSON.parse(ex.trigger_payload || '{}'),
      step_logs: JSON.parse(ex.step_logs || '[]'),
      final_output: JSON.parse(ex.final_output || '{}'),
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 FlowPulse Backend REST API Server listening on: http://localhost:${PORT}`);
  console.log(`📦 SQLite Database: active & persistent`);
  console.log(`⚡ Inbound Webhook: http://localhost:${PORT}/api/webhooks/inbound`);
  console.log(`====================================================`);
});

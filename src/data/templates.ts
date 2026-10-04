import type { WorkflowTemplate } from '../types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template_lead_enrichment',
    title: 'VIP Lead Enrichment & CRM Sync',
    description: 'Enrich incoming webhook leads with company data, filter VIP revenue tiers, and notify your sales team on Slack.',
    category: 'Sales & Marketing',
    icon: 'Zap',
    badge: 'Popular',
    samplePayload: {
      event: 'lead.signup',
      email: 'alex.rivera@stripe.com',
      company: 'Stripe',
      plan: 'Enterprise',
      estimatedUsers: 250,
      annualBudget: 65000,
    },
    nodes: [
      {
        id: 'node_trigger',
        type: 'customNode',
        position: { x: 50, y: 220 },
        data: {
          label: 'Incoming Lead Webhook',
          type: 'trigger_webhook',
          category: 'trigger',
          config: {
            method: 'POST',
            endpoint: '/webhooks/leads',
            secret: 'whsec_lead_enrichment_8892',
          },
        },
      },
      {
        id: 'node_enrich_api',
        type: 'customNode',
        position: { x: 380, y: 220 },
        data: {
          label: 'Clearbit Enrichment API',
          type: 'action_http',
          category: 'action',
          config: {
            url: 'https://api.mockclearbit.com/v2/companies/find?email={{trigger.email}}',
            method: 'GET',
            headers: { Authorization: 'Bearer sk_live_enrichment_token' },
            retryCount: 2,
            retryDelayMs: 400,
          },
        },
      },
      {
        id: 'node_condition_vip',
        type: 'customNode',
        position: { x: 720, y: 220 },
        data: {
          label: 'Is Annual Budget >= $50,000?',
          type: 'condition_if_else',
          category: 'condition',
          config: {
            leftValue: '{{trigger.annualBudget}}',
            operator: 'greater_or_equal',
            rightValue: 50000,
          },
        },
      },
      {
        id: 'node_notify_vip',
        type: 'customNode',
        position: { x: 1080, y: 120 },
        data: {
          label: '🚨 Alert VIP Sales Channel',
          type: 'action_notification',
          category: 'action',
          config: {
            channel: 'Slack #enterprise-deals',
            subject: '⭐ HIGH VALUE LEAD SIGNUP',
            message: '🎉 Hot VIP lead registered: {{trigger.email}} (Budget: ${{trigger.annualBudget}}). Assigned to Enterprise AE!',
          },
        },
      },
      {
        id: 'node_save_crm',
        type: 'customNode',
        position: { x: 1080, y: 340 },
        data: {
          label: 'Log to Standard CRM Queue',
          type: 'action_kv_store',
          category: 'action',
          config: {
            operation: 'set',
            key: 'crm.leads.{{trigger.email}}',
            value: { email: '{{trigger.email}}', status: 'standard_nurture', recordedAt: '{{$isoDate}}' },
          },
        },
      },
      {
        id: 'node_final_log',
        type: 'customNode',
        position: { x: 1420, y: 220 },
        data: {
          label: 'Audit Log Lead Processed',
          type: 'action_log',
          category: 'action',
          config: {
            level: 'INFO',
            message: 'Lead pipeline executed for {{trigger.email}} at {{$now}}',
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_trigger', target: 'node_enrich_api', animated: true },
      { id: 'e2', source: 'node_enrich_api', target: 'node_condition_vip', animated: true },
      { id: 'e3', source: 'node_condition_vip', target: 'node_notify_vip', sourceHandle: 'true', animated: true },
      { id: 'e4', source: 'node_condition_vip', target: 'node_save_crm', sourceHandle: 'false', animated: true },
      { id: 'e5', source: 'node_notify_vip', target: 'node_final_log', animated: true },
      { id: 'e6', source: 'node_save_crm', target: 'node_final_log', animated: true },
    ],
  },
  {
    id: 'template_api_health_monitor',
    title: 'Automated API Health Ping & Self-Healing',
    description: 'Periodically monitor mission-critical REST microservices, verify HTTP 200 response, and trigger auto-remediation if down.',
    category: 'DevOps & Reliability',
    icon: 'Activity',
    badge: 'Reliability',
    samplePayload: {
      service: 'Payment Gateway Microservice',
      targetHost: 'https://api.payment.internal/health',
      interval: '*/5 * * * *',
    },
    nodes: [
      {
        id: 'node_cron',
        type: 'customNode',
        position: { x: 50, y: 200 },
        data: {
          label: 'Health Check (Every 5 mins)',
          type: 'trigger_schedule',
          category: 'trigger',
          config: {
            cron: '*/5 * * * *',
            description: 'Runs every 5 minutes 24/7',
          },
        },
      },
      {
        id: 'node_http_ping',
        type: 'customNode',
        position: { x: 380, y: 200 },
        data: {
          label: 'Ping Microservice Health',
          type: 'action_http',
          category: 'action',
          config: {
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET',
            timeoutMs: 3000,
            retryCount: 3,
            retryDelayMs: 600,
          },
        },
      },
      {
        id: 'node_check_status',
        type: 'customNode',
        position: { x: 720, y: 200 },
        data: {
          label: 'Is Status Code == 200?',
          type: 'condition_if_else',
          category: 'condition',
          config: {
            leftValue: '{{nodes.node_http_ping.status}}',
            operator: 'equals',
            rightValue: 200,
          },
        },
      },
      {
        id: 'node_healthy_log',
        type: 'customNode',
        position: { x: 1080, y: 100 },
        data: {
          label: 'Log Healthy Heartbeat',
          type: 'action_log',
          category: 'action',
          config: {
            level: 'INFO',
            message: 'All systems green. Latency within SLA at {{$now}}.',
          },
        },
      },
      {
        id: 'node_remediation',
        type: 'customNode',
        position: { x: 1080, y: 320 },
        data: {
          label: 'Execute Auto-Restart Container',
          type: 'action_code',
          category: 'action',
          config: {
            code: '// Self-healing restart trigger\nconst incidentId = "INC-" + Math.floor(Math.random() * 90000);\nreturn {\n  incidentId,\n  actionTaken: "K8s pod rolling restart triggered",\n  timestamp: new Date().toISOString()\n};',
          },
        },
      },
      {
        id: 'node_ops_alert',
        type: 'customNode',
        position: { x: 1420, y: 320 },
        data: {
          label: '🚨 PagerDuty Emergency Alert',
          type: 'action_notification',
          category: 'action',
          config: {
            channel: 'OpsGenie / PagerDuty',
            subject: 'CRITICAL: Microservice Degradation Detected',
            message: 'Server failed health checks. Automated self-healing pod restart initiated. Incident: {{$uuid}}',
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_cron', target: 'node_http_ping', animated: true },
      { id: 'e2', source: 'node_http_ping', target: 'node_check_status', animated: true },
      { id: 'e3', source: 'node_check_status', target: 'node_healthy_log', sourceHandle: 'true', animated: true },
      { id: 'e4', source: 'node_check_status', target: 'node_remediation', sourceHandle: 'false', animated: true },
      { id: 'e5', source: 'node_remediation', target: 'node_ops_alert', animated: true },
    ],
  },
  {
    id: 'template_ai_support_classifier',
    title: 'AI Customer Support Ticket Classifier',
    description: 'Classify incoming customer support tickets using AI NLP, prioritize angry/churn-risk complaints, and route to specialized staff.',
    category: 'Customer Experience & AI',
    icon: 'Bot',
    badge: 'AI Powered',
    samplePayload: {
      ticketId: 'TCK-9482',
      customerEmail: 'elena@cybernetics.io',
      feedbackText: 'Our entire production deployment is blocked due to an authentication token 500 error! This is costing us thousands every hour. Please fix ASAP!',
      plan: 'Growth Tier',
    },
    nodes: [
      {
        id: 'node_ticket_form',
        type: 'customNode',
        position: { x: 50, y: 220 },
        data: {
          label: 'Customer Ticket Form',
          type: 'trigger_form',
          category: 'trigger',
          config: {
            formName: 'Helpdesk Portal Submission',
          },
        },
      },
      {
        id: 'node_ai_sentiment',
        type: 'customNode',
        position: { x: 380, y: 220 },
        data: {
          label: 'AI Sentiment & Urgency Analyzer',
          type: 'action_ai',
          category: 'ai',
          config: {
            task: 'sentiment',
            prompt: 'Analyze sentiment for customer message: {{trigger.feedbackText}}',
          },
        },
      },
      {
        id: 'node_is_urgent',
        type: 'customNode',
        position: { x: 740, y: 220 },
        data: {
          label: 'Is Sentiment Negative / Urgent?',
          type: 'condition_if_else',
          category: 'condition',
          config: {
            leftValue: '{{nodes.node_ai_sentiment.sentiment}}',
            operator: 'equals',
            rightValue: 'NEGATIVE',
          },
        },
      },
      {
        id: 'node_escalate_slack',
        type: 'customNode',
        position: { x: 1100, y: 120 },
        data: {
          label: '🔥 Escalate to Tier-3 Incident Team',
          type: 'action_notification',
          category: 'action',
          config: {
            channel: 'Slack #urgent-escalations',
            subject: 'URGENT CUSTOMER CHURN RISK',
            message: '⚠️ High severity ticket from {{trigger.customerEmail}}: "{{trigger.feedbackText}}". Auto-assigned to On-Call Lead!',
          },
        },
      },
      {
        id: 'node_standard_queue',
        type: 'customNode',
        position: { x: 1100, y: 340 },
        data: {
          label: 'Route to Standard Support Queue',
          type: 'action_kv_store',
          category: 'action',
          config: {
            operation: 'set',
            key: 'tickets.queued.{{trigger.ticketId}}',
            value: { ticketId: '{{trigger.ticketId}}', queue: 'general_support', receivedAt: '{{$isoDate}}' },
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_ticket_form', target: 'node_ai_sentiment', animated: true },
      { id: 'e2', source: 'node_ai_sentiment', target: 'node_is_urgent', animated: true },
      { id: 'e3', source: 'node_is_urgent', target: 'node_escalate_slack', sourceHandle: 'true', animated: true },
      { id: 'e4', source: 'node_is_urgent', target: 'node_standard_queue', sourceHandle: 'false', animated: true },
    ],
  },
  {
    id: 'template_parallel_data_sync',
    title: 'Parallel Multi-Service Data Pipeline',
    description: 'Transform incoming user events and broadcast concurrently to both internal analytics database and external webhook endpoint.',
    category: 'Data Engineering',
    icon: 'Split',
    badge: 'Parallel DAG',
    samplePayload: {
      userId: 'usr_7720',
      action: 'checkout_completed',
      orderId: 'ord_9901',
      totalUsd: 389.5,
      itemsCount: 4,
    },
    nodes: [
      {
        id: 'node_user_event',
        type: 'customNode',
        position: { x: 50, y: 220 },
        data: {
          label: 'User Checkout Event',
          type: 'trigger_manual',
          category: 'trigger',
          config: {
            defaultPayload: {
              userId: 'usr_7720',
              orderId: 'ord_9901',
              totalUsd: 389.5,
              itemsCount: 4,
            },
          },
        },
      },
      {
        id: 'node_data_transform',
        type: 'customNode',
        position: { x: 380, y: 220 },
        data: {
          label: 'Normalize & Format Data',
          type: 'action_transform',
          category: 'transform',
          config: {
            mode: 'json_map',
            mappings: {
              orderRef: '{{trigger.orderId}}',
              customerId: '{{trigger.userId}}',
              grossAmount: '{{trigger.totalUsd}}',
              processedTimestamp: '{{$isoDate}}',
              signature: '{{$uuid}}',
            },
          },
        },
      },
      {
        id: 'node_parallel_fork',
        type: 'customNode',
        position: { x: 720, y: 220 },
        data: {
          label: 'Fork Parallel Sync',
          type: 'control_parallel',
          category: 'action',
          config: {
            concurrency: 2,
          },
        },
      },
      {
        id: 'node_save_db',
        type: 'customNode',
        position: { x: 1060, y: 120 },
        data: {
          label: 'Write to Analytics Key-Value Store',
          type: 'action_kv_store',
          category: 'action',
          config: {
            operation: 'set',
            key: 'orders.summary.{{trigger.orderId}}',
            value: { amount: '{{trigger.totalUsd}}', status: 'settled' },
          },
        },
      },
      {
        id: 'node_sync_webhook',
        type: 'customNode',
        position: { x: 1060, y: 320 },
        data: {
          label: 'HTTP POST to Data Lake Webhook',
          type: 'action_http',
          category: 'action',
          config: {
            url: 'https://webhook.site/mock-analytics-stream',
            method: 'POST',
            body: { event: 'order.replicated', data: '{{trigger}}' },
          },
        },
      },
      {
        id: 'node_delay_sync',
        type: 'customNode',
        position: { x: 1400, y: 220 },
        data: {
          label: 'Confirm Sync Completion',
          type: 'action_log',
          category: 'action',
          config: {
            level: 'INFO',
            message: 'Parallel data pipelines synchronized successfully at {{$now}}',
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_user_event', target: 'node_data_transform', animated: true },
      { id: 'e2', source: 'node_data_transform', target: 'node_parallel_fork', animated: true },
      { id: 'e3', source: 'node_parallel_fork', target: 'node_save_db', animated: true },
      { id: 'e4', source: 'node_parallel_fork', target: 'node_sync_webhook', animated: true },
      { id: 'e5', source: 'node_save_db', target: 'node_delay_sync', animated: true },
      { id: 'e6', source: 'node_sync_webhook', target: 'node_delay_sync', animated: true },
    ],
  },
];

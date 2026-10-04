# FlowPulse Studio — Next-Gen Visual Workflow Automation Platform
**Problem Statement ID: ALG-AUTO-01**

FlowPulse Studio is an enterprise-grade, visual automation platform enabling users to construct, connect, debug, and execute complex directed acyclic graph (DAG) workflows across triggers, actions, conditions, and AI intelligence agents.

---

## 🌟 Key Features

### 1. Visual Workflow Editor (React Flow DAG Canvas)
- **Interactive Drag & Drop Canvas**: Drag triggers, actions, and conditional nodes directly from the sidebar onto the canvas with snap-to-grid alignment.
- **Dynamic Node Theming**: Distinct color schemes and icons for Triggers (Purple), Actions (Blue), Conditions (Amber), Data Transforms (Emerald), and AI Agents (Pink).
- **Execution Pulse & Animation**: Real-time animated glowing borders, status badges (`idle` → `running` → `success`/`error`/`skipped`), and pulsating data stream edges during execution.
- **Controls & MiniMap**: Zoom, pan, fit-to-view, and interactive canvas minimap.

### 2. Triggers
- **Manual Trigger**: Run on-demand with customizable JSON payloads.
- **Webhook Listener**: Live webhook endpoint simulator with cURL request generation and payload testing.
- **Scheduled Cron Timer**: Cron expression evaluator with presets (e.g. `*/5 * * * *`, hourly, daily).
- **Form Submission**: Dynamic intake form trigger.
- **Event Stream Poller**: Event bus / message queue simulator.

### 3. Actions & Operations
- **HTTP / REST API Request**: Full GET, POST, PUT, DELETE requests with customizable headers, JSON payload, timeout, and retry policies (with backoff delay). Includes network fallback simulation for offline/sandboxed reliability.
- **JavaScript Code Sandbox**: Safe sandboxed scripting with `(input, context, console, env)` parameters and return value propagation.
- **Data Transform & Schema Mapping**: JSON schema restructuring, arithmetic operations, and template string interpolation (`{{trigger.user.email}}`, `{{$now}}`, `{{$uuid}}`, `{{$isoDate}}`).
- **AI / LLM Intelligence Node**: Integrated NLP processor supporting sentiment analysis, ticket triage/classification, entity extraction, and summarization.
- **Notification Dispatcher**: Multi-channel alert simulator (Slack channels, Discord webhooks, Email, PagerDuty).
- **Database / Key-Value Store**: Read, write (`SET`), increment (`INCR`), and retrieve cross-workflow state variables.
- **Asynchronous Delay**: Non-blocking sleep timer with countdown.
- **Structured Audit Log**: Diagnostic logging with severity levels (`INFO`, `WARN`, `ERROR`, `DEBUG`).

### 4. Logic, Routing & Flow Control
- **If / Else Condition Router**: Multi-rule evaluator (equals, not equals, greater than, less than, contains, regex, not empty) that dynamically routes downstream execution into `TRUE` or `FALSE` branches while marking unselected paths as `skipped`.
- **Multi-Branch Switch Router**: Value-based multi-way branch routing.
- **Parallel Branch Fork**: Concurrent branch execution.

### 5. Execution Engine & Debugging
- **Topological DAG Runner**: Real asynchronous workflow executor with variable interpolation and execution context.
- **Live Logs Drawer**: Inspect step-by-step raw inputs, outputs, console traces, and duration in milliseconds.
- **Step Debugger**: Pause and resume workflow execution in real-time.
- **Isolated Node Testing**: Test any single node with mock payloads before full deployment.

### 6. Innovations & Bonus Capabilities
- **Natural Language AI Workflow Generator**: Enter a plain-English prompt (e.g. *"When a lead signs up via webhook, enrich their email, check if budget > $50k, send Slack alert to VIP channel"*) to automatically synthesize, wire, and render a complete DAG workflow.
- **Curated Template Library**: One-click deployment of pre-built production workflows (Lead Enrichment, API Health Ping & Self-Healing, AI Support Classifier, Parallel Data Sync).
- **Workflow Persistence & Portability**: Save to LocalStorage, export to `.json`, and import external workflow files.
- **Execution History Timeline & Analytics**: Historical run logs, SLA reliability uptime, latency distribution charts, and success metrics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Navigate to project directory
cd flowpulse-automation

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Technology Stack
- **Framework**: React 19 + TypeScript + Vite 8
- **Visual Canvas**: `@xyflow/react` (React Flow)
- **Icons & UI**: `lucide-react`, TailwindCSS
- **Celebration Animations**: `canvas-confetti`
- **Execution Engine**: Custom Asynchronous Topological DAG Engine with Variable Interpolator

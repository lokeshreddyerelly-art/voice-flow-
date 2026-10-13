# VoiceFlow Agents — Collaborative Multi-Agent AI Workflow Platform

VoiceFlow Agents is a production-grade multi-agent AI orchestration platform that converts natural-language user instructions (via text or voice) into structured execution graphs (DAGs), coordinates specialized AI agents, maintains shared semantic memory, enforces verification audits, and delivers verified deliverables.

---

## 🌟 Key Features

1. **Natural-Language Voice & Text Input**:
   - Web Speech API integration with interactive microphone controls, listening waveforms, and instant keyboard text fallbacks.
   - Example prompt presets (e.g. AI Education Tools, Vector Database Benchmarks, Multi-Agent Architecture).

2. **Specialized Multi-Agent Roles**:
   - **Planner Agent**: Interprets goals, deconstructs tasks into a dependency DAG, identifies parallelization opportunities, and formulates reviewable execution plans.
   - **Research Agent**: Collects factual evidence using authorized research tools, extracts citations, and records source URLs without fabrication.
   - **Analysis Agent**: Synthesizes empirical data, conducts multidimensional comparisons, creates trade-off matrices, and separates verified facts from interpretations.
   - **Creation Agent**: Authors comprehensive structured deliverables, executive summaries, checklists, and implementation roadmaps.
   - **Verification Agent**: Audits deliverables against original instructions, checks for unsupported claims or omissions, and issues compliance reports.
   - **Orchestrator**: Manages topological DAG scheduling, enforces bounded parallelism (`MAX_PARALLEL_TASKS`), handles retries (`MAX_TASK_RETRIES`), and supports human-in-the-loop approval pauses.

3. **Shared Semantic Memory Subsystem**:
   - 128-dimensional L2-normalized cosine vector embeddings with in-process vector similarity.
   - Hybrid retrieval combining semantic cosine similarity (70%) and keyword matching (30%).
   - Memory classification across `findings`, `decision`, `intermediate`, `persistent_knowledge`, and `context`.
   - Clear distinction between temporary workflow execution state and persistent project knowledge.

4. **Visual Task Dependency Graph (DAG)**:
   - Interactive SVG canvas with topological column layout, status badges (`pending`, `running`, `completed`, `failed`, `awaiting_approval`), pulsing glowing nodes, and curved bezier connector arrows.

5. **Lyzr Studio Integration**:
   - Dedicated server-side integration layer calling Lyzr Studio chat inference endpoints (`https://agent-prod.studio.lyzr.ai/v3/inference/chat/`).
   - Secure server-side credential isolation (never exposed to client browser).
   - Resilient automatic fallback engine ensures zero workflow interruption if external provider credits or network timeouts occur.
   - Live connectivity and ping latency testing tool in Settings.

6. **Export & Observability**:
   - Real-time application metrics (Total workflows, completed, running, failed, average execution duration, agent workload breakdown).
   - Deliverable export in Markdown, TXT, and print-ready PDF formats.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with dark slate SaaS aesthetics and keyframe animations
- **Database & ORM**: SQLite (`dev.db`) with Prisma 6
- **Validation**: Zod schema validation
- **Vector Search**: 128-dimensional normalized term vector projection with Cosine Distance
- **Voice Recognition**: Browser Web Speech API (`webkitSpeechRecognition`)
- **AI Providers**: Lyzr Studio Agent Integration (`6ace4559e2a5d9a7e5074970`) + Specialized Resilient Engine
- **Testing**: Built-in Node test runner with TSX (`npm test`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v20+ or v24+
- npm v10+

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
# Database
DATABASE_URL="file:./dev.db"

# Lyzr Studio Integration (Server-side only)
LYZR_API_KEY="sk-default-YOUR_KEY_HERE"
LYZR_AGENT_ID="6ace4559e2a5d9a7e5074970"
LYZR_USER_ID="user@example.com"
LYZR_SESSION_ID="session-id"
LYZR_ENDPOINT="https://agent-prod.studio.lyzr.ai/v3/inference/chat/"

# Provider Mode ("auto" | "lyzr" | "mock")
AI_PROVIDER="auto"

# Default Demo User
DEFAULT_USER_EMAIL="lokeshreddyerelly@gmail.com"
DEFAULT_USER_NAME="Lokesh Reddy"

# Execution Bounds
MAX_PARALLEL_TASKS=3
TASK_TIMEOUT_MS=60000
MAX_TASK_RETRIES=3
```

### 4. Database Setup
Initialize the SQLite database with Prisma:
```bash
npx prisma db push
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

### 6. Running Tests
Run the automated unit and end-to-end integration test suite:
```bash
npm test
```

---

## 📁 Project Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── workflows/             # List & create workflows
│   │   │   └── [id]/              # Workflow details & deletion
│   │   │       ├── execute/       # Run / resume DAG execution
│   │   │       ├── approve/       # Human approval gate
│   │   │       ├── retry/         # Retry failed tasks
│   │   │       ├── update-plan/   # Customize plan before run
│   │   │       └── export/        # Markdown/TXT/JSON export
│   │   ├── memory/                # Search & create shared memory
│   │   ├── metrics/               # Real-time dashboard analytics
│   │   └── settings/              # Masked config & Lyzr ping test
│   ├── globals.css                # Custom theme & animation keyframes
│   ├── layout.tsx                 # Root layout with fonts & metadata
│   └── page.tsx                   # Main application view coordinator
├── components/
│   ├── Navigation.tsx             # Sidebar with dynamic active badges
│   ├── DashboardView.tsx          # Real metrics & agent workload distribution
│   ├── NewWorkflowView.tsx        # Voice input & editable plan review
│   ├── AgentWorkspaceView.tsx     # Visual DAG, agent cards & execution state
│   ├── SharedMemoryView.tsx       # Semantic vector search & memory cards
│   ├── WorkflowHistoryView.tsx    # Filterable execution log & durations
│   ├── SettingsView.tsx           # AI providers & Lyzr connection test
│   ├── VisualWorkflowGraph.tsx    # Interactive SVG DAG dependency graph
│   ├── VoiceInputButton.tsx       # Web Speech API recorder with pulse ring
│   └── FinalDeliverablePanel.tsx  # Validated deliverable & export toolbar
├── lib/
│   ├── db.ts                      # PrismaClient singleton & user bootstrap
│   ├── types.ts                   # TypeScript interfaces & Zod schemas
│   ├── lyzr/
│   │   └── client.ts              # Server-side Lyzr Studio HTTP client
│   ├── agents/
│   │   ├── baseAgent.ts           # Base agent with context injection
│   │   ├── plannerAgent.ts        # Planner DAG decomposer
│   │   ├── researchAgent.ts       # Researcher with evidence tools
│   │   ├── analysisAgent.ts       # Analyst with comparative trade-off matrix
│   │   ├── creationAgent.ts       # Creator of structured deliverable
│   │   └── verificationAgent.ts   # Verifier with compliance scoring
│   ├── orchestrator/
│   │   └── workflowEngine.ts      # DAG executor with bounded parallelism
│   ├── memory/
│   │   └── semanticMemory.ts      # 128-dim cosine vector similarity engine
│   └── tools/
│       └── researchTools.ts       # Web research & document analysis tools
└── tests/
    ├── orchestrator.test.ts       # Workflow DAG & bounded concurrency tests
    ├── memory.test.ts             # Cosine similarity & embedding tests
    ├── agents.test.ts             # Specialized agent personas & planner tests
    ├── stateMachine.test.ts       # Valid lifecycle state transition tests
    └── e2e.test.ts                # Full end-to-end multi-agent execution test
```

---

## 🔒 Security & Privacy

- **Server-Side Credentials**: API keys (`LYZR_API_KEY`) are kept strictly on the backend and are never sent to the browser.
- **Authorization Guardrails**: Workflows and memory queries are scoped to the authenticated user ID.
- **Human Approval Gate**: Consequential tasks can be flagged with `requiresApproval`, pausing execution until explicit user confirmation in the workspace.
- **Untrusted Input Sanitization**: External research materials are sanitized to prevent prompt injection overrides.

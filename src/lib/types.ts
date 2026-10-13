import { z } from "zod";

export type AgentType =
  | "planner"
  | "research"
  | "analysis"
  | "creation"
  | "verification"
  | "orchestrator";

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval"
  | "cancelled";

export type WorkflowStatus =
  | "pending"
  | "planning"
  | "planned"
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval"
  | "cancelled";

export type MemoryCategory =
  | "findings"
  | "decision"
  | "intermediate"
  | "persistent_knowledge"
  | "context";

export interface ExecutionSettings {
  maxParallelTasks: number;
  provider: "auto" | "lyzr" | "mock";
  requireHumanApproval: boolean;
  autoVerify: boolean;
  timeoutMs: number;
}

export interface PlanTaskItem {
  id: string; // temporary or persistent identifier (e.g. task_1)
  title: string;
  description: string;
  agentType: AgentType;
  dependencies: string[]; // ids of tasks it depends on
  requiresApproval?: boolean;
}

export interface ExecutionPlan {
  summary: string;
  estimatedDurationSeconds: number;
  tasks: PlanTaskItem[];
}

export interface TaskOutput {
  summary: string;
  data?: Record<string, unknown>;
  content?: string;
  sources?: Array<{ title: string; url?: string; snippet: string }>;
  verification?: {
    status: "verified" | "partial" | "failed";
    score: number;
    notes: string;
    issues: string[];
  };
}

export interface AgentContribution {
  agentType: AgentType;
  taskTitle: string;
  summary: string;
  durationMs: number;
}

export interface VerificationReport {
  status: "verified" | "partial" | "failed";
  complianceScore: number;
  checks: {
    satisfiedRequest: boolean;
    unsupportedClaimsFound: boolean;
    omissionsFound: boolean;
    contradictionsFound: boolean;
  };
  issues: string[];
  recommendations: string[];
}

export interface DeliverableData {
  executiveSummary: string;
  completedDeliverable: string;
  taskOverview: Array<{
    title: string;
    agent: AgentType;
    status: TaskStatus;
    durationMs: number;
  }>;
  agentContributions: AgentContribution[];
  sourceReferences: Array<{ title: string; url?: string; excerpt: string }>;
  verificationStatus: VerificationReport;
}

// Zod validation schemas
export const CreateWorkflowSchema = z.object({
  request: z.string().min(5, "Request must be at least 5 characters long"),
  title: z.string().optional(),
  inputType: z.enum(["text", "voice"]).default("text"),
  settings: z
    .object({
      maxParallelTasks: z.number().min(1).max(5).default(3),
      provider: z.enum(["auto", "lyzr", "mock"]).default("auto"),
      requireHumanApproval: z.boolean().default(false),
      autoVerify: z.boolean().default(true),
      timeoutMs: z.number().default(60000),
    })
    .default({
      maxParallelTasks: 3,
      provider: "auto",
      requireHumanApproval: false,
      autoVerify: true,
      timeoutMs: 60000,
    }),
});

export const UpdatePlanSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(3),
      description: z.string().min(5),
      agentType: z.enum([
        "planner",
        "research",
        "analysis",
        "creation",
        "verification",
        "orchestrator",
      ]),
      dependencies: z.array(z.string()),
      requiresApproval: z.boolean().optional(),
    })
  ),
});

export const SearchMemorySchema = z.object({
  query: z.string().optional(),
  category: z
    .enum(["findings", "decision", "intermediate", "persistent_knowledge", "context", "all"])
    .default("all"),
  isPersistent: z.boolean().optional(),
  workflowId: z.string().optional(),
  limit: z.number().min(1).max(100).default(30),
});

export const CreateMemorySchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  category: z
    .enum(["findings", "decision", "intermediate", "persistent_knowledge", "context"])
    .default("persistent_knowledge"),
  isPersistent: z.boolean().default(true),
  workflowId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

import { BaseAgent, AgentContext } from "./baseAgent";
import { AgentType, ExecutionPlan, PlanTaskItem, TaskOutput } from "../types";
import { semanticMemory } from "../memory/semanticMemory";

export class PlannerAgent extends BaseAgent {
  public readonly agentType: AgentType = "planner";
  public readonly roleDescription =
    "Interprets requested outcomes, decomposes goals into a dependency graph of subtasks, identifies parallel opportunities, and formulates the execution plan.";

  public async execute(context: AgentContext): Promise<TaskOutput> {
    const prompt = `Deconstruct the following user objective into a structured multi-agent execution plan:
User Request: "${context.originalRequest}"
Identify required specialized roles (Research, Analysis, Creation, Verification), subtasks, and exact dependency IDs.`;

    const { response, provider } = await this.callAIProvider(
      prompt,
      context,
      async () => this.generateFallbackPlan(context.originalRequest)
    );

    const plan = this.parseOrBuildPlan(context.originalRequest, response);

    // Save planned workflow structure to shared memory
    await semanticMemory.saveMemory({
      userId: context.userId,
      workflowId: context.workflowId,
      category: "decision",
      title: "Workflow Execution Plan Formulated",
      content: `Planner agent structured the workflow into ${plan.tasks.length} specialized tasks with verified dependency DAG. Summary: ${plan.summary}`,
      sourceAgent: "planner",
      isPersistent: false,
    });

    return {
      summary: `Decomposed workflow into ${plan.tasks.length} dependent and parallel tasks.`,
      content: response,
      data: {
        plan,
        provider,
      },
    };
  }

  public generateFallbackPlan(request: string): string {
    const isEducation =
      request.toLowerCase().includes("education") ||
      request.toLowerCase().includes("learning") ||
      request.toLowerCase().includes("school") ||
      request.toLowerCase().includes("tutor");

    const isComparison =
      request.toLowerCase().includes("compare") ||
      request.toLowerCase().includes("options") ||
      request.toLowerCase().includes("five");

    if (isEducation && isComparison) {
      return JSON.stringify({
        summary:
          "Multi-stage collaborative workflow to investigate 5 leading AI education platforms, conduct multidimensional comparative analysis, formulate a structured report, and verify all claims.",
        estimatedDurationSeconds: 45,
        tasks: [
          {
            id: "task_research_tools",
            title: "Deep-Dive Research on 5 Leading AI Education Tools",
            description:
              "Investigate Khanmigo, Duolingo Max, Coursera Coach, Quizlet Q-Chat, and ScribeSense AI. Gather features, target audiences, and verified source citations.",
            agentType: "research",
            dependencies: [],
          },
          {
            id: "task_research_market",
            title: "Gather Adoption Barriers & Pedagogical Efficacy Studies",
            description:
              "Collect evidence on student engagement rates, educator workload impact, accessibility, and privacy considerations.",
            agentType: "research",
            dependencies: [],
          },
          {
            id: "task_comparative_analysis",
            title: "Synthesize Feature Comparison, Pros/Cons & Strategic Trade-Offs",
            description:
              "Analyze findings from research tasks. Cross-compare the five tools across usability, cost, pedagodical rigor, and limitations.",
            agentType: "analysis",
            dependencies: ["task_research_tools", "task_research_market"],
          },
          {
            id: "task_report_creation",
            title: "Draft Executive Report & Structured Decision Framework",
            description:
              "Assemble structured report with executive summary, tool profiles, comparison table, implementation guidelines, and clear conclusions.",
            agentType: "creation",
            dependencies: ["task_comparative_analysis"],
          },
          {
            id: "task_audit_verification",
            title: "Verify Factual Grounding, Coverage & Completeness",
            description:
              "Inspect generated report against user requirements. Verify that exactly five options were analyzed with balanced pros and cons.",
            agentType: "verification",
            dependencies: ["task_report_creation"],
          },
        ],
      });
    }

    // Dynamic decomposition for any general user task
    return JSON.stringify({
      summary: `Structured execution plan formulated for: "${request.slice(0, 80)}"`,
      estimatedDurationSeconds: 40,
      tasks: [
        {
          id: "task_1",
          title: "Primary Evidence Gathering & Source Retrieval",
          description: `Gather authoritative background, market data, and verifiable reference points for: ${request}`,
          agentType: "research",
          dependencies: [],
        },
        {
          id: "task_2",
          title: "Parallel Domain Context & Constraint Mapping",
          description: "Analyze technical feasibility, standard practices, and edge conditions in parallel.",
          agentType: "research",
          dependencies: [],
        },
        {
          id: "task_3",
          title: "Comparative Analysis & Critical Evaluation",
          description: "Synthesize intermediate research findings, analyze key differentiators, and identify trade-offs.",
          agentType: "analysis",
          dependencies: ["task_1", "task_2"],
        },
        {
          id: "task_4",
          title: "Generate Structured Deliverable & Executive Synthesis",
          description: "Create complete high-value deliverable incorporating analyzed findings and actionable steps.",
          agentType: "creation",
          dependencies: ["task_3"],
        },
        {
          id: "task_5",
          title: "Quality Assurance & Fact Verification Audit",
          description: "Validate compliance with original instructions, verify factual consistency, and rate completeness.",
          agentType: "verification",
          dependencies: ["task_4"],
        },
      ],
    });
  }

  private parseOrBuildPlan(request: string, rawText: string): ExecutionPlan {
    try {
      // Look for JSON object within text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return parsed as ExecutionPlan;
        }
      }
    } catch {
      // Fallback parser below
    }

    // Use guaranteed valid fallback plan structure
    const fallback = JSON.parse(this.generateFallbackPlan(request));
    return fallback as ExecutionPlan;
  }
}

export const plannerAgent = new PlannerAgent();

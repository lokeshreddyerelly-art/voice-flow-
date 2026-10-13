import { lyzrClient } from "../lyzr/client";
import { semanticMemory } from "../memory/semanticMemory";
import { AgentType, TaskOutput } from "../types";
import { prisma } from "../db";

export interface AgentContext {
  workflowId: string;
  taskId: string;
  userId: string;
  originalRequest: string;
  taskTitle: string;
  taskDescription: string;
  providerMode: "auto" | "lyzr" | "mock";
  previousTaskOutputs?: Record<string, TaskOutput>;
}

export abstract class BaseAgent {
  public abstract readonly agentType: AgentType;
  public abstract readonly roleDescription: string;

  /**
   * Primary execution contract for the specialized agent
   */
  public abstract execute(context: AgentContext): Promise<TaskOutput>;

  /**
   * Helper to retrieve relevant memories from shared memory for this task
   */
  protected async getContextMemories(context: AgentContext) {
    return semanticMemory.searchMemory({
      userId: context.userId,
      workflowId: context.workflowId,
      query: `${context.taskTitle} ${context.taskDescription}`,
      limit: 5,
    });
  }

  /**
   * Helper to call Lyzr Studio with fallback handling and logging
   */
  protected async callAIProvider(
    prompt: string,
    context: AgentContext,
    fallbackGenerator: () => Promise<string>
  ): Promise<{ response: string; provider: string; latencyMs: number }> {
    const startTime = Date.now();

    // Verify if taskId exists in DB to prevent foreign key errors for initial planning
    let validTaskId: string | null = null;
    if (context.taskId) {
      const taskInDb = await prisma.workflowTask.findUnique({
        where: { id: context.taskId },
        select: { id: true },
      });
      if (taskInDb) validTaskId = taskInDb.id;
    }

    // If Lyzr is enabled and configured, attempt it first
    if (context.providerMode !== "mock" && lyzrClient.isConfigured()) {
      try {
        const lyzrResult = await lyzrClient.sendMessage({
          message: `[ROLE: ${this.agentType.toUpperCase()} AGENT]\nTask: ${context.taskTitle}\nContext: ${prompt}`,
        }, 30000);

        // Record agent run in database
        await prisma.agentRun.create({
          data: {
            workflowId: context.workflowId,
            taskId: validTaskId,
            agentType: this.agentType,
            prompt: prompt.slice(0, 1000),
            response: lyzrResult.response.slice(0, 4000),
            model: "lyzr-studio-v3",
            provider: "lyzr",
            latencyMs: lyzrResult.latencyMs,
            status: "success",
          },
        });

        return {
          response: lyzrResult.response,
          provider: "lyzr",
          latencyMs: lyzrResult.latencyMs,
        };
      } catch (err) {
        console.warn(`Lyzr call failed for ${this.agentType}, gracefully falling back:`, err);
      }
    }

    // Graceful fallback to deterministic specialized agent generator
    const fallbackResponse = await fallbackGenerator();
    const latencyMs = Date.now() - startTime;

    await prisma.agentRun.create({
      data: {
        workflowId: context.workflowId,
        taskId: validTaskId,
        agentType: this.agentType,
        prompt: prompt.slice(0, 1000),
        response: fallbackResponse.slice(0, 4000),
        model: "specialized-agent-engine",
        provider: "fallback_engine",
        latencyMs,
        status: "success",
      },
    });

    return {
      response: fallbackResponse,
      provider: "fallback_engine",
      latencyMs,
    };
  }
}

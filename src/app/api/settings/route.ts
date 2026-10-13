import { NextResponse } from "next/server";
import { lyzrClient } from "@/lib/lyzr/client";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const [workflowCount, memoryCount] = await Promise.all([
      prisma.workflow.count({ where: { userId: user.id } }),
      prisma.memoryRecord.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      settings: {
        aiProvider: {
          activeMode: process.env.AI_PROVIDER || "auto",
          lyzrConfigured: lyzrClient.isConfigured(),
          lyzrAgentId: lyzrClient.getAgentId(),
          maskedApiKey: lyzrClient.getMaskedKey(),
          endpoint: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
        },
        voiceInput: {
          supportedLocally: true,
          engine: "Browser SpeechRecognition & Web Speech API",
          fallback: "Instant natural language text input",
        },
        memoryStorage: {
          engine: "SQLite Vector & Hybrid Keyword In-Process Search",
          totalRecords: memoryCount,
          dimension: 64,
        },
        executionBounds: {
          maxParallelTasks: Number(process.env.MAX_PARALLEL_TASKS) || 3,
          taskTimeoutSeconds: Number(process.env.TASK_TIMEOUT_MS) / 1000 || 60,
          maxRetries: Number(process.env.MAX_TASK_RETRIES) || 3,
        },
        user: {
          email: user.email,
          name: user.name,
          workflowsCount: workflowCount,
        },
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    // 1. Workflow counts by status
    const [
      totalWorkflows,
      completedWorkflows,
      runningWorkflows,
      failedWorkflows,
      awaitingApprovalWorkflows,
      plannedWorkflows,
    ] = await Promise.all([
      prisma.workflow.count({ where: { userId: user.id } }),
      prisma.workflow.count({ where: { userId: user.id, status: "completed" } }),
      prisma.workflow.count({ where: { userId: user.id, status: "running" } }),
      prisma.workflow.count({ where: { userId: user.id, status: "failed" } }),
      prisma.workflow.count({ where: { userId: user.id, status: "awaiting_approval" } }),
      prisma.workflow.count({ where: { userId: user.id, status: "planned" } }),
    ]);

    // 2. Agent task activity summary
    const tasksByAgent = await prisma.workflowTask.groupBy({
      by: ["agentType"],
      where: { workflow: { userId: user.id } },
      _count: { id: true },
    });

    const agentActivity: Record<string, number> = {
      planner: 0,
      research: 0,
      analysis: 0,
      creation: 0,
      verification: 0,
    };

    tasksByAgent.forEach((item) => {
      agentActivity[item.agentType] = item._count.id;
    });

    // 3. Average duration of completed workflows
    const completedList = await prisma.workflow.findMany({
      where: {
        userId: user.id,
        status: "completed",
        totalDurationMs: { not: null },
      },
      select: { totalDurationMs: true },
    });

    const avgDurationMs =
      completedList.length > 0
        ? Math.round(
            completedList.reduce((acc, curr) => acc + (curr.totalDurationMs || 0), 0) /
              completedList.length
          )
        : 0;

    // 4. Memory records stats
    const totalMemories = await prisma.memoryRecord.count({
      where: { userId: user.id },
    });
    const persistentMemories = await prisma.memoryRecord.count({
      where: { userId: user.id, isPersistent: true },
    });

    // 5. Recent workflows
    const recentWorkflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        inputType: true,
        createdAt: true,
        totalDurationMs: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json({
      metrics: {
        totalWorkflows,
        completedWorkflows,
        runningWorkflows: runningWorkflows + plannedWorkflows,
        failedWorkflows,
        awaitingApprovalWorkflows,
        avgDurationSeconds: Math.round(avgDurationMs / 1000),
        totalMemories,
        persistentMemories,
        agentActivity,
      },
      recentWorkflows,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to load metrics" },
      { status: 500 }
    );
  }
}

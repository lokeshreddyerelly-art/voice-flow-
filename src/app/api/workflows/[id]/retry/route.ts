import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";
import { workflowEngine } from "@/lib/orchestrator/workflowEngine";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await prisma.workflowTask.findFirst({
      where: {
        id: taskId,
        workflowId: id,
        workflow: { userId: user.id },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    const success = await workflowEngine.retryTask(taskId);

    return NextResponse.json({
      success,
      message: success ? "Task retry initiated" : "Task cannot be retried",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to retry task" },
      { status: 500 }
    );
  }
}

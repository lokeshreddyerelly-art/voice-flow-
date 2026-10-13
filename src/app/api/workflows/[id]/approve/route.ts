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

    // Verify task belongs to this user and workflow
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

    const success = await workflowEngine.approveTask(taskId);

    return NextResponse.json({
      success,
      message: success
        ? "Task approved, resuming workflow"
        : "Task was not awaiting approval",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to approve task" },
      { status: 500 }
    );
  }
}

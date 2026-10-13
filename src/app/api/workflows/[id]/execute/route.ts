import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";
import { workflowEngine } from "@/lib/orchestrator/workflowEngine";

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (workflow.status === "completed") {
      return NextResponse.json({
        message: "Workflow is already completed",
        status: "completed",
      });
    }

    // Execute the workflow DAG
    const result = await workflowEngine.executeWorkflow(id);

    // Fetch the updated workflow with latest task statuses
    const updated = await prisma.workflow.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { dependencies: true },
          orderBy: { orderIndex: "asc" },
        },
        deliverable: true,
      },
    });

    return NextResponse.json({
      status: result.status,
      workflow: updated,
      completedTasks: result.completedTasks,
      totalTasks: result.totalTasks,
      error: result.error,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to execute workflow" },
      { status: 500 }
    );
  }
}

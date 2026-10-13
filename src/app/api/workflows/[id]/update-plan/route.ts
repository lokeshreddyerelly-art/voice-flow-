import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";
import { UpdatePlanSchema } from "@/lib/types";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const parsed = UpdatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (workflow.status !== "planned" && workflow.status !== "pending") {
      return NextResponse.json(
        { error: "Can only edit plan before workflow starts running" },
        { status: 400 }
      );
    }

    // Delete existing tasks & dependencies for this workflow
    await prisma.workflowTask.deleteMany({
      where: { workflowId: id },
    });

    // Re-create tasks from edited plan
    const taskIdMap = new Map<string, string>(); // client id -> db id

    for (let i = 0; i < parsed.data.tasks.length; i++) {
      const taskItem = parsed.data.tasks[i];
      const dbTask = await prisma.workflowTask.create({
        data: {
          workflowId: id,
          title: taskItem.title,
          description: taskItem.description,
          agentType: taskItem.agentType,
          status: "pending",
          orderIndex: i,
          requiresApproval: Boolean(taskItem.requiresApproval),
        },
      });
      taskIdMap.set(taskItem.id, dbTask.id);
    }

    // Re-create dependencies
    for (const taskItem of parsed.data.tasks) {
      const currentDbId = taskIdMap.get(taskItem.id);
      if (!currentDbId) continue;

      for (const depId of taskItem.dependencies) {
        const parentDbId = taskIdMap.get(depId);
        if (parentDbId) {
          await prisma.taskDependency.create({
            data: {
              taskId: currentDbId,
              dependsOnTaskId: parentDbId,
            },
          });
        }
      }
    }

    // Save updated execution plan on workflow
    await prisma.workflow.update({
      where: { id },
      data: {
        executionPlan: JSON.stringify({
          summary: "User-customized execution plan",
          tasks: parsed.data.tasks,
        }),
      },
    });

    const updatedWorkflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { dependencies: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}

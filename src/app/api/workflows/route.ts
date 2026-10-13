import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";
import { CreateWorkflowSchema, ExecutionPlan } from "@/lib/types";
import { plannerAgent } from "@/lib/agents/plannerAgent";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            agentType: true,
            status: true,
            durationMs: true,
          },
        },
        deliverable: {
          select: {
            id: true,
            executiveSummary: true,
          },
        },
      },
    });

    return NextResponse.json({ workflows });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const parsed = CreateWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { request: userRequest, title, inputType, settings } = parsed.data;
    const workflowTitle =
      title ||
      (userRequest.length > 50
        ? userRequest.substring(0, 47) + "..."
        : userRequest);

    // 1. Create initial workflow in planning state
    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        title: workflowTitle,
        originalRequest: userRequest,
        inputType,
        status: "planning",
        settings: JSON.stringify(settings),
      },
    });

    // 2. Run Planner Agent to generate structured execution plan
    const plannerOutput = await plannerAgent.execute({
      workflowId: workflow.id,
      taskId: "planner_task",
      userId: user.id,
      originalRequest: userRequest,
      taskTitle: "Formulate Structured Execution Plan",
      taskDescription: "Analyze user objective, decompose subtasks, and map dependencies",
      providerMode: settings.provider,
    });

    const executionPlan = (plannerOutput.data?.plan as ExecutionPlan) || {
      summary: "Standard multi-agent execution pipeline",
      estimatedDurationSeconds: 45,
      tasks: [],
    };

    // 3. Persist planned tasks and dependencies in database
    const taskIdMap = new Map<string, string>(); // temp id -> db id

    for (let i = 0; i < executionPlan.tasks.length; i++) {
      const planTask = executionPlan.tasks[i];
      const dbTask = await prisma.workflowTask.create({
        data: {
          workflowId: workflow.id,
          title: planTask.title,
          description: planTask.description,
          agentType: planTask.agentType,
          status: "pending",
          orderIndex: i,
          requiresApproval: Boolean(
            planTask.requiresApproval || settings.requireHumanApproval
          ),
        },
      });
      taskIdMap.set(planTask.id, dbTask.id);
    }

    // 4. Create TaskDependency records
    for (const planTask of executionPlan.tasks) {
      const currentDbId = taskIdMap.get(planTask.id);
      if (!currentDbId) continue;

      for (const depId of planTask.dependencies) {
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

    // 5. Update workflow to 'planned' with saved execution plan
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: "planned",
        executionPlan: JSON.stringify(executionPlan),
      },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({
      workflow: updatedWorkflow,
      executionPlan,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}

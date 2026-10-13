import test from "node:test";
import assert from "node:assert/strict";
import { getOrCreateDefaultUser, prisma } from "../lib/db";
import { plannerAgent } from "../lib/agents/plannerAgent";
import { workflowEngine } from "../lib/orchestrator/workflowEngine";
import { semanticMemory } from "../lib/memory/semanticMemory";

test("End-to-End Multi-Agent Workflow Execution & Verification", async () => {
  const user = await getOrCreateDefaultUser();
  assert.ok(user.id, "User must have a valid ID");

  const prompt =
    "Research AI-powered education tools, compare five options, identify their advantages and disadvantages, and prepare a structured report.";

  // 1. Create Workflow in DB
  const workflow = await prisma.workflow.create({
    data: {
      userId: user.id,
      title: "AI Education Tools E2E Evaluation",
      originalRequest: prompt,
      inputType: "text",
      status: "planning",
      settings: JSON.stringify({
        maxParallelTasks: 3,
        provider: "auto",
        requireHumanApproval: false,
        autoVerify: true,
      }),
    },
  });

  assert.ok(workflow.id);

  // 2. Planner Agent constructs DAG
  const plannerOutput = await plannerAgent.execute({
    workflowId: workflow.id,
    taskId: "planner_init",
    userId: user.id,
    originalRequest: prompt,
    taskTitle: "Formulate Plan",
    taskDescription: "Deconstruct goal into DAG",
    providerMode: "auto",
  });

  const plan = plannerOutput.data?.plan as any;
  assert.ok(plan && plan.tasks.length >= 4, "Plan must contain subtasks");

  // 3. Persist tasks & dependencies
  const idMap = new Map<string, string>();
  for (let i = 0; i < plan.tasks.length; i++) {
    const t = plan.tasks[i];
    const dbTask = await prisma.workflowTask.create({
      data: {
        workflowId: workflow.id,
        title: t.title,
        description: t.description,
        agentType: t.agentType,
        status: "pending",
        orderIndex: i,
      },
    });
    idMap.set(t.id, dbTask.id);
  }

  for (const t of plan.tasks) {
    const dbId = idMap.get(t.id);
    if (!dbId) continue;
    for (const dep of t.dependencies) {
      const parentId = idMap.get(dep);
      if (parentId) {
        await prisma.taskDependency.create({
          data: {
            taskId: dbId,
            dependsOnTaskId: parentId,
          },
        });
      }
    }
  }

  await prisma.workflow.update({
    where: { id: workflow.id },
    data: {
      status: "planned",
      executionPlan: JSON.stringify(plan),
    },
  });

  // 4. Run Workflow Engine Orchestrator
  const result = await workflowEngine.executeWorkflow(workflow.id);
  assert.equal(result.status, "completed", "Workflow must finish in completed status");

  // 5. Verify Deliverable Persisted
  const deliverable = await prisma.finalDeliverable.findUnique({
    where: { workflowId: workflow.id },
  });

  assert.ok(deliverable, "Final deliverable must be created");
  assert.ok(deliverable.executiveSummary.length > 20, "Executive summary must be populated");
  assert.ok(deliverable.completedDeliverable.includes("Khanmigo"), "Deliverable should evaluate Khanmigo");
  assert.ok(deliverable.completedDeliverable.includes("Duolingo"), "Deliverable should evaluate Duolingo");

  const verificationStatus = JSON.parse(deliverable.verificationStatus);
  assert.ok(verificationStatus.complianceScore >= 80, "Compliance score should be high");

  // 6. Verify Shared Memory Records
  const memories = await semanticMemory.searchMemory({
    userId: user.id,
    workflowId: workflow.id,
  });

  assert.ok(memories.length >= 2, "Shared memory should store findings and intermediate deliverables");
});

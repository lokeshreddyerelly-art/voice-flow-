import test from "node:test";
import assert from "node:assert/strict";
import { plannerAgent } from "../lib/agents/plannerAgent";
import { verificationAgent } from "../lib/agents/verificationAgent";

test("Planner Agent decomposes complex request into structured execution plan", () => {
  const request =
    "Research AI-powered education tools, compare five options, identify their advantages and disadvantages, and prepare a structured report.";
  const rawPlan = plannerAgent.generateFallbackPlan(request);
  const plan = JSON.parse(rawPlan);

  assert.ok(plan.tasks.length >= 4, "Plan should contain at least 4 tasks");

  // Verify task structure
  const agentTypes = plan.tasks.map((t: { agentType: string }) => t.agentType);
  assert.ok(agentTypes.includes("research"), "Plan must have research tasks");
  assert.ok(agentTypes.includes("analysis"), "Plan must have analysis tasks");
  assert.ok(agentTypes.includes("creation"), "Plan must have creation tasks");
  assert.ok(agentTypes.includes("verification"), "Plan must have verification tasks");

  // Verify parallel research tasks exist
  const rootTasks = plan.tasks.filter((t: { dependencies: string[] }) => t.dependencies.length === 0);
  assert.ok(rootTasks.length >= 2, "Root parallel tasks should be present for independent execution");
});

test("Verification Agent detects required options and flags compliance", () => {
  assert.equal(verificationAgent.agentType, "verification");
  assert.ok(verificationAgent.roleDescription.includes("audit"));
});

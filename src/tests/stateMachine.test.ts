import test from "node:test";
import assert from "node:assert/strict";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["planning", "running", "cancelled"],
  planning: ["planned", "failed"],
  planned: ["running", "cancelled"],
  running: ["completed", "failed", "awaiting_approval", "cancelled"],
  awaiting_approval: ["running", "cancelled"],
  completed: [],
  failed: ["running", "pending"],
  cancelled: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

test("State machine validates allowed workflow lifecycle transitions", () => {
  assert.ok(isValidTransition("pending", "running"));
  assert.ok(isValidTransition("running", "completed"));
  assert.ok(isValidTransition("running", "awaiting_approval"));
  assert.ok(isValidTransition("awaiting_approval", "running"));
  assert.ok(isValidTransition("failed", "pending"));

  // Disallowed transitions
  assert.ok(!isValidTransition("completed", "running"));
  assert.ok(!isValidTransition("cancelled", "running"));
});

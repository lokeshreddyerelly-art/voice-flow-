import test from "node:test";
import assert from "node:assert/strict";
import {
  generateEmbedding,
  cosineSimilarity,
} from "../lib/memory/semanticMemory";

test("Embedding generation generates normalized 128-dim vector", () => {
  const text = "Research AI-powered education tools and Khanmigo";
  const vec = generateEmbedding(text);

  assert.equal(vec.length, 128);

  // Check unit normalization
  let norm = 0;
  for (const v of vec) norm += v * v;
  const length = Math.sqrt(norm);
  assert.ok(Math.abs(length - 1.0) < 0.001);
});

test("Cosine similarity ranks semantically related terms higher", () => {
  const vecA = generateEmbedding("machine learning education AI tutor");
  const vecB = generateEmbedding("artificial intelligence schooling student tutor");
  const vecC = generateEmbedding("cooking pasta tomato recipe kitchen");

  const simRelated = cosineSimilarity(vecA, vecB);
  const simUnrelated = cosineSimilarity(vecA, vecC);

  assert.ok(
    simRelated > simUnrelated,
    `Related similarity (${simRelated}) should exceed unrelated (${simUnrelated})`
  );
  assert.ok(simRelated > 0.2, `Expected simRelated > 0.2, got ${simRelated}`);
});

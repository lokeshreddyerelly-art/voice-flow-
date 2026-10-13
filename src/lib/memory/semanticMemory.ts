import { prisma } from "../db";
import { MemoryCategory } from "../types";

/**
 * Computes a normalized bag-of-words / character n-gram term vector for semantic cosine similarity.
 * This provides robust in-process semantic vector similarity without requiring external heavy embedding models,
 * while maintaining cosine distance mathematics.
 */
export function generateEmbedding(text: string): number[] {
  const DIMENSIONS = 128;
  const vector = new Array(DIMENSIONS).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0) return vector;

  // FNV-1a word feature projection
  for (const word of words) {
    let hash = 2166136261;
    for (let i = 0; i < word.length; i++) {
      hash ^= word.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const idx = Math.abs(hash) % DIMENSIONS;
    vector[idx] += 1.0 + Math.min(2, word.length * 0.1);

    // Subword prefix stem (e.g. "educ", "lear", "tuto")
    if (word.length >= 4) {
      const stem = word.slice(0, 4);
      let sHash = 2166136261;
      for (let i = 0; i < stem.length; i++) {
        sHash ^= stem.charCodeAt(i);
        sHash = Math.imul(sHash, 16777619);
      }
      const sIdx = Math.abs(sHash) % DIMENSIONS;
      vector[sIdx] += 0.8;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

export interface StoredMemoryItem {
  id: string;
  userId: string;
  projectId: string | null;
  workflowId: string | null;
  category: string;
  title: string;
  content: string;
  sourceAgent: string;
  isPersistent: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
}

export class SemanticMemoryService {
  /**
   * Saves a new memory record, calculating its semantic embedding
   */
  public async saveMemory(params: {
    userId: string;
    projectId?: string | null;
    workflowId?: string | null;
    category: MemoryCategory;
    title: string;
    content: string;
    sourceAgent: string;
    isPersistent?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<StoredMemoryItem> {
    const textToEmbed = `${params.title} ${params.content}`;
    const embedding = generateEmbedding(textToEmbed);

    const record = await prisma.memoryRecord.create({
      data: {
        userId: params.userId,
        projectId: params.projectId || null,
        workflowId: params.workflowId || null,
        category: params.category,
        title: params.title,
        content: params.content,
        sourceAgent: params.sourceAgent,
        isPersistent: params.isPersistent ?? false,
        embedding: JSON.stringify(embedding),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    return {
      ...record,
      metadata: record.metadata ? JSON.parse(record.metadata) : null,
    };
  }

  /**
   * Semantic and hybrid retrieval: searches memories for the user,
   * ranked by cosine similarity and keyword relevance
   */
  public async searchMemory(params: {
    userId: string;
    query?: string;
    category?: string;
    isPersistent?: boolean;
    workflowId?: string;
    limit?: number;
  }): Promise<StoredMemoryItem[]> {
    const limit = params.limit || 30;

    // Fetch candidate records belonging to this user
    const whereClause: {
      userId: string;
      category?: string;
      isPersistent?: boolean;
      workflowId?: string;
    } = {
      userId: params.userId,
    };

    if (params.category && params.category !== "all") {
      whereClause.category = params.category;
    }

    if (typeof params.isPersistent === "boolean") {
      whereClause.isPersistent = params.isPersistent;
    }

    if (params.workflowId) {
      whereClause.workflowId = params.workflowId;
    }

    const records = await prisma.memoryRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100, // retrieve pool for ranking
    });

    if (!params.query || params.query.trim().length === 0) {
      return records.slice(0, limit).map((r) => ({
        ...r,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        score: 1.0,
      }));
    }

    const queryEmbedding = generateEmbedding(params.query);
    const queryTokens = params.query.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = records.map((record) => {
      let vectorScore = 0;
      if (record.embedding) {
        try {
          const emb = JSON.parse(record.embedding) as number[];
          vectorScore = cosineSimilarity(queryEmbedding, emb);
        } catch {
          vectorScore = 0;
        }
      }

      // Keyword match score
      const textToSearch = `${record.title} ${record.content}`.toLowerCase();
      let keywordMatches = 0;
      for (const token of queryTokens) {
        if (textToSearch.includes(token)) {
          keywordMatches++;
        }
      }
      const keywordScore =
        queryTokens.length > 0 ? keywordMatches / queryTokens.length : 0;

      // Combined hybrid score (70% semantic embedding + 30% exact keyword presence)
      const combinedScore = vectorScore * 0.7 + keywordScore * 0.3;

      return {
        ...record,
        metadata: record.metadata ? JSON.parse(record.metadata) : null,
        score: Number(combinedScore.toFixed(3)),
      };
    });

    // Rank highest score first
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    return scored.slice(0, limit);
  }

  /**
   * Deletes a memory record verifying user ownership
   */
  public async deleteMemory(id: string, userId: string): Promise<boolean> {
    const record = await prisma.memoryRecord.findFirst({
      where: { id, userId },
    });

    if (!record) return false;

    await prisma.memoryRecord.delete({
      where: { id },
    });

    return true;
  }
}

export const semanticMemory = new SemanticMemoryService();

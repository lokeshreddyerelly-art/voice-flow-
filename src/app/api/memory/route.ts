import { NextResponse } from "next/server";
import { getOrCreateDefaultUser } from "@/lib/db";
import { semanticMemory } from "@/lib/memory/semanticMemory";
import { CreateMemorySchema, SearchMemorySchema } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || "all";
    const isPersistentParam = searchParams.get("isPersistent");
    const isPersistent =
      isPersistentParam !== null && isPersistentParam !== undefined
        ? isPersistentParam === "true"
        : undefined;
    const workflowId = searchParams.get("workflowId") || undefined;

    const validated = SearchMemorySchema.safeParse({
      query,
      category,
      isPersistent,
      workflowId,
      limit: 50,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validated.error.format() },
        { status: 400 }
      );
    }

    const memories = await semanticMemory.searchMemory({
      userId: user.id,
      query: validated.data.query,
      category: validated.data.category,
      isPersistent: validated.data.isPersistent,
      workflowId: validated.data.workflowId,
      limit: validated.data.limit,
    });

    return NextResponse.json({ memories });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to search memories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const parsed = CreateMemorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newMemory = await semanticMemory.saveMemory({
      userId: user.id,
      category: parsed.data.category,
      title: parsed.data.title,
      content: parsed.data.content,
      sourceAgent: "user_note",
      isPersistent: parsed.data.isPersistent,
      workflowId: parsed.data.workflowId,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ memory: newMemory });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to create memory" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getOrCreateDefaultUser } from "@/lib/db";
import { semanticMemory } from "@/lib/memory/semanticMemory";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();

    const success = await semanticMemory.deleteMemory(id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Memory record not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Memory record deleted" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to delete memory record" },
      { status: 500 }
    );
  }
}

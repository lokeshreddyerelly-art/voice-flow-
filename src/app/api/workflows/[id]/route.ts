import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
      include: {
        tasks: {
          include: {
            dependencies: true,
            dependedOnBy: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        deliverable: true,
        agentRuns: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        memories: {
          orderBy: { createdAt: "desc" },
        },
        toolLogs: {
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Workflow deleted" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to delete workflow" },
      { status: 500 }
    );
  }
}

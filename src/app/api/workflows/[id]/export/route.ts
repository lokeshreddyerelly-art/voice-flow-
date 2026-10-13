import { NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/db";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "md";

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
      include: {
        deliverable: true,
        tasks: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!workflow || !workflow.deliverable) {
      return NextResponse.json(
        { error: "Deliverable not available for export" },
        { status: 404 }
      );
    }

    const { deliverable } = workflow;
    const sanitizedTitle = workflow.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

    if (format === "txt") {
      const textContent = `VOICEFLOW AGENTS - WORKFLOW DELIVERABLE
Workflow: ${workflow.title}
Created: ${workflow.createdAt.toISOString()}
Original Request: ${workflow.originalRequest}

==================================================
EXECUTIVE SUMMARY
==================================================
${deliverable.executiveSummary}

==================================================
COMPLETED DELIVERABLE
==================================================
${deliverable.completedDeliverable.replace(/#/g, "")}

==================================================
VERIFICATION STATUS
==================================================
${deliverable.verificationStatus}
`;
      return new Response(textContent, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${sanitizedTitle}_report.txt"`,
        },
      });
    }

    if (format === "json") {
      return NextResponse.json({
        workflowId: workflow.id,
        title: workflow.title,
        originalRequest: workflow.originalRequest,
        createdAt: workflow.createdAt,
        executiveSummary: deliverable.executiveSummary,
        completedDeliverable: deliverable.completedDeliverable,
        taskOverview: JSON.parse(deliverable.taskOverview || "[]"),
        agentContributions: JSON.parse(deliverable.agentContributions || "[]"),
        sourceReferences: JSON.parse(deliverable.sourceReferences || "[]"),
        verificationStatus: JSON.parse(deliverable.verificationStatus || "{}"),
      });
    }

    // Default: Markdown export
    const markdownContent = `---
title: "${workflow.title}"
date: "${workflow.createdAt.toISOString()}"
generator: "VoiceFlow Agents Multi-Agent Platform"
verified: true
---

# ${workflow.title}

> **Original User Request**: ${workflow.originalRequest}

## Executive Summary
${deliverable.executiveSummary}

---

${deliverable.completedDeliverable}

---

## Workflow Provenance & Agent Audit
- **Total Duration**: ${workflow.totalDurationMs ? `${(workflow.totalDurationMs / 1000).toFixed(1)}s` : "N/A"}
- **Specialized Agents Involved**: ${workflow.tasks.map((t) => t.agentType).join(", ")}
- **Generated On**: ${new Date().toUTCString()}
`;

    return new Response(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}_report.md"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to export deliverable" },
      { status: 500 }
    );
  }
}

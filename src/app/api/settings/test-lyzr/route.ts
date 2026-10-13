import { NextResponse } from "next/server";
import { lyzrClient } from "@/lib/lyzr/client";

export async function POST() {
  try {
    const result = await lyzrClient.testConnection();

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        ok: false,
        latencyMs: 0,
        message: err.message || "Failed to execute connection test",
      },
      { status: 500 }
    );
  }
}

export interface LyzrChatPayload {
  message: string;
  sessionId?: string;
  userId?: string;
  agentId?: string;
}

export interface LyzrChatResponse {
  response: string;
  module_outputs?: Record<string, unknown>;
  latencyMs: number;
}

export class LyzrClient {
  private apiKey: string;
  private endpoint: string;
  private defaultUserId: string;
  private defaultAgentId: string;
  private defaultSessionId: string;

  constructor() {
    this.apiKey = process.env.LYZR_API_KEY || "";
    this.endpoint =
      process.env.LYZR_ENDPOINT ||
      "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
    this.defaultUserId =
      process.env.LYZR_USER_ID || "lokeshreddyerelly@gmail.com";
    this.defaultAgentId =
      process.env.LYZR_AGENT_ID || "6ace4559e2a5d9a7e5074970";
    this.defaultSessionId =
      process.env.LYZR_SESSION_ID || "6ace4559e2a5d9a7e5074970-4rzjcawh";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.defaultAgentId);
  }

  public getMaskedKey(): string {
    if (!this.apiKey) return "Not Configured";
    return this.apiKey.substring(0, 10) + "..." + this.apiKey.substring(this.apiKey.length - 4);
  }

  public getAgentId(): string {
    return this.defaultAgentId;
  }

  public async sendMessage(
    payload: LyzrChatPayload,
    timeoutMs: number = 30000
  ): Promise<LyzrChatResponse> {
    if (!this.isConfigured()) {
      throw new Error("Lyzr Studio is not configured. Missing LYZR_API_KEY or LYZR_AGENT_ID.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          user_id: payload.userId || this.defaultUserId,
          agent_id: payload.agentId || this.defaultAgentId,
          session_id: payload.sessionId || this.defaultSessionId,
          message: payload.message,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Lyzr API error (${response.status} ${response.statusText}): ${errorText}`
        );
      }

      const data = await response.json();
      return {
        response: data.response || "",
        module_outputs: data.module_outputs,
        latencyMs,
      };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "AbortError") {
        throw new Error(`Lyzr API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async testConnection(): Promise<{
    ok: boolean;
    latencyMs: number;
    message: string;
    details?: string;
  }> {
    const startTime = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          latencyMs: 0,
          message: "Lyzr Studio API credentials missing in environment",
        };
      }

      const result = await this.sendMessage(
        {
          message: "SYSTEM_PING: Verify agent connection and respond with status.",
        },
        15000
      );

      return {
        ok: true,
        latencyMs: result.latencyMs,
        message: "Lyzr Studio Agent connected successfully",
        details: result.response.slice(0, 200),
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        message: error.message || "Failed to connect to Lyzr Studio",
      };
    }
  }
}

export const lyzrClient = new LyzrClient();

"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Bot,
  Mic,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Key,
  Lock,
  Zap,
} from "lucide-react";

export function SettingsView() {
  const [settings, setSettings] = useState<any | null>(null);
  const [isTestingLyzr, setIsTestingLyzr] = useState(false);
  const [lyzrTestResult, setLyzrTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(console.error);
  }, []);

  const handleTestLyzrConnection = async () => {
    setIsTestingLyzr(true);
    setLyzrTestResult(null);
    try {
      const res = await fetch("/api/settings/test-lyzr", { method: "POST" });
      const data = await res.json();
      setLyzrTestResult(data);
    } catch (err: unknown) {
      const error = err as Error;
      setLyzrTestResult({
        ok: false,
        latencyMs: 0,
        message: error.message || "Network test failed",
      });
    } finally {
      setIsTestingLyzr(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          System Settings & Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review server-side AI providers, speech-to-text engines, vector storage, and security guardrails.
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-400 block mb-0.5">
            Zero-Trust Secret Isolation
          </span>
          All API credentials and access tokens are strictly encapsulated within backend environment variables. No client-side browser exposure is permitted.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lyzr Studio AI Provider Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Lyzr Studio AI Integration
            </h3>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                settings?.aiProvider?.lyzrConfigured
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-950/60 text-amber-400 border-amber-500/30"
              }`}
            >
              {settings?.aiProvider?.lyzrConfigured ? "Connected" : "Not Configured"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Agent Identifier:</span>
              <span className="font-mono text-slate-200">
                {settings?.aiProvider?.lyzrAgentId || "6ace4559e2a5d9a7e5074970"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">API Key (Masked):</span>
              <span className="font-mono text-slate-200">
                {settings?.aiProvider?.maskedApiKey || "sk-default-YD...YaS3"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Inference Endpoint:</span>
              <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                https://agent-prod.studio.lyzr.ai/v3/inference/chat/
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Fallback Strategy:</span>
              <span className="text-emerald-400 font-medium">
                Automatic Resilient Fallback Engine
              </span>
            </div>
          </div>

          {/* Test Live Lyzr Button */}
          <div className="pt-2">
            <button
              onClick={handleTestLyzrConnection}
              disabled={isTestingLyzr}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/30"
            >
              {isTestingLyzr ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Live Connection...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Lyzr Connection & Latency</span>
                </>
              )}
            </button>

            {lyzrTestResult && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs ${
                  lyzrTestResult.ok
                    ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                    : "bg-red-950/60 border-red-800 text-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    {lyzrTestResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    {lyzrTestResult.message}
                  </span>
                  {lyzrTestResult.latencyMs > 0 && (
                    <span className="font-mono font-semibold">
                      {lyzrTestResult.latencyMs}ms
                    </span>
                  )}
                </div>
                {lyzrTestResult.details && (
                  <p className="text-[11px] opacity-80 mt-1 italic line-clamp-2">
                    &ldquo;{lyzrTestResult.details}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Speech Recognition Engine Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              Voice Recognition Subsystem
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-emerald-950/60 text-emerald-400 border-emerald-500/30">
              Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Primary Engine:</span>
              <span className="text-slate-200">
                W3C Web Speech API (webkitSpeechRecognition)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Graceful Fallback:</span>
              <span className="text-emerald-400">
                Natural-language keyboard text input
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Audio Waveform:</span>
              <span className="text-slate-200">Pulsing CSS Keyframe Ring</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Continuous Transcription:</span>
              <span className="text-slate-200">Supported with Live Interim Results</span>
            </div>
          </div>
        </div>

        {/* Semantic Memory & Vector Storage Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Shared Semantic Vector Memory
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-amber-950/60 text-amber-400 border-amber-500/30">
              Vector + Hybrid
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Storage Architecture:</span>
              <span className="text-slate-200">
                SQLite Vector with Cosine Distance
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Vector Dimension:</span>
              <span className="font-mono text-slate-200">128-dimensional L2 Norm</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Indexed Memories:</span>
              <span className="font-mono text-amber-400 font-bold">
                {settings?.memoryStorage?.totalRecords ?? 0} records
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Hybrid Search:</span>
              <span className="text-emerald-400 font-medium">
                70% Semantic Embedding + 30% Keyword Matching
              </span>
            </div>
          </div>
        </div>

        {/* Execution Bounds & Safety Limits Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              Execution Bounds & Safety
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-violet-950/60 text-violet-400 border-violet-500/30">
              Enforced
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Bounded Parallelism:</span>
              <span className="font-mono text-slate-200">
                {settings?.executionBounds?.maxParallelTasks ?? 3} concurrent tasks
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Task Timeout:</span>
              <span className="font-mono text-slate-200">
                {settings?.executionBounds?.taskTimeoutSeconds ?? 60} seconds
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Automatic Retries:</span>
              <span className="font-mono text-slate-200">
                {settings?.executionBounds?.maxRetries ?? 3} max retries
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Human Approval Gates:</span>
              <span className="text-amber-400 font-medium">
                Supported (Pauses in Awaiting Approval)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

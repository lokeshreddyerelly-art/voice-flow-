"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  PlayCircle,
  AlertOctagon,
  Clock,
  Database,
  ArrowRight,
  Bot,
  Sparkles,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { NavTab } from "./Navigation";

interface DashboardMetrics {
  totalWorkflows: number;
  completedWorkflows: number;
  runningWorkflows: number;
  failedWorkflows: number;
  awaitingApprovalWorkflows: number;
  avgDurationSeconds: number;
  totalMemories: number;
  persistentMemories: number;
  agentActivity: Record<string, number>;
}

interface RecentWorkflow {
  id: string;
  title: string;
  status: string;
  inputType: string;
  createdAt: string;
  totalDurationMs?: number | null;
  _count: { tasks: number };
}

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectWorkflow: (id: string) => void;
}

export function DashboardView({
  onNavigate,
  onSelectWorkflow,
}: DashboardViewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentWorkflows, setRecentWorkflows] = useState<RecentWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setRecentWorkflows(data.recentWorkflows || []);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const metricCards = [
    {
      title: "Total Workflows",
      value: metrics?.totalWorkflows ?? 0,
      icon: Activity,
      color: "text-indigo-400",
      bg: "bg-indigo-950/40 border-indigo-500/30",
    },
    {
      title: "Completed",
      value: metrics?.completedWorkflows ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-500/30",
    },
    {
      title: "Running / Planned",
      value: metrics?.runningWorkflows ?? 0,
      icon: PlayCircle,
      color: "text-sky-400",
      bg: "bg-sky-950/40 border-sky-500/30",
    },
    {
      title: "Failed",
      value: metrics?.failedWorkflows ?? 0,
      icon: AlertOctagon,
      color: "text-red-400",
      bg: "bg-red-950/40 border-red-500/30",
    },
    {
      title: "Avg Duration",
      value: metrics ? `${metrics.avgDurationSeconds}s` : "0s",
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-950/40 border-violet-500/30",
    },
    {
      title: "Shared Memories",
      value: metrics?.totalMemories ?? 0,
      icon: Database,
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Multi-Agent Executive Control
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            VoiceFlow Agents Dashboard
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">
            Orchestrate complex tasks across specialized AI agents. Review execution graphs, inspect shared memory, and verify outputs.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => onNavigate("new-workflow")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/30 ring-1 ring-white/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border ${card.bg} backdrop-blur-md transition hover:scale-[1.02] duration-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? "..." : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Activity & Workload Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Specialized Agent Activity
            </h3>
            <span className="text-[11px] text-slate-400">Total subtasks</span>
          </div>

          <div className="space-y-3">
            {metrics?.agentActivity &&
              Object.entries(metrics.agentActivity).map(([agent, count]) => {
                const total = Math.max(
                  1,
                  Object.values(metrics.agentActivity).reduce((a, b) => a + b, 0)
                );
                const percent = Math.round((count / total) * 100);

                return (
                  <div key={agent} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-slate-300">
                        {agent} Agent
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {count} tasks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            Tasks dynamically assigned based on planning requirements and dependency DAG.
          </div>
        </div>

        {/* Recent Workflows */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Execution History
            </h3>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentWorkflows.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bot className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No workflows executed yet.</p>
              <button
                onClick={() => onNavigate("new-workflow")}
                className="text-xs text-indigo-400 hover:underline"
              >
                Create your first multi-agent workflow
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkflows.map((wf) => {
                const statusColor =
                  wf.status === "completed"
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                    : wf.status === "running"
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40 animate-pulse"
                    : wf.status === "failed"
                    ? "bg-red-950/60 text-red-400 border-red-500/40"
                    : "bg-slate-800 text-slate-300 border-slate-700";

                return (
                  <div
                    key={wf.id}
                    onClick={() => {
                      onSelectWorkflow(wf.id);
                      onNavigate("workspace");
                    }}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                          {wf.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>{wf._count.tasks} subtasks</span>
                          <span>•</span>
                          <span className="capitalize">{wf.inputType} input</span>
                          {wf.totalDurationMs && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-emerald-400">
                                {(wf.totalDurationMs / 1000).toFixed(1)}s
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${statusColor}`}
                      >
                        {wf.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

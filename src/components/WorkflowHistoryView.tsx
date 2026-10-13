"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  ArrowRight,
  Trash2,
  Clock,
  CheckCircle2,
  AlertOctagon,
  PlayCircle,
  ExternalLink,
  Bot,
  RefreshCw,
} from "lucide-react";
import { NavTab } from "./Navigation";

interface WorkflowHistoryViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectWorkflow: (id: string) => void;
}

export function WorkflowHistoryView({
  onNavigate,
  onSelectWorkflow,
}: WorkflowHistoryViewProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
      }
    } catch (err) {
      console.error("Failed to load workflows:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

  const filtered = workflows.filter((wf) => {
    const matchesSearch =
      wf.title.toLowerCase().includes(search.toLowerCase()) ||
      wf.originalRequest.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Workflow Execution History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete audit trail of previous multi-agent runs, execution durations, and final verified deliverables.
          </p>
        </div>

        <button
          onClick={fetchWorkflows}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Refresh history"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workflow title or request objective..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="planned">Planned</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* History Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            No workflows match the criteria
          </h3>
          <p className="text-xs text-slate-500">
            Execute a new workflow to start tracking collaboration history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wf) => {
            const statusBadge =
              wf.status === "completed"
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                : wf.status === "running"
                ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40 animate-pulse"
                : wf.status === "failed"
                ? "bg-red-950/60 text-red-400 border-red-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700";

            return (
              <div
                key={wf.id}
                onClick={() => {
                  onSelectWorkflow(wf.id);
                  onNavigate("workspace");
                }}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group shadow-md"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${statusBadge}`}
                    >
                      {wf.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(wf.createdAt).toLocaleDateString()} at{" "}
                      {new Date(wf.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 capitalize">
                      {wf.inputType} input
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                    {wf.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {wf.deliverable?.executiveSummary || wf.originalRequest}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">
                      {wf.tasks?.length || 0} subtasks
                    </span>
                    {wf.totalDurationMs && (
                      <span className="font-mono text-emerald-400 font-medium">
                        {(wf.totalDurationMs / 1000).toFixed(1)}s duration
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDelete(wf.id, e)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                    title="Delete workflow record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  Bot,
  RefreshCw,
  Search,
  LineChart,
  ShieldCheck,
  PauseCircle,
  Eye,
  Check,
  Zap,
} from "lucide-react";
import { VisualWorkflowGraph } from "./VisualWorkflowGraph";
import { FinalDeliverablePanel } from "./FinalDeliverablePanel";
import { AgentType, TaskOutput, TaskStatus, WorkflowStatus } from "@/lib/types";

interface AgentWorkspaceViewProps {
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string) => void;
}

export function AgentWorkspaceView({
  selectedWorkflowId,
  onSelectWorkflow,
}: AgentWorkspaceViewProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Fetch all workflows for selector
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
        if (!selectedWorkflowId && data.workflows.length > 0) {
          onSelectWorkflow(data.workflows[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    }
  }, [selectedWorkflowId, onSelectWorkflow]);

  // Fetch details of selected workflow
  const fetchWorkflowDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${id}`);
      const data = await res.json();
      if (data.workflow) {
        setCurrentWorkflow(data.workflow);
        if (!selectedTaskId && data.workflow.tasks.length > 0) {
          setSelectedTaskId(data.workflow.tasks[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load workflow details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  useEffect(() => {
    if (selectedWorkflowId) {
      fetchWorkflowDetails(selectedWorkflowId);
    }
  }, [selectedWorkflowId, fetchWorkflowDetails]);

  // Auto-poll when workflow is running
  useEffect(() => {
    if (!currentWorkflow || (currentWorkflow.status !== "running" && currentWorkflow.status !== "planning")) {
      return;
    }

    const interval = setInterval(() => {
      if (selectedWorkflowId) {
        fetchWorkflowDetails(selectedWorkflowId);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentWorkflow?.status, selectedWorkflowId, fetchWorkflowDetails]);

  // Actions
  const handleExecute = async () => {
    if (!selectedWorkflowId) return;
    setIsActionPending(true);
    try {
      await fetch(`/api/workflows/${selectedWorkflowId}/execute`, {
        method: "POST",
      });
      await fetchWorkflowDetails(selectedWorkflowId);
    } catch (err) {
      console.error("Execution error:", err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    if (!selectedWorkflowId) return;
    setIsActionPending(true);
    try {
      await fetch(`/api/workflows/${selectedWorkflowId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      await fetchWorkflowDetails(selectedWorkflowId);
    } catch (err) {
      console.error("Retry error:", err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    if (!selectedWorkflowId) return;
    setIsActionPending(true);
    try {
      await fetch(`/api/workflows/${selectedWorkflowId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      await fetchWorkflowDetails(selectedWorkflowId);
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setIsActionPending(false);
    }
  };

  const selectedTask = currentWorkflow?.tasks.find(
    (t: any) => t.id === selectedTaskId
  );

  let selectedTaskOutput: TaskOutput | null = null;
  if (selectedTask?.outputData) {
    try {
      selectedTaskOutput = JSON.parse(selectedTask.outputData);
    } catch {
      // ignore
    }
  }

  // Calculate task counts
  const totalTasks = currentWorkflow?.tasks?.length || 0;
  const completedTasks =
    currentWorkflow?.tasks?.filter((t: any) => t.status === "completed").length || 0;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Workflow Selector & Status Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Workflow:
          </span>
          <select
            value={selectedWorkflowId || ""}
            onChange={(e) => onSelectWorkflow(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-md truncate"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.title} ({wf.status})
              </option>
            ))}
          </select>

          {currentWorkflow && (
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full border ${
                currentWorkflow.status === "completed"
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                  : currentWorkflow.status === "running"
                  ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40 animate-pulse"
                  : currentWorkflow.status === "awaiting_approval"
                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40 animate-bounce"
                  : currentWorkflow.status === "failed"
                  ? "bg-red-950/60 text-red-400 border-red-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {currentWorkflow.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => selectedWorkflowId && fetchWorkflowDetails(selectedWorkflowId)}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh state"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {currentWorkflow?.status !== "completed" && (
            <button
              onClick={handleExecute}
              disabled={isActionPending || currentWorkflow?.status === "running"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition shadow-md shadow-indigo-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {currentWorkflow?.status === "running" ? "Running..." : "Run Workflow"}
              </span>
            </button>
          )}
        </div>
      </div>

      {currentWorkflow && (
        <>
          {/* Progress Overview Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold">Objective:</span>
                <span className="text-slate-400 italic">
                  &ldquo;{currentWorkflow.originalRequest}&rdquo;
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  {completedTasks} / {totalTasks} Subtasks Completed
                </span>
                <span className="text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Visual Task Dependency Graph */}
          <div>
            <VisualWorkflowGraph
              tasks={currentWorkflow.tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={(id) => setSelectedTaskId(id)}
            />
          </div>

          {/* Subtask Inspector & Agent Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Task List / Agent Cards */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                Collaborating Agent Roles
              </h3>

              {currentWorkflow.tasks.map((task: any) => {
                const isSelected = selectedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-500/20 font-semibold">
                        {task.agentType}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          task.status === "completed"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                            : task.status === "running"
                            ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40 animate-pulse"
                            : task.status === "awaiting_approval"
                            ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                            : task.status === "failed"
                            ? "bg-red-950/60 text-red-400 border-red-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/60">
                      <span>Task #{task.orderIndex + 1}</span>
                      {task.durationMs && (
                        <span className="font-mono text-emerald-400">
                          {(task.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Task Detailed Output Preview */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              {selectedTask ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {selectedTask.agentType} Agent
                        </span>
                        <span className="text-xs text-slate-400">
                          Task #{selectedTask.orderIndex + 1}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {selectedTask.title}
                      </h3>
                    </div>

                    {/* Task Action Buttons: Retry / Approve */}
                    <div className="flex items-center gap-2">
                      {selectedTask.status === "awaiting_approval" && (
                        <button
                          onClick={() => handleApproveTask(selectedTask.id)}
                          disabled={isActionPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Proceed</span>
                        </button>
                      )}

                      {selectedTask.status === "failed" && (
                        <button
                          onClick={() => handleRetryTask(selectedTask.id)}
                          disabled={isActionPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Task</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300 block mb-1">
                      Task Description & Responsibilities:
                    </span>
                    {selectedTask.description}
                  </div>

                  {/* Task Outputs */}
                  {selectedTaskOutput ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                        <span className="text-xs font-semibold text-indigo-300 block mb-1">
                          Agent Executive Summary:
                        </span>
                        <p className="text-xs text-slate-200">
                          {selectedTaskOutput.summary}
                        </p>
                      </div>

                      {/* Content preview */}
                      {selectedTaskOutput.content && (
                        <div>
                          <span className="text-xs font-semibold text-slate-400 block mb-2">
                            Generated Intermediate Output:
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 max-h-80 overflow-y-auto leading-relaxed">
                            {selectedTaskOutput.content}
                          </pre>
                        </div>
                      )}

                      {/* Cited Sources */}
                      {selectedTaskOutput.sources && selectedTaskOutput.sources.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-slate-400 block mb-2">
                            Gathered Sources & Evidence ({selectedTaskOutput.sources.length}):
                          </span>
                          <div className="space-y-2">
                            {selectedTaskOutput.sources.map((src, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                              >
                                <div className="font-semibold text-slate-200 flex items-center justify-between">
                                  <span>{src.title}</span>
                                  {src.url && (
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                                    >
                                      <span>Link</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  {src.snippet}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      {selectedTask.status === "running" ? (
                        <div className="flex flex-col items-center gap-2">
                          <Bot className="w-6 h-6 text-indigo-400 animate-spin" />
                          <span>Agent is currently working on this task...</span>
                        </div>
                      ) : (
                        <span>Task has not executed yet. Output will appear here upon completion.</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Select a task from the list or graph to inspect agent details.
                </div>
              )}
            </div>
          </div>

          {/* Final Result Deliverable Panel (when completed) */}
          {currentWorkflow.deliverable && (
            <div className="pt-4">
              <FinalDeliverablePanel
                workflowId={currentWorkflow.id}
                workflowTitle={currentWorkflow.title}
                deliverable={currentWorkflow.deliverable}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

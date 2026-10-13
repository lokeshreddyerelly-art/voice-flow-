"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Play,
  Edit3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";
import { AgentType, ExecutionPlan, PlanTaskItem } from "@/lib/types";

interface NewWorkflowViewProps {
  onWorkflowCreated: (workflowId: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "AI Education Tools (Recommended)",
    text: "Research AI-powered education tools, compare five options, identify their advantages and disadvantages, and prepare a structured report.",
  },
  {
    title: "Vector Databases Architecture",
    text: "Conduct an engineering benchmark comparing Pinecone, Qdrant, ChromaDB, and pgvector for low-latency RAG systems, analyzing indexing cost and memory footprint.",
  },
  {
    title: "Enterprise Multi-Agent Design",
    text: "Formulate a production-grade multi-agent software architecture report with bounded concurrency, human approval gates, and vector shared memory.",
  },
];

export function NewWorkflowView({ onWorkflowCreated }: NewWorkflowViewProps) {
  const [requestText, setRequestText] = useState("");
  const [title, setTitle] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [isListening, setIsListening] = useState(false);

  // Execution Settings
  const [maxParallelTasks, setMaxParallelTasks] = useState(3);
  const [provider, setProvider] = useState<"auto" | "lyzr" | "mock">("auto");
  const [requireHumanApproval, setRequireHumanApproval] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);

  // Planning phase state
  const [isPlanning, setIsPlanning] = useState(false);
  const [createdWorkflowId, setCreatedWorkflowId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVoiceTranscript = (transcript: string) => {
    setRequestText(transcript);
    setInputType("voice");
  };

  const handleCreateAndPlan = async () => {
    if (!requestText.trim()) {
      setErrorMessage("Please enter or speak a task description.");
      return;
    }

    setIsPlanning(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: requestText,
          title: title.trim() || undefined,
          inputType,
          settings: {
            maxParallelTasks,
            provider,
            requireHumanApproval,
            autoVerify,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create workflow");
      }

      setCreatedWorkflowId(data.workflow.id);
      setPlan(data.executionPlan);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to generate workflow execution plan");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleUpdatePlanItem = (
    index: number,
    field: keyof PlanTaskItem,
    value: any
  ) => {
    if (!plan) return;
    const updatedTasks = [...plan.tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value,
    };
    setPlan({ ...plan, tasks: updatedTasks });
  };

  const handleAddPlanTask = () => {
    if (!plan) return;
    const newTask: PlanTaskItem = {
      id: `task_${Date.now()}`,
      title: "New Custom Subtask",
      description: "Custom subtask description",
      agentType: "research",
      dependencies: plan.tasks.length > 0 ? [plan.tasks[plan.tasks.length - 1].id] : [],
    };
    setPlan({ ...plan, tasks: [...plan.tasks, newTask] });
  };

  const handleDeletePlanTask = (index: number) => {
    if (!plan || plan.tasks.length <= 1) return;
    const updatedTasks = plan.tasks.filter((_, i) => i !== index);
    setPlan({ ...plan, tasks: updatedTasks });
  };

  const handleSavePlanAndExecute = async () => {
    if (!createdWorkflowId || !plan) return;

    try {
      // If user edited plan, sync with backend
      if (isEditingPlan) {
        await fetch(`/api/workflows/${createdWorkflowId}/update-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: plan.tasks }),
        });
      }

      // Trigger execution in background/engine
      fetch(`/api/workflows/${createdWorkflowId}/execute`, {
        method: "POST",
      }).catch(console.error);

      // Navigate to Agent Workspace
      onWorkflowCreated(createdWorkflowId);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to initiate execution");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Create New Multi-Agent Workflow
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Describe your task using voice or text. The Planner Agent will decompose it into a dependency graph of specialized subtasks.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* STEP 1: Input & Configuration */}
      {!plan && (
        <div className="space-y-6">
          {/* Main Input Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Natural-Language Task Prompt
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {inputType === "voice" ? "Voice Recognition Active" : "Text Input"}
                </span>
                <VoiceInputButton
                  onTranscriptChange={handleVoiceTranscript}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />
              </div>
            </div>

            <textarea
              value={requestText}
              onChange={(e) => {
                setRequestText(e.target.value);
                if (inputType === "voice" && !isListening) {
                  setInputType("text");
                }
              }}
              rows={4}
              placeholder="e.g. Research AI-powered education tools, compare five options, identify their advantages and disadvantages, and prepare a structured report..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-sans leading-relaxed"
            />

            {/* Optional Title */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Workflow Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave blank to auto-generate from prompt..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Example Chips */}
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">
                Try Example Prompts:
              </span>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setRequestText(ex.text);
                      setTitle(ex.title);
                      setInputType("text");
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/50 transition text-left"
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Settings Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Execution & Safety Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Max Parallelism */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Bounded Parallelism:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {maxParallelTasks} tasks
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={maxParallelTasks}
                  onChange={(e) => setMaxParallelTasks(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Provider Selection */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">AI Provider Mode:</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="auto">Auto (Lyzr Studio + Fallback)</option>
                  <option value="lyzr">Lyzr Studio Primary</option>
                  <option value="mock">Local Deterministic Engine</option>
                </select>
              </div>

              {/* Human Approval Gate */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-medium block">Human Approval</span>
                  <span className="text-[10px] text-slate-400">Pause before key tasks</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireHumanApproval}
                  onChange={(e) => setRequireHumanApproval(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Auto Verify */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-medium block">Automated Audit</span>
                  <span className="text-[10px] text-slate-400">Verification Agent review</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoVerify}
                  onChange={(e) => setAutoVerify(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Formulate Plan Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateAndPlan}
              disabled={isPlanning || !requestText.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              {isPlanning ? (
                <>
                  <Bot className="w-4 h-4 animate-spin" />
                  <span>Planner Agent Decomposing Tasks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Execution Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review & Edit Execution Plan */}
      {plan && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">
                  Execution Plan Generated
                </h3>
              </div>
              <button
                onClick={() => setIsEditingPlan(!isEditingPlan)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingPlan ? "Done Editing" : "Customize Plan"}</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {plan.summary}
            </p>
          </div>

          {/* Plan Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
              <span>Planned Subtasks & Agent Assignments</span>
              <span>{plan.tasks.length} subtasks</span>
            </div>

            {plan.tasks.map((task, idx) => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400 font-bold">
                      #{idx + 1}
                    </span>
                    {isEditingPlan ? (
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) =>
                          handleUpdatePlanItem(idx, "title", e.target.value)
                        }
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                      />
                    ) : (
                      <h4 className="text-xs font-semibold text-white">
                        {task.title}
                      </h4>
                    )}

                    {/* Agent select */}
                    {isEditingPlan ? (
                      <select
                        value={task.agentType}
                        onChange={(e) =>
                          handleUpdatePlanItem(idx, "agentType", e.target.value)
                        }
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300"
                      >
                        <option value="research">Researcher</option>
                        <option value="analysis">Analyst</option>
                        <option value="creation">Creator</option>
                        <option value="verification">Verifier</option>
                      </select>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-500/30">
                        {task.agentType}
                      </span>
                    )}
                  </div>

                  {isEditingPlan ? (
                    <textarea
                      value={task.description}
                      onChange={(e) =>
                        handleUpdatePlanItem(idx, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-300"
                    />
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      Dependencies:{" "}
                      {task.dependencies.length > 0
                        ? task.dependencies.join(", ")
                        : "None (Runs in parallel)"}
                    </span>
                    {task.requiresApproval && (
                      <span className="text-amber-400 font-medium">
                        Requires human approval
                      </span>
                    )}
                  </div>
                </div>

                {isEditingPlan && (
                  <button
                    onClick={() => handleDeletePlanTask(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400"
                    title="Remove task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {isEditingPlan && (
              <button
                onClick={handleAddPlanTask}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subtask to Plan</span>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setPlan(null);
                setCreatedWorkflowId(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ← Back to task prompt
            </button>

            <button
              onClick={handleSavePlanAndExecute}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Approve Plan & Launch Multi-Agent Workflow</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

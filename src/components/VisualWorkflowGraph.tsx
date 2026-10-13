"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Bot,
  Search,
  LineChart,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { AgentType, TaskStatus } from "@/lib/types";

interface GraphTask {
  id: string;
  title: string;
  description: string;
  agentType: string;
  status: TaskStatus;
  orderIndex: number;
  durationMs?: number | null;
  dependencies?: Array<{ dependsOnTaskId: string }>;
}

interface VisualWorkflowGraphProps {
  tasks: GraphTask[];
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
}

const AGENT_CONFIG: Record<
  AgentType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  planner: {
    label: "Planner",
    icon: Bot,
    color: "text-indigo-400",
    bg: "bg-indigo-950/40",
    border: "border-indigo-500/40",
  },
  research: {
    label: "Researcher",
    icon: Search,
    color: "text-sky-400",
    bg: "bg-sky-950/40",
    border: "border-sky-500/40",
  },
  analysis: {
    label: "Analyst",
    icon: LineChart,
    color: "text-violet-400",
    bg: "bg-violet-950/40",
    border: "border-violet-500/40",
  },
  creation: {
    label: "Creator",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/40",
  },
  verification: {
    label: "Verifier",
    icon: ShieldCheck,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-500/40",
  },
  orchestrator: {
    label: "Orchestrator",
    icon: Bot,
    color: "text-slate-400",
    bg: "bg-slate-900",
    border: "border-slate-700",
  },
};

const STATUS_ICONS: Record<
  TaskStatus,
  { icon: React.ElementType; text: string; badgeClass: string }
> = {
  pending: {
    icon: Clock,
    text: "Pending",
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
  },
  running: {
    icon: PlayCircle,
    text: "Running",
    badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-500 animate-pulse",
  },
  completed: {
    icon: CheckCircle2,
    text: "Completed",
    badgeClass: "bg-emerald-950/60 text-emerald-400 border-emerald-500/50",
  },
  failed: {
    icon: XCircle,
    text: "Failed",
    badgeClass: "bg-red-950/80 text-red-400 border-red-500",
  },
  awaiting_approval: {
    icon: PauseCircle,
    text: "Awaiting Approval",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500 animate-bounce",
  },
  cancelled: {
    icon: AlertTriangle,
    text: "Cancelled",
    badgeClass: "bg-slate-800 text-slate-500 border-slate-700",
  },
};

export function VisualWorkflowGraph({
  tasks,
  selectedTaskId,
  onSelectTask,
}: VisualWorkflowGraphProps) {
  // Compute DAG topological levels/columns
  const { nodePositions, edges, width, height } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { nodePositions: new Map(), edges: [], width: 700, height: 300 };
    }

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const depths = new Map<string, number>();

    // Calculate topological depth for each task
    function getDepth(id: string, visited = new Set<string>()): number {
      if (depths.has(id)) return depths.get(id)!;
      if (visited.has(id)) return 0; // avoid cycle
      visited.add(id);

      const task = taskMap.get(id);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        depths.set(id, 0);
        return 0;
      }

      let maxParentDepth = 0;
      for (const dep of task.dependencies) {
        const pDepth = getDepth(dep.dependsOnTaskId, new Set(visited));
        maxParentDepth = Math.max(maxParentDepth, pDepth + 1);
      }

      depths.set(id, maxParentDepth);
      return maxParentDepth;
    }

    tasks.forEach((t) => getDepth(t.id));

    // Group tasks by level/column
    const columns: Record<number, GraphTask[]> = {};
    tasks.forEach((t) => {
      const col = depths.get(t.id) || 0;
      if (!columns[col]) columns[col] = [];
      columns[col].push(t);
    });

    const maxCol = Math.max(...Object.keys(columns).map(Number), 0);
    const colWidth = 260;
    const nodeHeight = 120;
    const verticalGap = 40;

    const positions = new Map<string, { x: number; y: number }>();
    let maxTotalHeight = 350;

    Object.entries(columns).forEach(([colStr, colTasks]) => {
      const col = Number(colStr);
      const totalColHeight = colTasks.length * (nodeHeight + verticalGap);
      maxTotalHeight = Math.max(maxTotalHeight, totalColHeight + 100);

      colTasks.forEach((task, index) => {
        const x = 50 + col * colWidth;
        const y = 50 + index * (nodeHeight + verticalGap);
        positions.set(task.id, { x, y });
      });
    });

    // Generate edges
    const graphEdges: Array<{
      id: string;
      fromId: string;
      toId: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      isActive: boolean;
    }> = [];

    tasks.forEach((task) => {
      if (task.dependencies) {
        task.dependencies.forEach((dep) => {
          const fromPos = positions.get(dep.dependsOnTaskId);
          const toPos = positions.get(task.id);
          if (fromPos && toPos) {
            graphEdges.push({
              id: `${dep.dependsOnTaskId}->${task.id}`,
              fromId: dep.dependsOnTaskId,
              toId: task.id,
              fromX: fromPos.x + 210, // right side of node
              fromY: fromPos.y + 50,  // center vertical
              toX: toPos.x,           // left side of node
              toY: toPos.y + 50,      // center vertical
              isActive: task.status === "running" || task.status === "completed",
            });
          }
        });
      }
    });

    const totalWidth = Math.max(800, (maxCol + 1) * colWidth + 100);

    return {
      nodePositions: positions,
      edges: graphEdges,
      width: totalWidth,
      height: maxTotalHeight,
    };
  }, [tasks]);

  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Execution Dependency DAG</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            {tasks.length} subtasks
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
            Running
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Approval Needed
          </span>
        </div>
      </div>

      <div style={{ minWidth: width, minHeight: height }} className="relative">
        {/* SVG Bezier connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
            </marker>
            <marker
              id="arrowhead-default"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#475569" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const dx = (edge.toX - edge.fromX) / 2;
            const pathData = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX + dx} ${
              edge.fromY
            }, ${edge.toX - dx} ${edge.toY}, ${edge.toX} ${edge.toY}`;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={edge.isActive ? "#6366f1" : "#334155"}
                  strokeWidth={edge.isActive ? 2 : 1.5}
                  strokeDasharray={edge.isActive ? "none" : "4 4"}
                  markerEnd={
                    edge.isActive ? "url(#arrowhead-active)" : "url(#arrowhead-default)"
                  }
                  className={edge.isActive ? "transition-all duration-300" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* Task Nodes */}
        {tasks.map((task) => {
          const pos = nodePositions.get(task.id) || { x: 50, y: 50 };
          const agentCfg =
            AGENT_CONFIG[task.agentType as AgentType] || AGENT_CONFIG.planner;
          const statusCfg = STATUS_ICONS[task.status] || STATUS_ICONS.pending;
          const AgentIcon = agentCfg.icon;
          const StatusIcon = statusCfg.icon;
          const isSelected = selectedTaskId === task.id;
          const isRunning = task.status === "running";

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask?.(task.id)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 210,
              }}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md select-none group ${
                isSelected
                  ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30"
                  : isRunning
                  ? "bg-slate-900/95 border-indigo-500/80 shadow-md shadow-indigo-500/20 node-running"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Agent header tag */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${agentCfg.bg} ${agentCfg.color} ${agentCfg.border}`}
                >
                  <AgentIcon className="w-3 h-3" />
                  {agentCfg.label}
                </span>

                <span
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusCfg.badgeClass}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.text}
                </span>
              </div>

              {/* Task title */}
              <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-tight group-hover:text-white">
                {task.title}
              </h4>

              {/* Duration or order */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Task #{task.orderIndex + 1}</span>
                {typeof task.durationMs === "number" && task.durationMs > 0 && (
                  <span className="font-mono text-emerald-400">
                    {(task.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

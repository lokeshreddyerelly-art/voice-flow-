"use client";

import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Network,
  Database,
  History,
  Settings,
  Bot,
  Sparkles,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "new-workflow"
  | "workspace"
  | "memory"
  | "history"
  | "settings";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  runningCount?: number;
  memoryCount?: number;
}

export function Navigation({
  activeTab,
  onTabChange,
  runningCount = 0,
  memoryCount = 0,
}: NavigationProps) {
  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "new-workflow" as NavTab,
      label: "New Workflow",
      icon: PlusCircle,
      badge: "Voice & Text",
      isHighlight: true,
    },
    {
      id: "workspace" as NavTab,
      label: "Agent Workspace",
      icon: Network,
      badge: runningCount > 0 ? `${runningCount} active` : null,
      badgeColor: runningCount > 0 ? "bg-amber-500/20 text-amber-300" : undefined,
    },
    {
      id: "memory" as NavTab,
      label: "Shared Memory",
      icon: Database,
      badge: memoryCount > 0 ? String(memoryCount) : null,
    },
    {
      id: "history" as NavTab,
      label: "Workflow History",
      icon: History,
      badge: null,
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-md">
      {/* Brand header */}
      <div>
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  VoiceFlow
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Agents
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Multi-Agent Orchestrator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor ||
                      (isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">Lyzr AI Engine</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Connected
          </span>
        </div>
      </div>
    </aside>
  );
}

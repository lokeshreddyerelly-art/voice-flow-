"use client";

import React, { useState, useEffect } from "react";
import { Navigation, NavTab } from "@/components/Navigation";
import { DashboardView } from "@/components/DashboardView";
import { NewWorkflowView } from "@/components/NewWorkflowView";
import { AgentWorkspaceView } from "@/components/AgentWorkspaceView";
import { SharedMemoryView } from "@/components/SharedMemoryView";
import { WorkflowHistoryView } from "@/components/WorkflowHistoryView";
import { SettingsView } from "@/components/SettingsView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  // Poll metrics periodically for nav badge counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/metrics");
        const data = await res.json();
        if (data.metrics) {
          setRunningCount(data.metrics.runningWorkflows || 0);
          setMemoryCount(data.metrics.totalMemories || 0);
        }
      } catch {
        // ignore
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleWorkflowCreated = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setActiveTab("workspace");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        runningCount={runningCount}
        memoryCount={memoryCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950/40 min-h-screen">
        {activeTab === "dashboard" && (
          <DashboardView
            onNavigate={setActiveTab}
            onSelectWorkflow={setSelectedWorkflowId}
          />
        )}

        {activeTab === "new-workflow" && (
          <NewWorkflowView onWorkflowCreated={handleWorkflowCreated} />
        )}

        {activeTab === "workspace" && (
          <AgentWorkspaceView
            selectedWorkflowId={selectedWorkflowId}
            onSelectWorkflow={setSelectedWorkflowId}
          />
        )}

        {activeTab === "memory" && <SharedMemoryView />}

        {activeTab === "history" && (
          <WorkflowHistoryView
            onNavigate={setActiveTab}
            onSelectWorkflow={setSelectedWorkflowId}
          />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Bot,
  Tag,
  ShieldCheck,
  RefreshCw,
  Clock,
} from "lucide-react";
import { MemoryCategory } from "@/lib/types";

export function SharedMemoryView() {
  const [memories, setMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [persistenceFilter, setPersistenceFilter] = useState<"all" | "persistent" | "temporary">("all");
  const [isLoading, setIsLoading] = useState(false);

  // New Note Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState<MemoryCategory>("persistent_knowledge");

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (persistenceFilter === "persistent") params.append("isPersistent", "true");
      if (persistenceFilter === "temporary") params.append("isPersistent", "false");

      const res = await fetch(`/api/memory?${params.toString()}`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error("Failed to load memory:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, persistenceFilter]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory record?")) return;

    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          isPersistent: true,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNoteTitle("");
        setNoteContent("");
        fetchMemories();
      }
    } catch (err) {
      console.error("Failed to create memory:", err);
    }
  };

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "findings", label: "Empirical Findings" },
    { id: "decision", label: "Decisions & Audits" },
    { id: "intermediate", label: "Intermediate Deliverables" },
    { id: "persistent_knowledge", label: "Persistent Knowledge" },
    { id: "context", label: "Context" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-400" />
            Shared Semantic Memory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persistent knowledge base and intermediate workflow artifacts indexed by 128-dimensional cosine vector embeddings and hybrid keyword search.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMemories}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh memory store"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Record</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        {/* Semantic search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory with semantic similarity or keywords (e.g. Khanmigo, pros/cons, education benchmarks)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Persistence Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPersistenceFilter("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                persistenceFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPersistenceFilter("persistent")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                persistenceFilter === "persistent"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Persistent Only
            </button>
            <button
              onClick={() => setPersistenceFilter("temporary")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                persistenceFilter === "temporary"
                  ? "bg-slate-800 text-slate-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Temporary State
            </button>
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      {memories.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            No memory records found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Memories are automatically recorded as agents run research and analysis, or you can add custom persistent knowledge manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((mem) => {
            return (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-md"
              >
                <div>
                  {/* Category and persistence badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {mem.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {mem.isPersistent ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Persistent
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                          Workflow State
                        </span>
                      )}

                      {typeof mem.score === "number" && (
                        <span
                          className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30"
                          title="Semantic Cosine Relevance Score"
                        >
                          {(mem.score * 100).toFixed(0)}% match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1 mb-1.5">
                    {mem.title}
                  </h4>

                  {/* Content snippet */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    {mem.content}
                  </p>
                </div>

                {/* Footer provenance & delete button */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{mem.sourceAgent}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Knowledge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              Add Knowledge Record
            </h3>

            <form onSubmit={handleCreateMemory} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Education AI Guidelines & Privacy Protocols"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Category
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="persistent_knowledge">Persistent Knowledge</option>
                  <option value="findings">Empirical Findings</option>
                  <option value="decision">Decision</option>
                  <option value="context">Context</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter context, findings, or constraints that future agent workflows should incorporate..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Loader2, Layout } from "lucide-react";
import { Board, BoardTheme } from "@/types/stride";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (board: Board) => void;
}

const THEMES: { id: BoardTheme; name: string; bgClass: string }[] = [
  { id: "ocean", name: "Ocean", bgClass: "from-blue-600 to-cyan-700" },
  { id: "slate", name: "Slate", bgClass: "from-slate-700 to-zinc-900" },
  { id: "emerald", name: "Emerald", bgClass: "from-emerald-600 to-teal-800" },
  { id: "indigo", name: "Indigo", bgClass: "from-indigo-600 to-violet-800" },
  { id: "sunset", name: "Sunset", bgClass: "from-amber-600 to-rose-700" },
  { id: "rose", name: "Rose", bgClass: "from-rose-600 to-pink-800" },
];

export default function NewBoardModal({
  isOpen,
  onClose,
  onCreateSuccess,
}: NewBoardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState<BoardTheme>("ocean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useIsMounted();

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          background,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create board");
      }

      onCreateSuccess(data.board);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create New Board</h2>
              <p className="text-xs text-slate-400">
                Setup a new Kanban board for your projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Board Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Launch, Sprint Tracker..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of board goals..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => setBackground(theme.id)}
                  className={`h-11 rounded-xl bg-gradient-to-br ${
                    theme.bgClass
                  } border-2 transition-all flex items-center justify-center text-xs font-medium ${
                    background === theme.id
                      ? "border-white shadow-lg shadow-black/40 scale-102"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

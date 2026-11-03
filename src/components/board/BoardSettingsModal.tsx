"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Settings,
  Plus,
  Trash2,
  Sliders,
  Type,
  Hash,
  Eye,
  Check,
  Loader2,
} from "lucide-react";
import {
  Board,
  BoardTheme,
  CustomFieldDefinition,
  CustomFieldType,
} from "@/types/stride";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

interface BoardSettingsModalProps {
  isOpen: boolean;
  board: Board;
  onClose: () => void;
  onUpdateBoard: (updatedBoard: Board) => void;
}

const THEMES: { id: BoardTheme; name: string; bgClass: string }[] = [
  { id: "ocean", name: "Ocean", bgClass: "from-blue-600 to-cyan-700" },
  { id: "slate", name: "Slate", bgClass: "from-slate-700 to-zinc-900" },
  { id: "emerald", name: "Emerald", bgClass: "from-emerald-600 to-teal-800" },
  { id: "indigo", name: "Indigo", bgClass: "from-indigo-600 to-violet-800" },
  { id: "sunset", name: "Sunset", bgClass: "from-amber-600 to-rose-700" },
  { id: "rose", name: "Rose", bgClass: "from-rose-600 to-pink-800" },
];

export default function BoardSettingsModal({
  isOpen,
  board,
  onClose,
  onUpdateBoard,
}: BoardSettingsModalProps) {
  const mounted = useIsMounted();
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || "");
  const [background, setBackground] = useState<BoardTheme>(board.background);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(
    board.customFields || []
  );

  // New field form state
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newFieldShowOnFront, setNewFieldShowOnFront] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !mounted) return null;

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const newField: CustomFieldDefinition = {
      id: `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      boardId: board.id,
      name: newFieldName.trim(),
      type: newFieldType,
      showOnFront: newFieldShowOnFront,
    };

    setCustomFields([...customFields, newField]);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldShowOnFront(true);
  };

  const handleToggleShowOnFront = (fieldId: string) => {
    setCustomFields(
      customFields.map((f) =>
        f.id === fieldId ? { ...f, showOnFront: !f.showOnFront } : f
      )
    );
  };

  const handleDeleteField = (fieldId: string) => {
    setCustomFields(customFields.filter((f) => f.id !== fieldId));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          background,
          customFields,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update board");
      }

      onUpdateBoard(data.board);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Board Settings</h2>
              <p className="text-xs text-slate-400">
                Manage board details and configure custom fields
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

        {/* Section 1: General Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            General Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Board Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => setBackground(theme.id)}
                  className={`h-10 rounded-xl bg-gradient-to-br ${
                    theme.bgClass
                  } border-2 transition-all flex items-center justify-center text-xs font-medium ${
                    background === theme.id
                      ? "border-white shadow-lg shadow-black/40 scale-102"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Custom Fields */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              Card Custom Fields
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add structured metadata fields (Text or Number) to cards. Toggle &ldquo;Show on front&rdquo; to display the value as a badge on the Kanban board.
            </p>
          </div>

          {/* Current Custom Fields List */}
          <div className="space-y-2">
            {customFields.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No custom fields defined on this board yet.
              </div>
            ) : (
              customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg text-xs font-medium ${
                        field.type === "number"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {field.type === "number" ? (
                        <Hash className="w-3.5 h-3.5" />
                      ) : (
                        <Type className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate">
                        {field.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        Type: {field.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle Show on Front */}
                    <button
                      type="button"
                      onClick={() => handleToggleShowOnFront(field.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        field.showOnFront
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
                          : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
                      }`}
                      title="Toggle visibility on card front"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{field.showOnFront ? "On Card Front" : "Hidden on Front"}</span>
                    </button>

                    {/* Delete Field */}
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Field Form */}
          <form
            onSubmit={handleAddField}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              Add a New Field
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name (e.g. Budget, Story Points, Client Lead)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="text">Text Field</option>
                  <option value="number">Number Field</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={!newFieldName.trim()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Field
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none pt-1">
              <input
                type="checkbox"
                checked={newFieldShowOnFront}
                onChange={(e) => setNewFieldShowOnFront(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Show this field on front of card in Kanban view</span>
            </label>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-emerald-400 flex items-center gap-1.5">
            {savedSuccess && (
              <>
                <Check className="w-4 h-4" />
                <span>Board settings saved successfully!</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving || !title.trim()}
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  List,
  Label,
  SessionUser,
  ChecklistItem,
  CardPriority,
  LabelColor,
  CustomFieldDefinition,
} from "@/types/stride";
import {
  X,
  Calendar,
  CheckSquare,
  Tag,
  Clock,
  Trash2,
  Send,
  CheckCircle2,
  Sparkles,
  Paperclip,
  Upload,
  ExternalLink,
  FileText,
  Loader2,
  Hash,
} from "lucide-react";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

interface CardModalProps {
  card: Card;
  lists: List[];
  labels: Label[];
  customFields?: CustomFieldDefinition[];
  currentUser: SessionUser;
  onClose: () => void;
  onUpdateCard: (updatedCard: Card) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onCreateLabel: (name: string, color: LabelColor) => Promise<Label>;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  sky: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  teal: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  zinc: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export default function CardModal({
  card,
  lists,
  labels,
  customFields = [],
  currentUser,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onCreateLabel,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.slice(0, 16) : ""
  );
  const [isCompleted, setIsCompleted] = useState(card.isCompleted);
  const [priority, setPriority] = useState<CardPriority>(card.priority || "medium");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [comments, setComments] = useState(card.comments || []);
  const [labelIds, setLabelIds] = useState<string[]>(card.labelIds || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newCustomLabelName, setNewCustomLabelName] = useState("");
  const [newCustomLabelColor, setNewCustomLabelColor] = useState<LabelColor>("indigo");
  const mounted = useIsMounted();

  const currentList = lists.find((l) => l.id === card.listId);

  // Checklists progress
  const totalChecks = checklist.length;
  const completedChecks = checklist.filter((c) => c.isDone).length;
  const progressPercent = totalChecks === 0 ? 0 : Math.round((completedChecks / totalChecks) * 100);

  const [attachments, setAttachments] = useState(card.attachments || []);
  const [coverImageUrl, setCoverImageUrl] = useState(card.coverImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number>>(
    card.customFieldValues || {}
  );

  const savePatch = async (patch: Partial<Card>) => {
    const updated: Card = {
      ...card,
      ...patch,
      title: patch.title !== undefined ? patch.title : title,
      description: patch.description !== undefined ? patch.description : description,
      dueDate: patch.dueDate !== undefined ? patch.dueDate : (dueDate ? new Date(dueDate).toISOString() : null),
      isCompleted: patch.isCompleted !== undefined ? patch.isCompleted : isCompleted,
      priority: patch.priority !== undefined ? patch.priority : priority,
      labelIds: patch.labelIds !== undefined ? patch.labelIds : labelIds,
      checklist: patch.checklist !== undefined ? patch.checklist : checklist,
      comments: patch.comments !== undefined ? patch.comments : comments,
      attachments: patch.attachments !== undefined ? patch.attachments : attachments,
      coverImageUrl: patch.coverImageUrl !== undefined ? patch.coverImageUrl : coverImageUrl,
      customFieldValues: patch.customFieldValues !== undefined ? patch.customFieldValues : customFieldValues,
    };
    await onUpdateCard(updated);
  };

  const handleCustomFieldChange = (fieldId: string, value: string | number) => {
    const updated = {
      ...customFieldValues,
      [fieldId]: value,
    };
    setCustomFieldValues(updated);
    savePatch({ customFieldValues: updated });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cardId", card.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed");
      }

      const updatedAttachments = [...attachments, data.attachment];
      setAttachments(updatedAttachments);

      // If it's an image and there's no cover, set it as cover
      if (file.type.startsWith("image/") && !coverImageUrl) {
        setCoverImageUrl(data.url);
        await savePatch({
          attachments: updatedAttachments,
          coverImageUrl: data.url,
        });
      } else {
        await savePatch({ attachments: updatedAttachments });
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = (url: string | null) => {
    setCoverImageUrl(url);
    savePatch({ coverImageUrl: url });
  };

  const handleDeleteAttachment = (attId: string) => {
    const target = attachments.find((a) => a.id === attId);
    const updated = attachments.filter((a) => a.id !== attId);
    setAttachments(updated);
    const newCover = coverImageUrl === target?.url ? null : coverImageUrl;
    setCoverImageUrl(newCover);
    savePatch({ attachments: updated, coverImageUrl: newCover });
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== card.title) {
      savePatch({ title: title.trim() });
    }
  };

  const handleSaveDescription = () => {
    setIsEditingDesc(false);
    savePatch({ description });
  };

  const handleToggleCheckItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, isDone: !item.isDone } : item
    );
    setChecklist(updated);
    const allDone = updated.length > 0 && updated.every((i) => i.isDone);
    if (allDone) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // silent fallback
      }
    }
    savePatch({ checklist: updated });
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newCheckItem.trim(),
      isDone: false,
    };
    const updated = [...checklist, item];
    setChecklist(updated);
    setNewCheckItem("");
    savePatch({ checklist: updated });
  };

  const handleDeleteCheckItem = (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    setChecklist(updated);
    savePatch({ checklist: updated });
  };

  const handleToggleLabel = (lblId: string) => {
    const updated = labelIds.includes(lblId)
      ? labelIds.filter((id) => id !== lblId)
      : [...labelIds, lblId];
    setLabelIds(updated);
    savePatch({ labelIds: updated });
  };

  const handleCreateCustomLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomLabelName.trim()) return;
    const created = await onCreateLabel(newCustomLabelName.trim(), newCustomLabelColor);
    const updated = [...labelIds, created.id];
    setLabelIds(updated);
    setNewCustomLabelName("");
    await savePatch({ labelIds: updated });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/cards/${card.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newCommentText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        const updated = [...comments, data.comment];
        setComments(updated);
        setNewCommentText("");
      }
    } catch {
      // fallback
    }
  };

  const handleDueDateChange = (newVal: string) => {
    setDueDate(newVal);
    savePatch({ dueDate: newVal ? new Date(newVal).toISOString() : null });
  };

  const handleToggleComplete = () => {
    const nextVal = !isCompleted;
    setIsCompleted(nextVal);
    if (nextVal) {
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch {
        // silent
      }
    }
    savePatch({ isCompleted: nextVal });
  };

  const handlePriorityChange = (newPri: CardPriority) => {
    setPriority(newPri);
    savePatch({ priority: newPri });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Cover Image Banner */}
        {coverImageUrl && (
          <div className="relative w-full h-44 bg-slate-950 overflow-hidden border-b border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt="Card cover"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleSetCover(null)}
              className="absolute right-3 bottom-3 px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-md text-xs text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Remove cover
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                In list: {currentList?.title || "Unknown"}
              </span>
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isCompleted ? "Completed" : "Mark Complete"}
              </button>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-xl sm:text-2xl font-bold bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 -ml-2 text-white focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Grid: Main Content & Sidebar Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Area (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Active Labels */}
            {labelIds.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {labels
                    .filter((l) => labelIds.includes(l.id))
                    .map((lbl) => (
                      <span
                        key={lbl.id}
                        onClick={() => handleToggleLabel(lbl.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border cursor-pointer hover:opacity-80 transition-all ${
                          COLOR_CLASSES[lbl.color] || COLOR_CLASSES.indigo
                        }`}
                        title="Click to remove"
                      >
                        {lbl.name} &times;
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </h4>
                {!isEditingDesc && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Add detailed markdown notes, requirements, or links..."
                    className="w-full p-3 bg-slate-950 border border-indigo-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(card.description || "");
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 cursor-text text-sm text-slate-200 min-h-[70px] whitespace-pre-wrap leading-relaxed transition-colors"
                >
                  {description ? (
                    description
                  ) : (
                    <span className="text-slate-500 italic">
                      Click to add a detailed description...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Custom Fields
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from(new Map(customFields.map((f) => [f.id, f])).values()).map((field) => {
                    const val = customFieldValues[field.id] ?? "";
                    return (
                      <div
                        key={field.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-300">
                            {field.name}
                          </label>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {field.type}
                          </span>
                        </div>
                        {field.type === "number" ? (
                          <input
                            type="number"
                            value={val}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                field.id,
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="Enter number..."
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              handleCustomFieldChange(field.id, e.target.value)
                            }
                            placeholder="Enter text..."
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Checklist
                  </h4>
                  {totalChecks > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      ({completedChecks}/{totalChecks})
                    </span>
                  )}
                </div>
                {totalChecks > 0 && (
                  <span className="text-xs font-bold text-indigo-400">
                    {progressPercent}%
                  </span>
                )}
              </div>

              {/* Animated Progress Bar */}
              {totalChecks > 0 && (
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950 border border-slate-800/60 transition-colors"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => handleToggleCheckItem(item.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span
                        className={`text-sm break-words ${
                          item.isDone ? "line-through text-slate-500" : "text-slate-200"
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddCheckItem} className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Add a subtask or checklist item..."
                  className="flex-1 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newCheckItem.trim()}
                  className="px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Attachments & Images */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Attachments & Images
                  </h4>
                  {attachments.length > 0 && (
                    <span className="text-xs text-slate-400">
                      ({attachments.length})
                    </span>
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach image / file</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {uploading && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl flex items-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Uploading to Vercel storage...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                  {uploadError}
                </div>
              )}

              {/* Attachments Grid */}
              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att) => {
                    const isImage = att.mimeType.startsWith("image/");
                    const isCover = coverImageUrl === att.url;
                    return (
                      <div
                        key={att.id}
                        className="group flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {isImage ? (
                          <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-medium text-white truncate">{att.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>{(att.size / 1024).toFixed(0)} KB</span>
                            {isImage && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(isCover ? null : att.url)}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors ${
                                  isCover
                                    ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                                }`}
                              >
                                {isCover ? "Current Cover" : "Set Cover"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            title="Open / Download"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No images or attachments yet. Drop or upload images to preview on cards.
                </div>
              )}
            </div>

            {/* Comments & Activity Stream */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                Activity & Conversation
              </h4>

              {/* Comment list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No comments yet.</p>
                ) : (
                  comments.map((cmt) => (
                    <div
                      key={cmt.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">
                            {cmt.authorName}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              cmt.authorRole === "owner"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {cmt.authorRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {format(new Date(cmt.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed break-words">
                        {cmt.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handlePostComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={`Write a comment as ${currentUser.name}...`}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar Controls (1 col) */}
          <div className="space-y-5">
            {/* Due Date Tool */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => handleDueDateChange("")}
                  className="text-[11px] text-slate-500 hover:text-rose-400"
                >
                  Clear deadline
                </button>
              )}
            </div>

            {/* Priority Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as CardPriority)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent 🚨</option>
              </select>
            </div>

            {/* Labels Manager */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Labels
                </label>
                <button
                  type="button"
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {showLabelPicker ? "Done" : "Manage"}
                </button>
              </div>

              {/* Label selector list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {labels.map((lbl) => {
                  const isSelected = labelIds.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggleLabel(lbl.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border flex items-center justify-between transition-all ${
                        isSelected
                          ? COLOR_CLASSES[lbl.color] || COLOR_CLASSES.indigo
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <span>{lbl.name}</span>
                      {isSelected && <Sparkles className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Create new label inline */}
              {showLabelPicker && (
                <form
                  onSubmit={handleCreateCustomLabel}
                  className="space-y-2 pt-2 border-t border-slate-800"
                >
                  <input
                    type="text"
                    value={newCustomLabelName}
                    onChange={(e) => setNewCustomLabelName(e.target.value)}
                    placeholder="New label name..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newCustomLabelColor}
                      onChange={(e) =>
                        setNewCustomLabelColor(e.target.value as LabelColor)
                      }
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="indigo">Indigo</option>
                      <option value="emerald">Emerald</option>
                      <option value="amber">Amber</option>
                      <option value="rose">Rose</option>
                      <option value="purple">Purple</option>
                      <option value="sky">Sky</option>
                      <option value="orange">Orange</option>
                      <option value="zinc">Zinc</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!newCustomLabelName.trim()}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Upload Action */}
            <label className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attach Image or File</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {/* Delete Card */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this card?")) {
                    onDeleteCard(card.id);
                    onClose();
                  }
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Card
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}

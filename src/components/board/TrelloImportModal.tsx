"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, FileJson, CheckCircle2, AlertCircle, X, Loader2, ArrowRight } from "lucide-react";
import { Board } from "@/types/stride";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

interface TrelloImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newBoard: Board) => void;
}

interface Summary {
  boardTitle: string;
  listCount: number;
  cardCount: number;
  checklistCount: number;
  labelCount: number;
}

export default function TrelloImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: TrelloImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useIsMounted();

  if (!isOpen || !mounted) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".json")) {
      setError("Please select a valid .json file exported from Trello.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const text = await selectedFile.text();
      setJsonContent(text);
      const parsed = JSON.parse(text);

      // Perform a dry-run check with our API
      const res = await fetch("/api/boards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trelloData: parsed, dryRun: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse Trello export");
      }

      setSummary(data.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid Trello JSON file format");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!jsonContent) return;
    setImporting(true);
    setError(null);

    try {
      const parsed = JSON.parse(jsonContent);
      const res = await fetch("/api/boards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trelloData: parsed, dryRun: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      onImportSuccess(data.board);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing import");
    } finally {
      setImporting(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Trello Board</h2>
              <p className="text-xs text-slate-400">
                Upload a JSON export from your existing Trello board
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
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        {!summary && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 flex flex-col items-center justify-center space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".json"
              className="hidden"
            />
            {loading ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            ) : (
              <FileJson className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : "Click to browse or drop your Trello .json file"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Export via Trello &rarr; Menu &rarr; Print and export &rarr; Export as JSON
              </p>
            </div>
          </div>
        )}

        {/* Summary preview */}
        {summary && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Board Detected
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Import
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{summary.boardTitle}</h3>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-lg font-bold text-indigo-400">{summary.listCount}</div>
                  <div className="text-[11px] text-slate-400">Lists</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400">{summary.cardCount}</div>
                  <div className="text-[11px] text-slate-400">Cards</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-lg font-bold text-amber-400">{summary.checklistCount}</div>
                  <div className="text-[11px] text-slate-400">Checklists</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-lg font-bold text-purple-400">{summary.labelCount}</div>
                  <div className="text-[11px] text-slate-400">Labels</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSummary(null);
                  setFile(null);
                  setJsonContent(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Choose another file
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing Board...
                  </>
                ) : (
                  <>
                    Confirm & Import
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

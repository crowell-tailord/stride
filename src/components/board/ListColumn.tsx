"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { List, Card, Label, CustomFieldDefinition } from "@/types/stride";
import CardItem from "./CardItem";
import { Plus, MoreHorizontal, X, Trash2 } from "lucide-react";

interface ListColumnProps {
  list: List;
  cards: Card[];
  labels: Label[];
  customFields?: CustomFieldDefinition[];
  onCardClick: (card: Card) => void;
  onAddCard: (listId: string, title: string) => Promise<void>;
  onUpdateListTitle: (listId: string, title: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
}

export default function ListColumn({
  list,
  cards,
  labels,
  customFields,
  onCardClick,
  onAddCard,
  onUpdateListTitle,
  onDeleteList,
}: ListColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "List",
      list,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await onAddCard(list.id, newCardTitle.trim());
    setNewCardTitle("");
    setIsAdding(false);
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (listTitle.trim() && listTitle.trim() !== list.title) {
      await onUpdateListTitle(list.id, listTitle.trim());
    } else {
      setListTitle(list.title);
    }
  };

  const cardIds = cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-72 sm:w-80 shrink-0 flex flex-col max-h-[calc(100vh-140px)] rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-xl transition-all ${
        isDragging ? "opacity-40 border-dashed border-indigo-500 scale-98" : ""
      }`}
    >
      {/* Column Header */}
      <div
        suppressHydrationWarning
        {...attributes}
        {...listeners}
        className="flex items-center justify-between p-3.5 border-b border-slate-800/60 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setListTitle(list.title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-full text-xs font-bold uppercase tracking-wider text-slate-100 bg-slate-800 px-2 py-1 rounded border border-indigo-500/50 focus:outline-none"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white truncate cursor-text"
              title="Click to edit list title"
            >
              {list.title}
            </h3>
          )}
          <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
            {cards.length}
          </span>
        </div>

        {/* Column Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1 z-30 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setIsAdding(true);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setIsEditingTitle(true);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                Rename list
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  if (confirm(`Delete list "${list.title}" and its cards?`)) {
                    onDeleteList(list.id);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Scrollable Body */}
      <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-[50px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              labels={labels}
              customFields={customFields}
              onCardClick={onCardClick}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !isAdding && (
          <div className="py-6 text-center text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
            Drop cards here
          </div>
        )}
      </div>

      {/* Footer: Quick Card Composer */}
      <div className="p-2 border-t border-slate-800/60">
        {isAdding ? (
          <form onSubmit={handleCreateCard} className="space-y-2">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard(e);
                }
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewCardTitle("");
                }
              }}
              placeholder="Enter card title..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none resize-none shadow-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewCardTitle("");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
}

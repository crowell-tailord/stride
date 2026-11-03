"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Board, List, Card, Label, SessionUser, LabelColor } from "@/types/stride";
import ListColumn from "./ListColumn";
import CardItem from "./CardItem";
import CardModal from "../card/CardModal";
import { Plus, Search, Filter, X } from "lucide-react";

interface KanbanBoardProps {
  board: Board;
  initialLists: List[];
  initialCards: Card[];
  initialLabels: Label[];
  currentUser: SessionUser;
}

export default function KanbanBoard({
  board,
  initialLists,
  initialCards,
  initialLabels,
  currentUser,
}: KanbanBoardProps) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [labels, setLabels] = useState<Label[]>(initialLabels);

  // Active items for DragOverlay
  const [activeList, setActiveList] = useState<List | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Selected card for CardModal
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);

  // New list creation inline state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to distinguish click from drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Filtered cards based on search and label filters
  const filteredCards = cards.filter((card) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchDesc = card.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (selectedLabelFilter) {
      if (!card.labelIds?.includes(selectedLabelFilter)) return false;
    }
    return true;
  });

  // --- Handlers: Drag & Drop ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "List") {
      setActiveList(activeData.list);
    } else if (activeData?.type === "Card") {
      setActiveCard(activeData.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";
    const isOverAList = over.data.current?.type === "List";

    if (!isActiveACard) return;

    // Dragging a card over another card in different list
    if (isActiveACard && isOverACard) {
      setCards((prevCards) => {
        const activeIndex = prevCards.findIndex((c) => c.id === activeId);
        const overIndex = prevCards.findIndex((c) => c.id === overId);

        if (prevCards[activeIndex].listId !== prevCards[overIndex].listId) {
          const updated = [...prevCards];
          updated[activeIndex] = {
            ...updated[activeIndex],
            listId: prevCards[overIndex].listId,
          };
          return arrayMove(updated, activeIndex, overIndex);
        }

        return arrayMove(prevCards, activeIndex, overIndex);
      });
    }

    // Dragging a card over an empty list column
    if (isActiveACard && isOverAList) {
      setCards((prevCards) => {
        const activeIndex = prevCards.findIndex((c) => c.id === activeId);
        if (prevCards[activeIndex].listId !== overId) {
          const updated = [...prevCards];
          updated[activeIndex] = {
            ...updated[activeIndex],
            listId: overId as string,
          };
          return arrayMove(updated, activeIndex, activeIndex);
        }
        return prevCards;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveList(null);
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // 1. Reordering Lists
    if (active.data.current?.type === "List" && activeId !== overId) {
      const oldIndex = lists.findIndex((l) => l.id === activeId);
      const newIndex = lists.findIndex((l) => l.id === overId);
      const reordered = arrayMove(lists, oldIndex, newIndex);
      setLists(reordered);

      // Persist to backend
      try {
        await fetch("/api/lists/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: board.id,
            orderedListIds: reordered.map((l) => l.id),
          }),
        });
      } catch {
        // rollback if needed
      }
      return;
    }

    // 2. Reordering / Moving Cards
    if (active.data.current?.type === "Card") {
      const activeCardItem = cards.find((c) => c.id === activeId);
      if (!activeCardItem) return;

      const targetListId = activeCardItem.listId;
      const cardsInTargetList = cards.filter((c) => c.listId === targetListId);
      const targetCardIds = cardsInTargetList.map((c) => c.id);

      // Persist to backend & execute any automations
      try {
        const res = await fetch(`/api/cards/${activeId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetListId,
            orderedCardIdsInList: targetCardIds,
          }),
        });
        const data = await res.json();
        if (res.ok && data.card) {
          // Update card in state with any changes applied by automation
          setCards((prev) =>
            prev.map((c) => (c.id === data.card.id ? data.card : c))
          );
        }
      } catch {
        // silent
      }
    }
  };

  // --- Handlers: Lists & Cards Mutations ---
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: board.id, title: newListTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.list) {
        setLists((prev) => [...prev, data.list]);
        setNewListTitle("");
        setIsAddingList(false);
      }
    } catch {
      // fallback
    }
  };

  const handleUpdateListTitle = async (listId: string, title: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, title } : l))
    );
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  };

  const handleDeleteList = async (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCards((prev) => prev.filter((c) => c.listId !== listId));
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: board.id, listId, title }),
      });
      const data = await res.json();
      if (res.ok && data.card) {
        setCards((prev) => [...prev, data.card]);
      }
    } catch {
      // fallback
    }
  };

  const handleUpdateCard = async (updatedCard: Card) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
    if (selectedCard?.id === updatedCard.id) {
      setSelectedCard(updatedCard);
    }

    await fetch(`/api/cards/${updatedCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCard),
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (selectedCard?.id === cardId) {
      setSelectedCard(null);
    }
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
  };

  const handleCreateLabel = async (name: string, color: LabelColor): Promise<Label> => {
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: board.id, name, color }),
    });
    const data = await res.json();
    if (data.label) {
      setLabels((prev) => [...prev, data.label]);
      return data.label;
    }
    throw new Error("Failed to create label");
  };

  const listIds = lists.map((l) => l.id);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Board Secondary Filter Bar */}
      <div className="px-6 py-2.5 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter cards by title or notes..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Label Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {labels.slice(0, 5).map((lbl) => {
            const isSelected = selectedLabelFilter === lbl.id;
            return (
              <button
                key={lbl.id}
                type="button"
                onClick={() =>
                  setSelectedLabelFilter(isSelected ? null : lbl.id)
                }
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
                }`}
              >
                {lbl.name}
              </button>
            );
          })}
          {selectedLabelFilter && (
            <button
              onClick={() => setSelectedLabelFilter(null)}
              className="text-[11px] text-slate-400 hover:text-rose-400 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Kanban Columns Scroll Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          id="stride-kanban"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-5 h-full">
            <SortableContext
              items={listIds}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => {
                const listCards = filteredCards.filter((c) => c.listId === list.id);
                return (
                  <ListColumn
                    key={list.id}
                    list={list}
                    cards={listCards}
                    labels={labels}
                    customFields={board.customFields}
                    onCardClick={(card) => setSelectedCard(card)}
                    onAddCard={handleAddCard}
                    onUpdateListTitle={handleUpdateListTitle}
                    onDeleteList={handleDeleteList}
                  />
                );
              })}
            </SortableContext>

            {/* Add Another List Button / Form */}
            <div className="w-72 sm:w-80 shrink-0">
              {isAddingList ? (
                <form
                  onSubmit={handleAddList}
                  className="p-3 bg-slate-950/80 border border-indigo-500/60 rounded-2xl space-y-2 shadow-xl"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!newListTitle.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
                    >
                      Add List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle("");
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingList(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all backdrop-blur-sm"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add another list</span>
                </button>
              )}
            </div>
          </div>

          {/* Drag Overlay Preview */}
          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 scale-102 shadow-2xl">
                <CardItem
                  card={activeCard}
                  labels={labels}
                  customFields={board.customFields}
                  onCardClick={() => {}}
                />
              </div>
            )}
            {activeList && (
              <div className="opacity-80 rotate-1">
                <ListColumn
                  list={activeList}
                  cards={cards.filter((c) => c.listId === activeList.id)}
                  labels={labels}
                  customFields={board.customFields}
                  onCardClick={() => {}}
                  onAddCard={async () => {}}
                  onUpdateListTitle={async () => {}}
                  onDeleteList={async () => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          lists={lists}
          labels={labels}
          customFields={board.customFields}
          currentUser={currentUser}
          onClose={() => setSelectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onCreateLabel={handleCreateLabel}
        />
      )}
    </div>
  );
}

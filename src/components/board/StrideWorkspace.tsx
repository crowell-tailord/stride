"use client";

import { useState } from "react";
import { Board, List, Card, Label, SessionUser, BoardTheme } from "@/types/stride";
import BoardHeader from "../navigation/BoardHeader";
import KanbanBoard from "./KanbanBoard";

interface StrideWorkspaceProps {
  currentUser: SessionUser;
  initialBoard: Board;
  allBoards: Board[];
  initialLists: List[];
  initialCards: Card[];
  initialLabels: Label[];
}

const THEME_BACKGROUNDS: Record<BoardTheme, string> = {
  ocean: "from-blue-950/40 via-slate-950 to-slate-950",
  slate: "from-slate-900/60 via-slate-950 to-slate-950",
  emerald: "from-emerald-950/40 via-slate-950 to-slate-950",
  indigo: "from-indigo-950/40 via-slate-950 to-slate-950",
  sunset: "from-amber-950/40 via-slate-950 to-slate-950",
  rose: "from-rose-950/40 via-slate-950 to-slate-950",
  zinc: "from-zinc-900/40 via-zinc-950 to-black",
};

export default function StrideWorkspace({
  currentUser,
  initialBoard,
  allBoards: initialAllBoards,
  initialLists,
  initialCards,
  initialLabels,
}: StrideWorkspaceProps) {
  const [currentBoard, setCurrentBoard] = useState<Board>(initialBoard);
  const [allBoards, setAllBoards] = useState<Board[]>(initialAllBoards);
  const [lists, setLists] = useState<List[]>(initialLists);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [loading, setLoading] = useState(false);

  const handleSelectBoard = async (boardId: string) => {
    if (boardId === currentBoard.id) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/boards/${boardId}`);
      const data = await res.json();
      if (res.ok && data.board) {
        setCurrentBoard(data.board);
        setLists(data.lists || []);
        setCards(data.cards || []);
        setLabels(data.labels || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleBoardCreatedOrImported = async (newBoard: Board) => {
    setAllBoards((prev) => [newBoard, ...prev]);
    await handleSelectBoard(newBoard.id);
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    setCurrentBoard(updatedBoard);
    setAllBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
    );
  };

  const bgGradient =
    THEME_BACKGROUNDS[currentBoard.background] || THEME_BACKGROUNDS.ocean;

  const bgStyle = currentBoard.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(10, 15, 29, 0.35), rgba(10, 15, 29, 0.5)), url("${currentBoard.backgroundImageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : undefined;

  return (
    <div
      style={bgStyle}
      className={`min-h-screen flex flex-col ${
        currentBoard.backgroundImageUrl ? "bg-slate-950" : `bg-gradient-to-b ${bgGradient}`
      } text-white transition-colors duration-500`}
    >
      <BoardHeader
        currentBoard={currentBoard}
        allBoards={allBoards}
        currentUser={currentUser}
        onSelectBoard={handleSelectBoard}
        onBoardCreatedOrImported={handleBoardCreatedOrImported}
        onUpdateBoard={handleUpdateBoard}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <KanbanBoard
          key={currentBoard.id}
          board={currentBoard}
          initialLists={lists}
          initialCards={cards}
          initialLabels={labels}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

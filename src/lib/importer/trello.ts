import type { Board, List, Card, Label, ChecklistItem, LabelColor, BoardTheme } from "@/types/stride";

export interface TrelloCheckItem {
  id: string;
  name: string;
  state: "complete" | "incomplete";
  pos?: number;
}

export interface TrelloChecklist {
  id: string;
  idCard?: string;
  name: string;
  checkItems?: TrelloCheckItem[];
}

export interface TrelloLabel {
  id: string;
  name?: string;
  color?: string;
}

export interface TrelloCard {
  id: string;
  idList: string;
  name: string;
  desc?: string;
  due?: string | null;
  dueComplete?: boolean;
  closed?: boolean;
  pos?: number;
  idLabels?: string[];
  idChecklists?: string[];
  labels?: TrelloLabel[];
}

export interface TrelloList {
  id: string;
  name: string;
  closed?: boolean;
  pos?: number;
}

export interface TrelloExport {
  name: string;
  desc?: string;
  prefs?: {
    background?: string;
    backgroundColor?: string;
  };
  lists?: TrelloList[];
  cards?: TrelloCard[];
  labels?: TrelloLabel[];
  checklists?: TrelloChecklist[];
}

export interface ParsedTrelloResult {
  board: Board;
  lists: List[];
  labels: Label[];
  cards: Card[];
  summary: {
    boardTitle: string;
    listCount: number;
    cardCount: number;
    checklistCount: number;
    labelCount: number;
  };
}

const COLOR_MAP: Record<string, LabelColor> = {
  green: "emerald",
  yellow: "amber",
  orange: "orange",
  red: "rose",
  purple: "purple",
  blue: "indigo",
  sky: "sky",
  lime: "emerald",
  pink: "rose",
  black: "zinc",
};

export function parseTrelloExport(
  rawJson: string | object,
  ownerUserId: string = "usr_owner"
): ParsedTrelloResult {
  const data: TrelloExport = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

  if (!data.name && !Array.isArray(data.lists) && !Array.isArray(data.cards)) {
    throw new Error("Invalid Trello export: Missing board name, lists, or cards.");
  }

  const boardId = `board_trello_${Date.now()}`;
  const now = new Date().toISOString();

  // Background theme mapping
  let bgTheme: BoardTheme = "ocean";
  if (data.prefs?.background === "blue" || data.prefs?.backgroundColor === "#0079BF") bgTheme = "ocean";
  else if (data.prefs?.background === "green" || data.prefs?.backgroundColor === "#519839") bgTheme = "emerald";
  else if (data.prefs?.background === "orange" || data.prefs?.backgroundColor === "#D29034") bgTheme = "sunset";
  else if (data.prefs?.background === "red" || data.prefs?.backgroundColor === "#B04632") bgTheme = "rose";
  else if (data.prefs?.background === "purple" || data.prefs?.backgroundColor === "#89609E") bgTheme = "indigo";

  const board: Board = {
    id: boardId,
    title: data.name || "Imported Trello Board",
    description: data.desc || "Imported from Trello JSON backup",
    background: bgTheme,
    isStarred: false,
    createdAt: now,
    updatedAt: now,
    allowedUserIds: [ownerUserId, "usr_client"],
  };

  // 1. Process Lists (keep active lists; sort by Trello pos)
  const trelloLists = (data.lists || [])
    .filter((l) => !l.closed)
    .sort((a, b) => (a.pos || 0) - (b.pos || 0));

  const listIdMap = new Map<string, string>();
  const lists: List[] = trelloLists.map((tl, index) => {
    const strideListId = `list_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
    listIdMap.set(tl.id, strideListId);
    return {
      id: strideListId,
      boardId,
      title: tl.name || `List ${index + 1}`,
      position: (index + 1) * 1000,
      isArchived: false,
      createdAt: now,
    };
  });

  // 2. Process Labels
  const rawLabels = data.labels || [];
  const labelIdMap = new Map<string, string>();
  const labels: Label[] = [];

  rawLabels.forEach((lbl, idx) => {
    if (!lbl.id) return;
    const color = (lbl.color && COLOR_MAP[lbl.color]) ? COLOR_MAP[lbl.color] : "indigo";
    const strideLabelId = `lbl_${Date.now()}_${idx}`;
    labelIdMap.set(lbl.id, strideLabelId);
    labels.push({
      id: strideLabelId,
      boardId,
      name: lbl.name?.trim() || color.toUpperCase(),
      color,
    });
  });

  // 3. Process Checklists mapped by Trello Card ID
  const checklistsByCard = new Map<string, ChecklistItem[]>();
  (data.checklists || []).forEach((ch) => {
    const cardId = ch.idCard;
    if (!cardId) return;

    const items: ChecklistItem[] = (ch.checkItems || [])
      .sort((a, b) => (a.pos || 0) - (b.pos || 0))
      .map((item, idx) => ({
        id: `chk_${Date.now()}_${cardId}_${idx}`,
        text: item.name || "Untitled task",
        isDone: item.state === "complete",
      }));

    const existing = checklistsByCard.get(cardId) || [];
    checklistsByCard.set(cardId, [...existing, ...items]);
  });

  // 4. Process Cards
  const trelloCards = (data.cards || [])
    .filter((c) => !c.closed && listIdMap.has(c.idList))
    .sort((a, b) => (a.pos || 0) - (b.pos || 0));

  let totalChecklistItems = 0;

  const cards: Card[] = trelloCards.map((tc, index) => {
    const strideListId = listIdMap.get(tc.idList)!;
    const strideCardId = `card_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;

    // Map labels
    const cardLabelIds: string[] = [];
    if (Array.isArray(tc.idLabels)) {
      tc.idLabels.forEach((tid) => {
        const mapped = labelIdMap.get(tid);
        if (mapped) cardLabelIds.push(mapped);
      });
    }

    // Attach checklists
    const cardChecklist = checklistsByCard.get(tc.id) || [];
    totalChecklistItems += cardChecklist.length;

    return {
      id: strideCardId,
      boardId,
      listId: strideListId,
      title: tc.name || "Untitled Card",
      description: tc.desc || "",
      position: (index + 1) * 1000,
      dueDate: tc.due || null,
      isCompleted: !!tc.dueComplete,
      labelIds: cardLabelIds,
      checklist: cardChecklist,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    board,
    lists,
    labels,
    cards,
    summary: {
      boardTitle: board.title,
      listCount: lists.length,
      cardCount: cards.length,
      checklistCount: totalChecklistItems,
      labelCount: labels.length,
    },
  };
}

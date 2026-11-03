import fs from "fs";
import path from "path";
import {
  StrideDatabase,
  Board,
  List,
  Card,
  Label,
  User,
  AutomationRule,
} from "@/types/stride";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "stride-db.json");
const TMP_FILE = path.join(DATA_DIR, "stride-db.json.tmp");

export const DEFAULT_SEED: StrideDatabase = {
  users: [
    {
      id: "usr_owner",
      email: "owner@stride.local",
      name: "Project Owner",
      role: "owner",
      passwordHash: process.env.STRIDE_OWNER_PASSWORD || "stride2026",
      avatarUrl: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr_client",
      email: "client@stride.local",
      name: "Client Partner",
      role: "client",
      passwordHash: process.env.STRIDE_CLIENT_PASSWORD || "client2026",
      avatarUrl: "",
      createdAt: new Date().toISOString(),
    },
  ],
  boards: [
    {
      id: "board_welcome",
      title: "Client Project Roadmap",
      description: "Private collaborative Kanban board for project tracking, milestones, and deliverables.",
      background: "ocean",
      isStarred: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      allowedUserIds: ["usr_owner", "usr_client"],
      customFields: [
        {
          id: "fld_estimate",
          boardId: "board_welcome",
          name: "Estimate (hrs)",
          type: "number",
          showOnFront: true,
        },
        {
          id: "fld_client",
          boardId: "board_welcome",
          name: "Client Lead",
          type: "text",
          showOnFront: true,
        },
      ],
    },
  ],
  lists: [
    {
      id: "list_backlog",
      boardId: "board_welcome",
      title: "Ideas & Backlog",
      position: 1000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "list_in_progress",
      boardId: "board_welcome",
      title: "In Progress",
      position: 2000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "list_review",
      boardId: "board_welcome",
      title: "Ready for Review",
      position: 3000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "list_done",
      boardId: "board_welcome",
      title: "Completed & Shipped",
      position: 4000,
      createdAt: new Date().toISOString(),
    },
  ],
  labels: [
    { id: "lbl_urgent", boardId: "board_welcome", name: "Urgent", color: "rose" },
    { id: "lbl_design", boardId: "board_welcome", name: "Design", color: "indigo" },
    { id: "lbl_feature", boardId: "board_welcome", name: "Feature", color: "emerald" },
    { id: "lbl_feedback", boardId: "board_welcome", name: "Feedback", color: "amber" },
  ],
  cards: [
    {
      id: "card_welcome",
      listId: "list_backlog",
      boardId: "board_welcome",
      title: "Welcome to Stride! Quick Tour 🚀",
      description: `### Welcome to your private Trello replacement!\n\nHere is what you can do:\n- **Drag and Drop**: Grab any card or column and rearrange them smoothly.\n- **Trello Importer**: Click the **Import Board** button in the top navigation to upload an existing Trello JSON export.\n- **Checklists**: Mark items off below and watch the progress bar animate.\n- **Due Dates & Labels**: Assign deadlines, color badges, and track priority.\n- **Automations**: Move this card to *Completed & Shipped* to see automatic completion in action!`,
      position: 1000,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      isCompleted: false,
      priority: "high",
      labelIds: ["lbl_feature"],
      customFieldValues: {
        fld_estimate: 12,
        fld_client: "Sarah K.",
      },
      checklist: [
        { id: "chk_1", text: "Drag a card to another list", isDone: true },
        { id: "chk_2", text: "Import an existing Trello board (.json file)", isDone: false },
        { id: "chk_3", text: "Test client access credentials", isDone: false },
      ],
      comments: [
        {
          id: "cmt_1",
          authorId: "usr_owner",
          authorName: "Project Owner",
          authorRole: "owner",
          text: "Let me know what you think of this board layout!",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "card_review_copy",
      listId: "list_in_progress",
      boardId: "board_welcome",
      title: "Review copy revisions & landing page draft",
      description: "Review hero section copy and value proposition statements before design finalization.",
      position: 1000,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      isCompleted: false,
      priority: "medium",
      labelIds: ["lbl_feedback"],
      checklist: [
        { id: "chk_4", text: "Inspect headline alternatives", isDone: true },
        { id: "chk_5", text: "Sign off on primary call-to-action text", isDone: false },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "card_design_system",
      listId: "list_review",
      boardId: "board_welcome",
      title: "Color palette and typography audit",
      description: "Ensure color contrast matches accessibility standards and brand identity across dark/light modes.",
      position: 1000,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      isCompleted: false,
      priority: "high",
      labelIds: ["lbl_design", "lbl_urgent"],
      checklist: [
        { id: "chk_6", text: "Verify text readability on dark backgrounds", isDone: true },
        { id: "chk_7", text: "Export iconography set", isDone: true },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "card_private_lock",
      listId: "list_done",
      boardId: "board_welcome",
      title: "Private lockscreen & subdomain deployment setup",
      description: "Configured edge session protection and standalone container deployment for your subdomain.",
      position: 1000,
      dueDate: new Date().toISOString(),
      isCompleted: true,
      priority: "low",
      labelIds: ["lbl_feature"],
      customFieldValues: {
        fld_estimate: 12,
        fld_client: "Sarah K.",
      },
      checklist: [
        { id: "chk_8", text: "Next.js middleware protection", isDone: true },
        { id: "chk_9", text: "Role-based client separation", isDone: true },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  automations: [
    {
      id: "auto_done_complete",
      boardId: "board_welcome",
      name: "Auto-complete when moved to Completed & Shipped",
      isEnabled: true,
      trigger: { type: "CARD_MOVED", targetListTitle: "Completed & Shipped" },
      actions: [
        { type: "MARK_CARD_COMPLETE", value: true },
        {
          type: "POST_SYSTEM_COMMENT",
          message: "🎉 Card automatically marked as complete when moved to Completed & Shipped.",
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
};

/**
 * Atomic file-based JSON store for Stride.
 * Designed with a clean repository interface for zero-friction future migration to Supabase.
 */
class JsonStore {
  private inMemoryCache: StrideDatabase | null = null;
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureDatabaseFile();
  }

  private ensureDatabaseFile(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_SEED, null, 2), "utf-8");
      this.inMemoryCache = JSON.parse(JSON.stringify(DEFAULT_SEED));
    }
  }

  private async readDb(): Promise<StrideDatabase> {
    this.ensureDatabaseFile();
    try {
      const data = await fs.promises.readFile(DB_FILE, "utf-8");
      this.inMemoryCache = JSON.parse(data);
      return this.inMemoryCache!;
    } catch {
      if (this.inMemoryCache) return this.inMemoryCache;
      return DEFAULT_SEED;
    }
  }

  private async writeDb(db: StrideDatabase): Promise<void> {
    // Chain writes sequentially to prevent concurrent file write clashes
    this.writeLock = this.writeLock.then(async () => {
      this.ensureDatabaseFile();
      const content = JSON.stringify(db, null, 2);
      // Atomic write: write to temp file then rename
      await fs.promises.writeFile(TMP_FILE, content, "utf-8");
      await fs.promises.rename(TMP_FILE, DB_FILE);
      this.inMemoryCache = db;
    });
    return this.writeLock;
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const db = await this.readDb();
    return db.users;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.readDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await this.readDb();
    return db.users.find((u) => u.id === id) || null;
  }

  // --- Boards ---
  async getBoards(userId?: string): Promise<Board[]> {
    const db = await this.readDb();
    if (!userId) return db.boards;
    const user = db.users.find((u) => u.id === userId);
    // Owner sees all boards; Client sees boards where their ID is included
    if (user?.role === "owner") return db.boards;
    return db.boards.filter((b) => b.allowedUserIds?.includes(userId));
  }

  async getBoard(boardId: string, userId?: string): Promise<Board | null> {
    const boards = await this.getBoards(userId);
    return boards.find((b) => b.id === boardId) || null;
  }

  async createBoard(boardData: Omit<Board, "id" | "createdAt" | "updatedAt">): Promise<Board> {
    const db = await this.readDb();
    const newBoard: Board = {
      ...boardData,
      id: `board_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.boards.push(newBoard);
    await this.writeDb(db);
    return newBoard;
  }

  async updateBoard(boardId: string, patch: Partial<Board>): Promise<Board | null> {
    const db = await this.readDb();
    const index = db.boards.findIndex((b) => b.id === boardId);
    if (index === -1) return null;
    db.boards[index] = {
      ...db.boards[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.writeDb(db);
    return db.boards[index];
  }

  async deleteBoard(boardId: string): Promise<boolean> {
    const db = await this.readDb();
    db.boards = db.boards.filter((b) => b.id !== boardId);
    db.lists = db.lists.filter((l) => l.boardId !== boardId);
    db.cards = db.cards.filter((c) => c.boardId !== boardId);
    db.labels = db.labels.filter((l) => l.boardId !== boardId);
    db.automations = db.automations.filter((a) => a.boardId !== boardId);
    await this.writeDb(db);
    return true;
  }

  // --- Lists ---
  async getLists(boardId: string): Promise<List[]> {
    const db = await this.readDb();
    return db.lists
      .filter((l) => l.boardId === boardId && !l.isArchived)
      .sort((a, b) => a.position - b.position);
  }

  async createList(boardId: string, title: string): Promise<List> {
    const db = await this.readDb();
    const boardLists = db.lists.filter((l) => l.boardId === boardId);
    const maxPos = boardLists.reduce((max, l) => Math.max(max, l.position), 0);
    const newList: List = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      boardId,
      title,
      position: maxPos + 1000,
      createdAt: new Date().toISOString(),
    };
    db.lists.push(newList);
    await this.writeDb(db);
    return newList;
  }

  async updateList(listId: string, patch: Partial<List>): Promise<List | null> {
    const db = await this.readDb();
    const index = db.lists.findIndex((l) => l.id === listId);
    if (index === -1) return null;
    db.lists[index] = { ...db.lists[index], ...patch };
    await this.writeDb(db);
    return db.lists[index];
  }

  async reorderLists(boardId: string, orderedListIds: string[]): Promise<List[]> {
    const db = await this.readDb();
    orderedListIds.forEach((id, idx) => {
      const list = db.lists.find((l) => l.id === id && l.boardId === boardId);
      if (list) {
        list.position = (idx + 1) * 1000;
      }
    });
    await this.writeDb(db);
    return this.getLists(boardId);
  }

  // --- Cards ---
  async getCards(boardId: string): Promise<Card[]> {
    const db = await this.readDb();
    return db.cards
      .filter((c) => c.boardId === boardId && !c.isArchived)
      .sort((a, b) => a.position - b.position);
  }

  async getCardById(cardId: string): Promise<Card | null> {
    const db = await this.readDb();
    return db.cards.find((c) => c.id === cardId) || null;
  }

  async createCard(
    boardId: string,
    listId: string,
    title: string,
    description: string = ""
  ): Promise<Card> {
    const db = await this.readDb();
    const listCards = db.cards.filter((c) => c.listId === listId && !c.isArchived);
    const maxPos = listCards.reduce((max, c) => Math.max(max, c.position), 0);
    const newCard: Card = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      boardId,
      listId,
      title,
      description,
      position: maxPos + 1000,
      isCompleted: false,
      labelIds: [],
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.cards.push(newCard);
    await this.writeDb(db);
    return newCard;
  }

  async updateCard(cardId: string, patch: Partial<Card>): Promise<Card | null> {
    const db = await this.readDb();
    const index = db.cards.findIndex((c) => c.id === cardId);
    if (index === -1) return null;
    db.cards[index] = {
      ...db.cards[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.writeDb(db);
    return db.cards[index];
  }

  async moveCard(
    cardId: string,
    targetListId: string,
    newPosition: number
  ): Promise<Card | null> {
    const db = await this.readDb();
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return null;

    card.listId = targetListId;
    card.position = newPosition;
    card.updatedAt = new Date().toISOString();

    await this.writeDb(db);
    return card;
  }

  async reorderCardsInList(listId: string, orderedCardIds: string[]): Promise<void> {
    const db = await this.readDb();
    orderedCardIds.forEach((id, idx) => {
      const card = db.cards.find((c) => c.id === id);
      if (card) {
        card.listId = listId;
        card.position = (idx + 1) * 1000;
        card.updatedAt = new Date().toISOString();
      }
    });
    await this.writeDb(db);
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const db = await this.readDb();
    db.cards = db.cards.filter((c) => c.id !== cardId);
    await this.writeDb(db);
    return true;
  }

  // --- Labels ---
  async getLabels(boardId: string): Promise<Label[]> {
    const db = await this.readDb();
    return db.labels.filter((l) => l.boardId === boardId);
  }

  async createLabel(boardId: string, name: string, color: Label["color"]): Promise<Label> {
    const db = await this.readDb();
    const newLabel: Label = {
      id: `lbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      boardId,
      name,
      color,
    };
    db.labels.push(newLabel);
    await this.writeDb(db);
    return newLabel;
  }

  // --- Automations ---
  async getAutomations(boardId: string): Promise<AutomationRule[]> {
    const db = await this.readDb();
    return db.automations.filter((a) => a.boardId === boardId);
  }

  async saveAutomation(rule: AutomationRule): Promise<AutomationRule> {
    const db = await this.readDb();
    const idx = db.automations.findIndex((a) => a.id === rule.id);
    if (idx >= 0) {
      db.automations[idx] = rule;
    } else {
      db.automations.push(rule);
    }
    await this.writeDb(db);
    return rule;
  }

  // --- Batch Import (for Trello Importer) ---
  async importFullBoard(
    board: Board,
    lists: List[],
    labels: Label[],
    cards: Card[],
    automations: AutomationRule[] = []
  ): Promise<Board> {
    const db = await this.readDb();
    db.boards.push(board);
    db.lists.push(...lists);
    db.labels.push(...labels);
    db.cards.push(...cards);
    db.automations.push(...automations);
    await this.writeDb(db);
    return board;
  }

  // Reset database to seed
  async resetToSeed(): Promise<void> {
    await this.writeDb(JSON.parse(JSON.stringify(DEFAULT_SEED)));
  }
}

// Global singleton instance
export const dataStore = new JsonStore();

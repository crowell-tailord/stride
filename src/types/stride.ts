export type UserRole = "owner" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string; // Plain or bcrypt hash
  avatarUrl?: string;
  createdAt: string;
}

export type BoardTheme =
  | "slate"
  | "ocean"
  | "emerald"
  | "indigo"
  | "sunset"
  | "rose"
  | "zinc";

export type CustomFieldType = "text" | "number";

export interface CustomFieldDefinition {
  id: string;
  boardId: string;
  name: string;
  type: CustomFieldType;
  showOnFront: boolean;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  background: BoardTheme;
  isStarred?: boolean;
  backgroundImageUrl?: string;
  customFields?: CustomFieldDefinition[];
  createdAt: string;
  updatedAt: string;
  allowedUserIds: string[]; // Access control: who can view/access this board
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  isArchived?: boolean;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface CardAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export type CardPriority = "low" | "medium" | "high" | "urgent";

export interface Card {
  id: string;
  listId: string;
  boardId: string;
  title: string;
  description: string;
  position: number;
  dueDate?: string | null;
  isCompleted: boolean;
  priority?: CardPriority;
  labelIds: string[];
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments?: CardAttachment[];
  coverImageUrl?: string | null;
  customFieldValues?: Record<string, string | number>;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LabelColor =
  | "emerald"
  | "amber"
  | "rose"
  | "indigo"
  | "sky"
  | "purple"
  | "teal"
  | "orange"
  | "zinc";

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: LabelColor;
}

export type AutomationTrigger =
  | { type: "CARD_MOVED"; targetListTitle: string }
  | { type: "CHECKLIST_COMPLETED" }
  | { type: "CARD_CREATED" };

export type AutomationAction =
  | { type: "MARK_CARD_COMPLETE"; value: boolean }
  | { type: "ADD_LABEL"; labelName: string }
  | { type: "POST_SYSTEM_COMMENT"; message: string }
  | { type: "MOVE_TO_LIST"; targetListTitle: string };

export interface AutomationRule {
  id: string;
  boardId: string;
  name: string;
  isEnabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  createdAt: string;
}

export interface StrideDatabase {
  users: User[];
  boards: Board[];
  lists: List[];
  cards: Card[];
  labels: Label[];
  automations: AutomationRule[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

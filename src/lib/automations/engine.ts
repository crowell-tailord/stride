import { dataStore } from "@/lib/db/json-store";
import { Card, AutomationRule, Comment } from "@/types/stride";

export type BoardEvent =
  | { type: "CARD_MOVED"; cardId: string; fromListTitle: string; toListTitle: string }
  | { type: "CHECKLIST_COMPLETED"; cardId: string }
  | { type: "CARD_CREATED"; cardId: string };

/**
 * Executes automation rules configured on the board in response to events.
 */
export async function dispatchBoardEvent(event: BoardEvent): Promise<Card | null> {
  const card = await dataStore.getCardById(event.cardId);
  if (!card) return null;

  const rules: AutomationRule[] = await dataStore.getAutomations(card.boardId);
  const activeRules = rules.filter((r) => r.isEnabled);

  const updatedCard: Card = { ...card };
  let hasChanges = false;

  for (const rule of activeRules) {
    let triggered = false;

    if (rule.trigger.type === "CARD_MOVED" && event.type === "CARD_MOVED") {
      if (
        rule.trigger.targetListTitle.toLowerCase() ===
        event.toListTitle.toLowerCase()
      ) {
        triggered = true;
      }
    } else if (
      rule.trigger.type === "CHECKLIST_COMPLETED" &&
      event.type === "CHECKLIST_COMPLETED"
    ) {
      triggered = true;
    } else if (
      rule.trigger.type === "CARD_CREATED" &&
      event.type === "CARD_CREATED"
    ) {
      triggered = true;
    }

    if (triggered) {
      for (const action of rule.actions) {
        if (action.type === "MARK_CARD_COMPLETE") {
          updatedCard.isCompleted = action.value;
          hasChanges = true;
        } else if (action.type === "POST_SYSTEM_COMMENT") {
          const systemComment: Comment = {
            id: `cmt_bot_${Date.now()}`,
            authorId: "stride_bot",
            authorName: "Stride Automation",
            authorRole: "owner",
            text: action.message,
            createdAt: new Date().toISOString(),
          };
          updatedCard.comments = [...updatedCard.comments, systemComment];
          hasChanges = true;
        } else if (action.type === "ADD_LABEL") {
          const boardLabels = await dataStore.getLabels(card.boardId);
          const targetLabel = boardLabels.find(
            (l) => l.name.toLowerCase() === action.labelName.toLowerCase()
          );
          if (targetLabel && !updatedCard.labelIds.includes(targetLabel.id)) {
            updatedCard.labelIds = [...updatedCard.labelIds, targetLabel.id];
            hasChanges = true;
          }
        }
      }
    }
  }

  if (hasChanges) {
    const saved = await dataStore.updateCard(updatedCard.id, updatedCard);
    return saved;
  }

  return card;
}

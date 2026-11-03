import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { dispatchBoardEvent } from "@/lib/automations/engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  const { targetListId, newPosition, orderedCardIdsInList } = await request.json();

  const currentCard = await dataStore.getCardById(cardId);
  if (!currentCard) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const fromListId = currentCard.listId;
  const lists = await dataStore.getLists(currentCard.boardId);
  const fromList = lists.find((l) => l.id === fromListId);
  const toList = lists.find((l) => l.id === targetListId);

  // If a reordered array is supplied, save the whole list ordering
  if (Array.isArray(orderedCardIdsInList)) {
    await dataStore.reorderCardsInList(targetListId, orderedCardIdsInList);
  } else {
    await dataStore.moveCard(cardId, targetListId, newPosition || 1000);
  }

  // Trigger automation event if card moved to a different list
  let finalCard = await dataStore.getCardById(cardId);
  if (fromListId !== targetListId && fromList && toList) {
    const automatedCard = await dispatchBoardEvent({
      type: "CARD_MOVED",
      cardId,
      fromListTitle: fromList.title,
      toListTitle: toList.title,
    });
    if (automatedCard) {
      finalCard = automatedCard;
    }
  }

  return NextResponse.json({ card: finalCard });
}

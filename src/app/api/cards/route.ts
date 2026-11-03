import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { dispatchBoardEvent } from "@/lib/automations/engine";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, listId, title, description } = await request.json();
  if (!boardId || !listId || !title?.trim()) {
    return NextResponse.json(
      { error: "boardId, listId, and title are required" },
      { status: 400 }
    );
  }

  const card = await dataStore.createCard(
    boardId,
    listId,
    title.trim(),
    description?.trim() || ""
  );

  // Trigger automation event
  await dispatchBoardEvent({
    type: "CARD_CREATED",
    cardId: card.id,
  });

  return NextResponse.json({ card });
}

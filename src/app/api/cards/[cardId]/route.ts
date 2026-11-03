import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { dispatchBoardEvent } from "@/lib/automations/engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  const card = await dataStore.getCardById(cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  const patch = await request.json();
  const updated = await dataStore.updateCard(cardId, patch);

  if (!updated) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Check if all checklist items are completed
  if (
    updated.checklist?.length > 0 &&
    updated.checklist.every((c) => c.isDone)
  ) {
    await dispatchBoardEvent({
      type: "CHECKLIST_COMPLETED",
      cardId: updated.id,
    });
  }

  return NextResponse.json({ card: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  await dataStore.deleteCard(cardId);
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const board = await dataStore.getBoard(boardId, session.id);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const lists = await dataStore.getLists(boardId);
  const cards = await dataStore.getCards(boardId);
  const labels = await dataStore.getLabels(boardId);
  const automations = await dataStore.getAutomations(boardId);

  return NextResponse.json({
    board,
    lists,
    cards,
    labels,
    automations,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const patch = await request.json();
  const updated = await dataStore.updateBoard(boardId, patch);

  if (!updated) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json({ board: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Forbidden: Only owner can delete boards" },
      { status: 403 }
    );
  }

  const { boardId } = await params;
  await dataStore.deleteBoard(boardId);
  return NextResponse.json({ success: true });
}

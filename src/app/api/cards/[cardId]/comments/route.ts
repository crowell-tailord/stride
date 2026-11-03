import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { Comment } from "@/types/stride";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  const { text } = await request.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const card = await dataStore.getCardById(cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const newComment: Comment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId: session.id,
    authorName: session.name,
    authorRole: session.role,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedComments = [...(card.comments || []), newComment];
  const updated = await dataStore.updateCard(cardId, { comments: updatedComments });

  return NextResponse.json({ card: updated, comment: newComment });
}

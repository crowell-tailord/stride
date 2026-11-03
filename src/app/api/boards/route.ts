import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await dataStore.getBoards(session.id);
  return NextResponse.json({ boards });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, background } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const board = await dataStore.createBoard({
      title: title.trim(),
      description: description?.trim() || "",
      background: background || "ocean",
      isStarred: false,
      allowedUserIds: [session.id, "usr_client"], // default allow client access
    });

    // Create 3 default lists
    await dataStore.createList(board.id, "To Do");
    await dataStore.createList(board.id, "In Progress");
    await dataStore.createList(board.id, "Done");

    return NextResponse.json({ board });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating board";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

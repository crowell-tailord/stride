import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, title } = await request.json();
  if (!boardId || !title?.trim()) {
    return NextResponse.json(
      { error: "boardId and title are required" },
      { status: 400 }
    );
  }

  const list = await dataStore.createList(boardId, title.trim());
  return NextResponse.json({ list });
}

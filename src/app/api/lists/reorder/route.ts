import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, orderedListIds } = await request.json();
  if (!boardId || !Array.isArray(orderedListIds)) {
    return NextResponse.json(
      { error: "boardId and orderedListIds are required" },
      { status: 400 }
    );
  }

  const lists = await dataStore.reorderLists(boardId, orderedListIds);
  return NextResponse.json({ lists });
}

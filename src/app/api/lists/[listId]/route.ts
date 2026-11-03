import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listId } = await params;
  const patch = await request.json();
  const updated = await dataStore.updateList(listId, patch);

  if (!updated) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ list: updated });
}

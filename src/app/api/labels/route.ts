import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, name, color } = await request.json();
  if (!boardId || !name?.trim()) {
    return NextResponse.json(
      { error: "boardId and name are required" },
      { status: 400 }
    );
  }

  const label = await dataStore.createLabel(boardId, name.trim(), color || "indigo");
  return NextResponse.json({ label });
}

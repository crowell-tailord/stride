import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { LabelColor } from "@/types/stride";

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

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { labelId, name, color } = await request.json();
    if (!labelId) {
      return NextResponse.json({ error: "labelId is required" }, { status: 400 });
    }

    const patch: { name?: string; color?: LabelColor } = {};
    if (typeof name === "string" && name.trim()) patch.name = name.trim();
    if (color) patch.color = color as LabelColor;

    const updated = await dataStore.updateLabel(labelId, patch);
    if (!updated) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    return NextResponse.json({ label: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update label";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    let labelId = url.searchParams.get("labelId");

    if (!labelId) {
      const body = await request.json().catch(() => ({}));
      labelId = body.labelId;
    }

    if (!labelId) {
      return NextResponse.json({ error: "labelId is required" }, { status: 400 });
    }

    const success = await dataStore.deleteLabel(labelId);
    if (!success) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, labelId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete label";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

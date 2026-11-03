import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { LabelColor } from "@/types/stride";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { labelId } = await params;
  try {
    const body = await request.json();
    const patch: { name?: string; color?: LabelColor } = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (body.color) patch.color = body.color as LabelColor;

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { labelId } = await params;
  try {
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

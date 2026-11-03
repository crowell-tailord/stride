import { NextResponse } from "next/server";
import { dataStore } from "@/lib/db/json-store";
import { getSession } from "@/lib/auth/session";
import { parseTrelloExport } from "@/lib/importer/trello";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { trelloData, dryRun } = body;

    if (!trelloData) {
      return NextResponse.json(
        { error: "No Trello JSON data provided" },
        { status: 400 }
      );
    }

    const parsed = parseTrelloExport(trelloData, session.id);

    if (dryRun) {
      return NextResponse.json({
        summary: parsed.summary,
      });
    }

    const savedBoard = await dataStore.importFullBoard(
      parsed.board,
      parsed.lists,
      parsed.labels,
      parsed.cards
    );

    return NextResponse.json({
      success: true,
      board: savedBoard,
      summary: parsed.summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to import Trello board";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

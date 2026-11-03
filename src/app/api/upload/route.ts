import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile } from "@/lib/storage";
import { dataStore } from "@/lib/db/json-store";
import { CardAttachment } from "@/types/stride";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const cardId = formData.get("cardId") as string | null;
    const setAsCover = formData.get("setAsCover") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploaded = await uploadFile(file, file.name);

    const attachment: CardAttachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: uploaded.name,
      url: uploaded.url,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
      uploadedAt: new Date().toISOString(),
    };

    if (cardId) {
      const card = await dataStore.getCardById(cardId);
      if (card) {
        const currentAttachments = card.attachments || [];
        const isImage = file.type.startsWith("image/");
        const newCover = (setAsCover || (!card.coverImageUrl && isImage)) ? uploaded.url : card.coverImageUrl;

        await dataStore.updateCard(cardId, {
          attachments: [...currentAttachments, attachment],
          coverImageUrl: newCover,
        });
      }
    }

    return NextResponse.json({
      success: true,
      attachment,
      url: uploaded.url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file/image to Vercel Blob (when BLOB_READ_WRITE_TOKEN is present),
 * with a self-contained local storage fallback (public/uploads) for offline development.
 */
export async function uploadFile(
  file: File | Blob,
  filename: string
): Promise<UploadResult> {
  const mimeType = file.type || "application/octet-stream";
  const size = file.size;

  // 1. If Vercel Blob token is present, upload directly to Vercel Blob CDN
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, {
      access: "public",
    });
    return {
      url: blob.url,
      name: filename,
      size,
      mimeType,
    };
  }

  // 2. Local fallback: Save to public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filepath = path.join(uploadsDir, safeFilename);

  const arrayBuffer = await file.arrayBuffer();
  await fs.promises.writeFile(filepath, Buffer.from(arrayBuffer));

  return {
    url: `/uploads/${safeFilename}`,
    name: filename,
    size,
    mimeType,
  };
}

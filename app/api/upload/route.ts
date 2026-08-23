import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes execution time for large uploads

// On Hostinger, UPLOAD_DIR must point to public_html/images/uploads so Apache
// can serve the files directly. Locally it falls back to public/images/uploads.
function getUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, "uploads")
    : path.join(process.cwd(), "public", "images", "uploads");
}

function getTempDir(): string {
  return path.join(getUploadDir(), ".tmp");
}

export async function POST(request: Request) {
  try {
    const chunkIndex = request.headers.get("x-chunk-index");
    const totalChunks = request.headers.get("x-total-chunks");
    const fileId = request.headers.get("x-file-id");
    const fileName = request.headers.get("x-file-name");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = getUploadDir();

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Chunked upload handler for large files (videos up to 200MB+)
    if (chunkIndex !== null && totalChunks !== null && fileId && fileName) {
      const idx = parseInt(chunkIndex, 10);
      const total = parseInt(totalChunks, 10);
      const ext = fileName.split(".").pop() || "mp4";
      const tempDir = getTempDir();

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
      const tempFilePath = path.join(tempDir, `${safeId}.${ext}.part`);

      if (idx === 0) {
        fs.writeFileSync(tempFilePath, buffer);
      } else {
        fs.appendFileSync(tempFilePath, buffer);
      }

      // Final chunk received - move temp file to permanent uploads directory
      if (idx === total - 1) {
        const finalFilename = `${Date.now()}_${safeId}.${ext}`;
        const finalPath = path.join(uploadDir, finalFilename);
        fs.renameSync(tempFilePath, finalPath);
        return NextResponse.json({ success: true, url: `/images/uploads/${finalFilename}` });
      }

      return NextResponse.json({ success: true, chunkReceived: idx, totalChunks: total });
    }

    // Single-request upload handler for standard small files
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ success: true, url: `/images/uploads/${filename}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to upload file." }, { status: 500 });
  }
}

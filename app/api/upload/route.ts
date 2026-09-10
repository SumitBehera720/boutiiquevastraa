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

    let buffer: Buffer;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
      }
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const rawBuf = await request.arrayBuffer();
      if (!rawBuf || rawBuf.byteLength === 0) {
        return NextResponse.json({ success: false, error: "Empty request payload." }, { status: 400 });
      }
      buffer = Buffer.from(rawBuf);
    }

    const uploadDir = getUploadDir();

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Chunked upload handler for large files (supports concurrent parallel uploads)
    if (chunkIndex !== null && totalChunks !== null && fileId && fileName) {
      const idx = parseInt(chunkIndex, 10);
      const total = parseInt(totalChunks, 10);
      const ext = fileName.split(".").pop() || "mp4";
      const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
      const fileTempDir = path.join(getTempDir(), safeId);

      if (!fs.existsSync(fileTempDir)) {
        fs.mkdirSync(fileTempDir, { recursive: true });
      }

      // Save individual chunk part (supports parallel/out-of-order arrival)
      const partPath = path.join(fileTempDir, `part_${idx}`);
      fs.writeFileSync(partPath, buffer);

      // Check how many parts have arrived
      const existingParts = fs.readdirSync(fileTempDir).filter((f) => f.startsWith("part_"));

      // All parts received - merge in exact sequential order
      if (existingParts.length === total) {
        const finalFilename = `${Date.now()}_${safeId}.${ext}`;
        const finalPath = path.join(uploadDir, finalFilename);

        const writeStream = fs.createWriteStream(finalPath);
        for (let i = 0; i < total; i++) {
          const chunkPath = path.join(fileTempDir, `part_${i}`);
          if (fs.existsSync(chunkPath)) {
            const chunkBuf = fs.readFileSync(chunkPath);
            writeStream.write(chunkBuf);
          }
        }
        writeStream.end();

        // Clean up temp part directory
        try {
          fs.rmSync(fileTempDir, { recursive: true, force: true });
        } catch {}

        return NextResponse.json({ success: true, url: `/images/uploads/${finalFilename}` });
      }

      return NextResponse.json({ success: true, chunkReceived: idx, totalChunks: total, partsCount: existingParts.length });
    }

    // Single-request upload handler for standard small files
    const ext = fileName ? (fileName.split(".").pop() || "jpg") : "jpg";
    const filename = `${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ success: true, url: `/images/uploads/${filename}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to upload file." }, { status: 500 });
  }
}

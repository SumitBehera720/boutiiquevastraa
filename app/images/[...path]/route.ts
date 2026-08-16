import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const pathSegments = params.path || [];
    const relPath = pathSegments.join("/");

    // 1. Try process.env.UPLOAD_DIR if configured
    const uploadBase = process.env.UPLOAD_DIR
      ? process.env.UPLOAD_DIR
      : path.join(process.cwd(), "public", "images");

    let filePath = path.join(uploadBase, relPath);

    // 2. Fall back to standard public/images path
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "public", "images", relPath);
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".gif": "image/gif",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

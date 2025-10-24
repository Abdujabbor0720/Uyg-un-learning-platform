import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import { join } from "path";
import { createReadStream } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Filename validatsiyasi
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      return NextResponse.json(
        { error: "Noto'g'ri fayl nomi" },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), "public", "uploads", filename);

    // Fayl mavjudligini tekshirish
    let fileStats;
    try {
      fileStats = await stat(filePath);
    } catch {
      console.error("Video not found:", filePath);
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    const fileSize = fileStats.size;
    const range = request.headers.get("range");

    // Content-Type'ni aniqlash
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "video/mp4";
    if (ext === "webm") contentType = "video/webm";
    if (ext === "avi") contentType = "video/x-msvideo";
    if (ext === "mov") contentType = "video/quicktime";

    // Range request qo'llab-quvvatlash (video streaming uchun muhim)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Node.js stream yaratish
      const stream = createReadStream(filePath, { start, end });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } else {
      // Range so'rovi bo'lmasa, butun faylni yuborish
      const stream = createReadStream(filePath);

      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileSize.toString(),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  } catch (error: any) {
    console.error("Video stream error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

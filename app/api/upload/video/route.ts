import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  VideoService,
  initializeDatabase,
  SettingsService,
} from "@/lib/postgres";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    // Sozlamalarni olish
    const settings = await SettingsService.get();
    const maxSize = (settings?.maxVideoSize || 3000) * 1024 * 1024; // MB to bytes
    const allowedFormats = settings?.allowedVideoFormats || [
      "mp4",
      "webm",
      "avi",
      "mov",
    ];
    const allowedTypes = allowedFormats.map(
      (format: string) => `video/${format}`
    );

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    console.log("Upload request received:", {
      hasFile: !!file,
      title,
      fileSize: file?.size,
      fileName: file?.name,
      maxSize: settings?.maxVideoSize,
    });

    if (!file || !title) {
      return NextResponse.json(
        { error: "Fayl va sarlavha kerak" },
        { status: 400 }
      );
    }

    // Fayl turini tekshirish
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Faqat video fayllar (${allowedFormats
            .join(", ")
            .toUpperCase()}) qabul qilinadi`,
        },
        { status: 400 }
      );
    }

    // Fayl hajmini tekshirish
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `Fayl juda katta. Maksimal hajm: ${
            settings?.maxVideoSize || 3000
          }MB.`,
        },
        { status: 413 }
      );
    }

    // Fayl nomini xavfsiz qilish
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "mp4";
    const safeFilename = `${timestamp}_${Math.random()
      .toString(36)
      .substring(7)}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    const uploadPath = join(uploadDir, safeFilename);

    // Uploads papkasini yaratish
    await mkdir(uploadDir, { recursive: true });

    // Faylni saqlash
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(uploadPath, buffer);

    console.log("File saved successfully:", uploadPath);

    // Database'ga yozish
    const video = await VideoService.create({
      title,
      description: description || "",
      filename: safeFilename,
      url: safeFilename, // Faqat filename saqlaymiz
    });

    console.log("Video saved to database:", video);

    return NextResponse.json(video, { status: 201 });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      {
        error: error.message || "Server error",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

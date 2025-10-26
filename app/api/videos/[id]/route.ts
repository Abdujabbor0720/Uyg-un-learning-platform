import { NextRequest, NextResponse } from "next/server";
import { VideoService, initializeDatabase } from "@/lib/postgres";

export const dynamic = "force-dynamic";

// Next.js 15+ da params Promise bo'ladi
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    // Params'ni await qilish kerak (Next.js 15+)
    const params = await props.params;
    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: "Noto'g'ri video ID" },
        { status: 400 }
      );
    }

    const video = await VideoService.findById(videoId);

    if (!video) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    return NextResponse.json(video, { status: 200 });
  } catch (error: any) {
    console.error("Get video error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    // Params'ni await qilish
    const params = await props.params;
    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: "Noto'g'ri video ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Yangilanish ma'lumotlari topilmadi" },
        { status: 400 }
      );
    }

    const updatedVideo = await VideoService.update(videoId, updates);

    if (!updatedVideo) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    return NextResponse.json(updatedVideo, { status: 200 });
  } catch (error: any) {
    console.error("Update video error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    // Params'ni await qilish
    const params = await props.params;
    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: "Noto'g'ri video ID" },
        { status: 400 }
      );
    }

    const video = await VideoService.findById(videoId);

    if (!video) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    // Faylni o'chirish (optional)
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(
        process.cwd(),
        "public/uploads",
        video.filename
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Video file deleted:", filePath);
      }
    } catch (fileError) {
      console.error("File deletion error:", fileError);
      // Fayl o'chirishda xato bo'lsa ham davom etamiz
    }

    const deletedVideo = await VideoService.delete(videoId);

    return NextResponse.json(
      {
        message: "Video muvaffaqiyatli o'chirildi",
        video: deletedVideo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

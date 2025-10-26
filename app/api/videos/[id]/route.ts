import { NextRequest, NextResponse } from "next/server";
import { VideoService, initializeDatabase } from "@/lib/postgres";

export const dynamic = "force-dynamic";

// GET metodi - VIDEO OLISH
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

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

// PATCH metodi - VIDEO YANGILASH
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

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

// DELETE metodi - VIDEO O'CHIRISH
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

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

    // Faylni o'chirish
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
      }
    } catch (fileError) {
      console.error("File deletion error:", fileError);
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

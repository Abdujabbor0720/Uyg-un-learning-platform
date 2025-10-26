import { NextRequest, NextResponse } from "next/server";
import { VideoService, initializeDatabase } from "@/lib/postgres";

export const dynamic = "force-dynamic";

// Params type'ni aniqroq qilish
type RouteParams = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    await initializeDatabase();

    // Params async yoki sync bo'lishi mumkin
    const params =
      "then" in context.params ? await context.params : context.params;

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

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    await initializeDatabase();

    const params =
      "then" in context.params ? await context.params : context.params;

    const videoId = parseInt(params.id);
    const body = await request.json();
    const { title, description } = body;

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: "Noto'g'ri video ID" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

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

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    await initializeDatabase();

    const params =
      "then" in context.params ? await context.params : context.params;

    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: "Noto'g'ri video ID" },
        { status: 400 }
      );
    }

    const deletedVideo = await VideoService.delete(videoId);

    if (!deletedVideo) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Video muvaffaqiyatli o'chirildi" },
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

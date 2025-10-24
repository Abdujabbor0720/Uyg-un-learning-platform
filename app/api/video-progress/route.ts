import { NextRequest, NextResponse } from "next/server";
import { VideoProgressService } from "@/lib/postgres";
import { verifyToken, getUserFromToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, then from cookie
    const authHeader = request.headers.get("authorization");
    let userData = getUserFromToken(authHeader);

    // If not found in header, try cookie
    if (!userData) {
      const token = request.cookies.get("token")?.value;
      if (token) {
        try {
          userData = verifyToken(token);
        } catch (error) {
          // Invalid token
        }
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, currentTime, duration } = body;

    if (!videoId || currentTime === undefined || !duration) {
      return NextResponse.json(
        { error: "videoId, currentTime va duration kerak" },
        { status: 400 }
      );
    }

    const progress = await VideoProgressService.updateProgress(
      userData.id,
      parseInt(videoId),
      parseFloat(currentTime),
      parseFloat(duration)
    );

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("POST /api/video-progress error:", error);
    return NextResponse.json(
      { error: "Progress saqlashda xatolik" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, then from cookie
    const authHeader = request.headers.get("authorization");
    let userData = getUserFromToken(authHeader);

    // If not found in header, try cookie
    if (!userData) {
      const token = request.cookies.get("token")?.value;
      if (token) {
        try {
          userData = verifyToken(token);
        } catch (error) {
          // Invalid token
        }
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const videoIds = searchParams.get("videoIds");

    if (videoId) {
      // Get progress for a specific video
      const progress = await VideoProgressService.getProgress(
        userData.id,
        parseInt(videoId)
      );
      return NextResponse.json(progress || {});
    } else if (videoIds) {
      // Get progress for multiple videos
      const ids = videoIds.split(",").map((id) => parseInt(id));
      const progress = await VideoProgressService.getVideosProgress(
        userData.id,
        ids
      );
      return NextResponse.json(progress);
    } else {
      // Get all progress for user
      const progress = await VideoProgressService.getUserProgress(userData.id);
      return NextResponse.json(progress);
    }
  } catch (error: any) {
    console.error("GET /api/video-progress error:", error);
    return NextResponse.json(
      { error: "Progress olishda xatolik" },
      { status: 500 }
    );
  }
}

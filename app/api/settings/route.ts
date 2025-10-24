import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { SettingsService } from "@/lib/postgres";

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get("token")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await SettingsService.get();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Sozlamalarni yuklashda xatolik" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get("token")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updatedSettings = await SettingsService.update(body);
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Sozlamalarni yangilashda xatolik" },
      { status: 500 }
    );
  }
}

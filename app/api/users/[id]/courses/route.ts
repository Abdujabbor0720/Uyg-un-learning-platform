import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, UserService } from "@/lib/postgres";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Noto'g'ri foydalanuvchi ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { courses } = body;

    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: "Kurslar array bo'lishi kerak" },
        { status: 400 }
      );
    }

    // Kurslarni yangilash
    const courseIds = courses.map((id) => parseInt(id));
    const updatedUser = await UserService.updateUserCourses(userId, courseIds);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error("Update user courses error:", error);
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

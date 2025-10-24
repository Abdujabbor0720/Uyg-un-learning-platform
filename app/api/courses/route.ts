import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/lib/postgres";
import { initializeDatabase } from "@/lib/postgres";

export async function GET() {
  try {
    await initializeDatabase();
    const result = await CourseService.findAll();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    console.log("POST /api/courses - Request body:", body);

    const { title, description, price, videos } = body;

    if (!title || price === undefined) {
      console.error("Validation error: title or price missing");
      return NextResponse.json(
        { error: "title va price kerak" },
        { status: 400 }
      );
    }

    console.log("Creating course with data:", {
      title,
      description,
      price,
      videos: Array.isArray(videos) ? videos : [],
    });

    const course = await CourseService.create({
      title,
      description,
      price,
      videos: Array.isArray(videos) ? videos : [],
    });

    console.log("Course created successfully:", course);
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/courses - Error:", error);
    console.error("Error stack:", error.stack);
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

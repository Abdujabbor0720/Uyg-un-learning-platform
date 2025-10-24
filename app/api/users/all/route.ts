import { NextRequest, NextResponse } from "next/server";
import { UserService, initializeDatabase } from "@/lib/postgres";
import { getUserFromToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const userData = getUserFromToken(authHeader);

    if (!userData) {
      return NextResponse.json(
        { error: "Authorization token kerak" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const currentUser = await UserService.findById(userData.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin huquqi kerak" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Get users from database
    const result = await UserService.findAll(page, limit, search);

    // Return users without passwords
    const usersWithoutPasswords = result.data.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(
      {
        data: usersWithoutPasswords,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get all users error:", error);
    return NextResponse.json(
      { error: "Server xatoligi yuz berdi" },
      { status: 500 }
    );
  }
}

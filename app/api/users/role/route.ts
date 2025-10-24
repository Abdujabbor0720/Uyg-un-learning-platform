import { NextRequest, NextResponse } from "next/server";
import { UserService, initializeDatabase } from "@/lib/postgres";
import { getUserFromToken, getTokenFromHeader } from "@/lib/jwt";

export async function PATCH(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const decoded = getUserFromToken(authHeader);

    if (!decoded) {
      return NextResponse.json(
        { error: "Authorization token kerak" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const currentUser = await UserService.findById(decoded.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin huquqi kerak" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId va role kerak" },
        { status: 400 }
      );
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Rol admin yoki user bo'lishi kerak" },
        { status: 400 }
      );
    }

    // Find user to update
    const userToUpdate = await UserService.findById(parseInt(userId));
    if (!userToUpdate) {
      return NextResponse.json(
        { error: "Foydalanuvchi topilmadi" },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await UserService.update(parseInt(userId), { role });
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Foydalanuvchi roli yangilanmadi" },
        { status: 500 }
      );
    }

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: `Foydalanuvchi roli ${role} ga o'zgartirildi`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      { error: "Server xatoligi yuz berdi" },
      { status: 500 }
    );
  }
}

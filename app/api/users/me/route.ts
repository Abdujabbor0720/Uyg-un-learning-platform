import { NextRequest, NextResponse } from "next/server";
import { UserService, initializeDatabase } from "@/lib/postgres";
import { getUserFromToken, verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

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
      return NextResponse.json(
        { error: "Authorization token kerak" },
        { status: 401 }
      );
    }

    // Find user by ID
    const user = await UserService.findById(userData.id);
    if (!user) {
      return NextResponse.json(
        { error: "Foydalanuvchi topilmadi" },
        { status: 404 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Server xatoligi yuz berdi" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

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
      return NextResponse.json(
        { error: "Authorization token kerak" },
        { status: 401 }
      );
    }

    // Find user by ID
    const existingUser = await UserService.findById(userData.id);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Foydalanuvchi topilmadi" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, email, password } = body;

    // Prepare updates
    const updates: any = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;

    if (email && email !== existingUser.email) {
      // Check if email is already in use
      const emailUser = await UserService.findByEmail(email);
      if (emailUser && emailUser.id !== userData.id) {
        return NextResponse.json(
          { error: "Bu email allaqachon ishlatilmoqda" },
          { status: 409 }
        );
      }
      updates.email = email;
    }

    if (password) {
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await UserService.update(userData.id, updates);
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Foydalanuvchi yangilanmadi" },
        { status: 500 }
      );
    }

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: "Profil muvaffaqiyatli yangilandi",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Server xatoligi yuz berdi" },
      { status: 500 }
    );
  }
}

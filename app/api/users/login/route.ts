import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserService, initializeDatabase } from "@/lib/postgres";
import { createToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email va parol kiritilishi kerak" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Email yoki parol noto'g'ri" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email yoki parol noto'g'ri" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.status) {
      return NextResponse.json(
        { error: "Hisobingiz faol emas" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    // Create response with cookie
    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        token,
        message: "Muvaffaqiyatli kirildi",
      },
      { status: 200 }
    );

    // Set cookie with httpOnly for security
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server xatoligi yuz berdi" },
      { status: 500 }
    );
  }
}

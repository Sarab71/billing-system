import { NextRequest, NextResponse } from "next/server";
import { createSession, AUTH_COOKIE_NAME } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 }
      );
    }

    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error("Authentication environment variables are missing");

      return NextResponse.json(
        {
          success: false,
          message: "Authentication is not configured",
        },
        { status: 500 }
      );
    }

    if (
      username !== validUsername ||
      password !== validPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    const token = await createSession();

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySession,
} from "@/app/lib/auth";

export async function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(
    AUTH_COOKIE_NAME
  )?.value;

  if (!token) {
    // API request
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Page request
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const valid = await verifySession(token);

  if (!valid) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          { status: 401 }
        )
      : NextResponse.redirect(
          new URL("/login", request.url)
        );

    // Invalid session ko remove bhi karo
    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static
     * - _next/image
     * - favicon
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
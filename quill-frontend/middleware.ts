import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Check the token cookie
  const token = req.cookies.get("token")?.value;

  // If the user is trying to access /editor and no token → redirect
  if (!token && req.nextUrl.pathname.startsWith("/editor")) {
    return NextResponse.redirect(new URL("/blogs", req.url));
  }

  return NextResponse.next();
}

// Only run middleware on /editor
export const config = {
  matcher: ["/editor/:path*"],
};

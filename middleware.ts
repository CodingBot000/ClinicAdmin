import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "bl_admin_session";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin 페이지들만 보호. /api/** 는 막지 않는다.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"]
};
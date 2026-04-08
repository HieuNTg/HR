import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
];

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  const protected_prefixes = [
    "/dashboard",
    "/jobs",
    "/candidates",
    "/interviews",
    "/reports",
  ];
  return protected_prefixes.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicPath(pathname);
}

export async function proxy(_req: NextRequest) {
  // Demo mode: allow all requests without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

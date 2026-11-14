import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, ROLES } from "@/shared/constants";
import type { Role } from "@/shared/constants";

const EMPLOYEE_PAGES = ["/me", "/account"];
const EMPLOYEE_API = ["/api/auth", "/api/me"];

interface TokenClaims {
  role?: Role;
  mcp: boolean;
}

/** The app's JWT payload must carry these fields (matches verifyToken's schema). */
const REQUIRED_PAYLOAD_FIELDS = [
  "sub",
  "role",
  "username",
  "name",
  "tv",
  "mcp",
] as const;

function isWellFormed(payload: unknown): payload is {
  sub: string;
  role: Role;
  username: string;
  name: string;
  tv: number;
  mcp: boolean;
} {
  if (typeof payload !== "object" || payload === null) return false;
  const p = payload as Record<string, unknown>;
  for (const field of REQUIRED_PAYLOAD_FIELDS) {
    if (!(field in p)) return false;
  }
  if (typeof p.role !== "string" || !ROLES.includes(p.role as Role)) {
    return false;
  }
  if (typeof p.tv !== "number" || !Number.isInteger(p.tv) || p.tv < 0) {
    return false;
  }
  if (typeof p.mcp !== "boolean") return false;
  return true;
}

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

async function readToken(
  token: string | undefined,
): Promise<TokenClaims | null> {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );

    // A structurally complete payload is the app's notion of a "valid" session.
    // Anything older/malformed (e.g. a pre-migration cookie) is treated as
    // absent so the login page is shown instead of bouncing forever.
    if (!isWellFormed(payload)) return null;

    return {
      role: payload.role,
      mcp: payload.mcp,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const claims = await readToken(token);

  if (!claims) {
    if (pathname === "/api/health" || pathname === "/api/auth/login") {
      return NextResponse.next();
    }

    if (isApi) {
      const response = NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
      if (token)
        response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return response;
    }

    if (pathname === "/login") return NextResponse.next();

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token)
      response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }

  const isEmployee = claims.role === "employee";
  const mustChangePassword = claims.mcp;

  if (pathname === "/" || pathname === "/login") {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL("/account?required=1", request.url));
    }
    return NextResponse.redirect(
      new URL(isEmployee ? "/me" : "/dashboard", request.url),
    );
  }

  if (mustChangePassword) {
    if (!isApi && !matchesPath(pathname, "/account")) {
      return NextResponse.redirect(new URL("/account?required=1", request.url));
    }
    if (isApi && !pathname.startsWith("/api/auth/")) {
      return NextResponse.json(
        { success: false, message: "Password change required" },
        { status: 403 },
      );
    }
  }

  if (isEmployee) {
    if (
      !isApi &&
      !EMPLOYEE_PAGES.some((prefix) => matchesPath(pathname, prefix))
    ) {
      return NextResponse.redirect(new URL("/me", request.url));
    }
    if (
      isApi &&
      !EMPLOYEE_API.some((prefix) => matchesPath(pathname, prefix))
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

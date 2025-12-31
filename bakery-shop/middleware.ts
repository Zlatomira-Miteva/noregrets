import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isActiveAdminToken = (token: any) => {
  if (!token) return false;
  if (token.role !== "ADMIN") return false;
  if (token.active === false) return false;
  if (!token.operatorCode) return false;
  const now = Date.now();
  const from = token.activeFrom ? Date.parse(token.activeFrom) : null;
  const to = token.activeTo ? Date.parse(token.activeTo) : null;
  if (Number.isFinite(from) && from !== null && from > now) return false;
  if (Number.isFinite(to) && to !== null && to < now) return false;
  return true;
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isAdmin = isActiveAdminToken(token);

    // Block admin login page – admins се логват през нормалния login.
    if (pathname.startsWith("/admin/login")) {
      const url = new URL("/404", req.url);
      return NextResponse.rewrite(url);
    }

    // Protect admin APIs with JSON 401.
    if (pathname.startsWith("/api/admin")) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // Protect coupons API for admins only.
    if (pathname.startsWith("/api/coupons") && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Protect admin pages.
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      if (!isAdmin) {
        const url = new URL("/404", req.url);
        return NextResponse.rewrite(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Always allow; we handle admin gating manually above.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/coupons",
    "/api/coupons/:path*",
  ],
};

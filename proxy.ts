import { NextResponse, type NextRequest } from "next/server";

const contentAdminHost =
  process.env.CONTENT_ADMIN_HOST?.toLowerCase() || "manage.wearestilllhere.com";

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();

  if (hostname !== contentAdminHost) return NextResponse.next();

  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname === "/content"
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/admin/content";
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};


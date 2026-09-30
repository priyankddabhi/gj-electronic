import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("gje-admin-session");
  if (!session?.value) {
    const loginUrl = new URL("/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Matches /admin/anything but NOT /admin itself (which is the login form)
  matcher: ["/admin/:path+"],
};

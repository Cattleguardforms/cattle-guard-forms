import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/distributor/order-portal") {
    return NextResponse.redirect(new URL("/distributor/shop", request.url));
  }

  if (pathname === "/distributor/portal") {
    return NextResponse.redirect(new URL("/distributor/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/distributor/order-portal", "/distributor/portal"],
};

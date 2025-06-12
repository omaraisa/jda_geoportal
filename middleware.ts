import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const arcgisToken = req.cookies.get("arcgis_token")?.value;
  const arcgisTokenExpiry = req.cookies.get("arcgis_token_expiry")?.value;

  if (!arcgisToken || !arcgisTokenExpiry) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_AUTH_URL || "/", req.url));
  }

  const expiryTime = parseInt(arcgisTokenExpiry);

  if (!isNaN(expiryTime) && Date.now() >= expiryTime) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_AUTH_URL || "/", req.url));
  }

  // If the token is valid, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/resources/:path*"],
};

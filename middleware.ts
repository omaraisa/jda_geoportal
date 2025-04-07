import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const arcgisToken = req.cookies.get("arcgis_token")?.value;
  const arcgisTokenExpiry = req.cookies.get("arcgis_token_expiry")?.value;
  

  if (!arcgisToken || !arcgisTokenExpiry) {
    console.log("No ArcGIS token found. Redirecting to login page");
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_LOGIN_URL || "/", req.url));
  }

  const expiryTime = parseInt(arcgisTokenExpiry);
  if (Date.now() >= expiryTime) {
    console.log("ArcGIS token expired. Redirecting to login page");
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_LOGIN_URL || "/", req.url));
  }
}

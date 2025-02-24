import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./app/lib/auth";


export default async function middleware(req: NextRequest) {
  // const cookie = (await cookies()).get("authToken")?.value;

  // // If no token is found, redirect to the home page
  // if (!cookie) {
  //   console.log("No token found. Redirecting to login page");
  //   return NextResponse.redirect(new URL("http://localhost:3101", req.url));
  // }

  // try {
  //   const token = await decrypt(cookie);


  //   const isExpired = token?.exp ? Date.now() >= token.exp * 1000 : true;

  //   if (isExpired || !token?.userId) { 
  //     NextResponse.redirect(new URL("http://localhost:3101", req.url));
  //   }

  // } catch (error) {
  //   console.error("Failed to verify token:", error);
  //   return NextResponse.redirect(new URL("http://localhost:3101", req.url));
  // }

  }
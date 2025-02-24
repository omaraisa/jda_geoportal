'use server'

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.TOKEN_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function deleteToken() {
  const cookieStore = await cookies();
  cookieStore.delete("authToken");
}

type TokenPayload = {
  userId: string;
  expiresAt: Date;
};

export async function encrypt(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify auth token", error);
  }
}

export async function checkIsAuthenticated() {
  const cookie = (await cookies()).get("authToken")?.value;

  if (!cookie) {
    return false;
  }

  const token = await decrypt(cookie);
  if (!token?.userId) {
    return false;
  }
  const { exp } = token;
  if (exp && Date.now() >= (exp * 1000 - 40000)) {
    return false;
  }

  return true;
}
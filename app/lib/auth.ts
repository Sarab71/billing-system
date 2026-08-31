import { SignJWT, jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export const AUTH_COOKIE_NAME = "billing_session";

export async function createSession() {
  return await new SignJWT({
    authenticated: true,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      secretKey
    );

    return payload.authenticated === true;
  } catch {
    return false;
  }
}
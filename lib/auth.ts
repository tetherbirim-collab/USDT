import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { findUserById } from "./store";
import type { PublicUser } from "./types";

const COOKIE = "sk_session";
/** Local demo session key. This app is not a production authenticator. */
const SECRET = "sanalkart-simulasyon-oturum-anahtari-v1";
const MAX_AGE = 60 * 60 * 24 * 30;

type Payload = { uid: string; exp: number };

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export async function setSession(userId: string) {
  const payload: Payload = { uid: userId, exp: Date.now() + MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function toPublic(user: {
  id: string;
  name: string;
  email: string;
  balance: number;
  plan: PublicUser["plan"];
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance,
    plan: user.plan,
  };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const id = await readSessionUserId();
  if (!id) return null;
  const user = findUserById(id);
  if (!user) return null;
  return toPublic(user);
}

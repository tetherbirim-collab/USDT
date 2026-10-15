import { findUserById } from "./store";
import type { PublicUser } from "./types";

const SESSION = "clay-session";

export function setSession(userId: string) {
  localStorage.setItem(SESSION, userId);
}

export function clearSession() {
  localStorage.removeItem(SESSION);
}

export function readSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION);
}

export function toPublic(user: {
  id: string;
  name: string;
  username: string;
  balance: number;
  usdMinor: number;
  plan: PublicUser["plan"];
  role: PublicUser["role"];
  status: PublicUser["status"];
  address: string;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    balance: user.balance,
    usdMinor: user.usdMinor,
    plan: user.plan,
    role: user.role,
    status: user.status,
    address: user.address,
  };
}

export const ADMIN_PATH = "/bunugizliyapki";

export function deskPath(role: PublicUser["role"]): string {
  return role === "yonetici" ? ADMIN_PATH : "/panel";
}

export function getCurrentUser(): PublicUser | null {
  const id = readSessionUserId();
  if (!id) return null;
  const user = findUserById(id);
  if (!user || user.status === "askida") return null;
  return toPublic(user);
}

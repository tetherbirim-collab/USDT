"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getCurrentUser } from "./auth";
import { bootLedger, ledgerSnapshot, subscribeLedger } from "./store";
import type { DB, PublicUser } from "./types";

export function useLedger(): DB | null {
  const snap = useSyncExternalStore(subscribeLedger, ledgerSnapshot, () => null);
  useEffect(() => {
    bootLedger();
  }, []);
  return snap;
}

export function useUser(): PublicUser | null | undefined {
  const db = useLedger();
  if (!db) return undefined;
  return getCurrentUser();
}

export function useQuery(): URLSearchParams | null {
  const db = useLedger();
  if (!db || typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

export function Boot() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <p className="text-sm font-semibold tracking-[0.18em] text-gold">CLAY açılıyor</p>
    </main>
  );
}

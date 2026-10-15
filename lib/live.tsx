"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Mark } from "@/components/mark";
import { getCurrentUser } from "./auth";
import { defaultSettings } from "./catalog";
import { bootLedger, ledgerSnapshot, subscribeLedger, touchLedger } from "./store";
import type { DB, PublicUser, SiteSettings } from "./types";

export function useLedger(): DB | null {
  const snap = useSyncExternalStore(subscribeLedger, ledgerSnapshot, () => null);
  useEffect(() => {
    bootLedger();
    const timer = window.setInterval(() => touchLedger(), 15000);
    return () => window.clearInterval(timer);
  }, []);
  return snap;
}

export function useSiteSettings(): SiteSettings {
  const db = useLedger();
  return db?.settings ?? defaultSettings();
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
    <main className="grid min-h-screen place-items-center px-6">
      <div className="grid justify-items-center gap-7">
        <div className="splash-card relative">
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(240,201,138,.38),transparent_68%)]" />
          <div
            className="relative h-40 w-64 overflow-hidden rounded-[22px] border border-white/25 shadow-[0_28px_70px_rgba(0,0,0,.45)]"
            style={{
              background:
                "linear-gradient(145deg, #3a2a18 0%, #1a1428 46%, #10241f 100%)",
            }}
          >
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.18)_48%,transparent_60%)]" />
            <span className="absolute left-5 top-5 h-7 w-10 rounded-[7px] bg-gradient-to-br from-[#fff1cf] to-[#c4924a] shadow-[inset_0_1px_0_rgba(255,255,255,.7)]" />
            <span className="absolute bottom-5 right-5">
              <Mark className="h-11 w-11" />
            </span>
            <span className="absolute bottom-6 left-5 font-mono text-[11px] tracking-[0.22em] text-white/70">
              CLAY
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-display text-4xl font-extrabold tracking-[0.18em] text-white">CLAY</p>
          <p className="mt-2 text-xs font-bold tracking-[0.32em] text-gold sm:text-sm">
            SANAL KART HİZMETLERİ
          </p>
        </div>
      </div>
    </main>
  );
}

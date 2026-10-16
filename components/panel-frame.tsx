"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions";
import { PLANS } from "@/lib/catalog";
import { daysLeftLine, daysUntil, formatDay } from "@/lib/format";
import type { PlanId } from "@/lib/types";
import { AnnounceBar } from "./announce-bar";
import { PayRail } from "./pay-rail";
import { Mark, Wordmark } from "./mark";
import { TrustLine } from "./trust-line";
import { siteText } from "@/lib/copy";
import type { CopyKey } from "@/lib/copy";
import { useSiteSettings } from "@/lib/live";

const PLAN_EMOJI = { bronze: "🥉", silver: "🥈", gold: "🥇" } as const;

const LINKS = [
  ["/panel", "panelOzet"],
  ["/panel/kartlar", "panelKart"],
  ["/panel/siparisler", "panelSiparis"],
  ["/panel/islemler", "panelOdeme"],
  ["/panel/yukle", "panelCuzdan"],
  ["/panel/destek", "panelDestek"],
  ["/panel/hesap", "panelHesap"],
] as const;

function Bell({ unread }: { unread: number }) {
  return (
    <Link href="/panel/bildirimler" className="bell" aria-label={unread > 0 ? `${unread} okunmamış bildirim` : "Bildirimler"}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M12 3.2a5.2 5.2 0 0 0-5.2 5.2v2.1c0 .7-.2 1.4-.6 2L4.6 14.6A1.2 1.2 0 0 0 5.6 16.5h12.8a1.2 1.2 0 0 0 1-1.9l-1.6-2.1a3.6 3.6 0 0 1-.6-2V8.4A5.2 5.2 0 0 0 12 3.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.4 16.6a2.6 2.6 0 0 0 5.2 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {unread > 0 && <span className="note-count bell-count">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}

function NavLinks({ path, metal, stacked = false }: { path: string; metal: keyof typeof PLAN_EMOJI; stacked?: boolean }) {
  const emoji = PLAN_EMOJI[metal];
  const settings = useSiteSettings();
  return (
    <>
      {LINKS.map(([href, key]) => {
        const label = siteText(settings, key as CopyKey);
        const active = href === "/panel" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-pill nav-metal-${metal} rounded-full px-3 py-2 text-sm font-bold whitespace-nowrap ${stacked ? "text-center" : ""} ${active ? "nav-on" : "bg-white/5 text-white/80"}`}
          >
            {active && (
              <span className="nav-emoji" aria-hidden>
                {emoji}
              </span>
            )}
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function PanelFrame({
  name,
  username,
  balanceLabel,
  planId,
  planName,
  planUntil,
  unread = 0,
  children,
}: {
  name: string;
  username: string;
  balanceLabel: string;
  planId: PlanId;
  planName: string;
  planUntil: string;
  unread?: number;
  children: React.ReactNode;
}) {
  const path = usePathname().replace(/\/$/, "") || "/";
  const [planOpen, setPlanOpen] = useState(false);
  const metal = PLANS[planId].metal;
  const emoji = PLAN_EMOJI[metal];
  const days = daysUntil(planUntil);
  const remain = days > 0 ? `Bitmesine ${daysLeftLine(days)}` : days === 0 ? "Paket bugün bitiyor" : "Paket günü geçti";
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-5">
      <header className="glass rounded-[28px] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Bell unread={unread} />
            <Link href="/panel/yukle" className="rounded-full bg-black/30 px-3 py-2">
              <span className="text-white/55">Bakiye </span>
              <span className="font-bold text-gold">{balanceLabel}</span>
            </Link>
            <button
              type="button"
              className={`plan-menu plan-menu-${metal}`}
              aria-expanded={planOpen}
              onClick={() => setPlanOpen((open) => !open)}
            >
              <span className="plan-emoji" aria-hidden>
                {emoji}
              </span>
              {planName}
            </button>
            <span className="hidden text-white/70 sm:inline">{name}</span>
            {name !== username && <span className="hidden text-white/40 md:inline">{username}</span>}
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">Çıkış</button>
            </form>
          </div>
        </div>
        {planOpen && (
          <p className="plan-menu-left">
            <span className="plan-emoji" aria-hidden>
              {emoji}
            </span>{" "}
            {planName}
            <span className="mt-1 block font-display text-lg font-bold">{remain}</span>
            <span className="mt-1 block text-sm text-white/60">{formatDay(planUntil)} tarihinde yenilenir.</span>
          </p>
        )}
        <nav className="mt-4 hidden flex-wrap gap-2 sm:flex">
          <NavLinks path={path} metal={metal} />
        </nav>
        <details className="mt-4 sm:hidden">
          <summary className="btn btn-ghost w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            Menü
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NavLinks path={path} metal={metal} stacked />
          </div>
        </details>
        <TrustLine />
      </header>
      <AnnounceBar />
      <PayRail />
      <div className="mt-6">{children}</div>
    </div>
  );
}

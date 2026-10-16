"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logoutAction } from "@/lib/actions";
import { ADMIN_PATH, deskPath } from "@/lib/auth";
import { Boot, useUser } from "@/lib/live";
import { AnnounceBar } from "@/components/announce-bar";
import { ChromePair, useChrome } from "@/components/chrome-controls";
import { Mark, Wordmark } from "@/components/mark";
import { TrustLine } from "@/components/trust-line";
import { snapshot } from "@/lib/store";
import { uiText, type UiKey } from "@/lib/ui";

const WORK = [
  ["", "desk"],
  ["/canli", "live"],
  ["/uyeler", "members"],
  ["/kartlar", "cards"],
  ["/islemler", "activity"],
  ["/destek", "support"],
  ["/bildirimler", "notices"],
] as const;

const STUDIO = [
  ["/bin", ""],
  ["/planlar", "plans"],
  ["/ucretler", "fees"],
  ["/metinler", "copy"],
  ["/telegram", ""],
  ["/hesap", "account"],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const { lang } = useChrome();
  const say = (key: UiKey) => uiText(lang, key);
  const raw = usePathname() || "/";
  let decoded = raw;
  if (raw.includes("%")) {
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }
  }
  const path = decoded.replace(/\/$/, "") || "/";
  useEffect(() => {
    if (user === null) window.location.replace("/giris/");
    if (user && user.role !== "yonetici") window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (!user || user.role !== "yonetici") return <Boot />;
  const db = snapshot();
  const counts: Record<string, number> = {
    "/canli": db.payouts.filter((row) => row.status === "bekliyor").length,
    "/kartlar": db.cards.filter((card) => card.status === "donduruldu").length,
    "/islemler": db.orders.filter((order) => order.status === "hazirlaniyor").length,
    "/destek": db.tickets.filter((ticket) => ticket.status === "acik").length,
  };
  const pill = (href: string, label: string) => {
    const full = `${ADMIN_PATH}${href}`;
    const active = href === "" ? path === ADMIN_PATH : path.startsWith(full) || (href === "/uyeler" && path.startsWith(`${ADMIN_PATH}/kullanici`));
    const count = counts[href] ?? 0;
    return (
      <Link
        key={full}
        href={full}
        className={`nav-pill rounded-full px-3 py-2 text-sm font-bold ${active ? "nav-on" : "bg-white/5 text-white/80"}`}
      >
        {label}
        {count > 0 ? ` ${count}` : ""}
      </Link>
    );
  };
  return (
    <div className="desk-root">
      <div className="desk-bg" aria-hidden>
        <img className="desk-still" src="/clay-hero.png" alt="" width={420} height={420} />
        <img className="desk-motion" src="/clay-hero.gif" alt="" width={420} height={420} />
      </div>
      <div className="relative z-[1] mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-5">
      <header className="glass rounded-[28px] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={ADMIN_PATH} className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2 text-sm">
            <ChromePair />
            <span className="rounded-full bg-[#e0152b] px-3 py-2 font-bold text-white">{say("admin")}</span>
            <span className="text-white/70">{user.username}</span>
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">{say("logout")}</button>
            </form>
          </div>
        </div>
        <nav className="mt-4 grid gap-2">
          <div className="flex flex-wrap gap-2">{WORK.map(([href, key]) => pill(href, say(key)))}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[11px] font-bold tracking-[0.16em] text-white/40">{say("setup")}</span>
            {STUDIO.map(([href, key]) => pill(href, key === "" ? (href === "/bin" ? "BIN" : "Telegram") : say(key)))}
          </div>
        </nav>
        <TrustLine />
      </header>
      <AnnounceBar />
      <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

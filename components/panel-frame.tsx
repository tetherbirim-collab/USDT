"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { Mark, Wordmark } from "./mark";

const LINKS = [
  ["/panel", "Özet"],
  ["/panel/kartlar", "Kartlarım"],
  ["/panel/siparisler", "Siparişler"],
  ["/panel/islemler", "Ödemeler"],
  ["/panel/yukle", "Cüzdan"],
  ["/panel/destek", "Destek"],
  ["/panel/hesap", "Hesap"],
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

function NavLinks({ path, stacked = false }: { path: string; stacked?: boolean }) {
  return (
    <>
      {LINKS.map(([href, label]) => {
        const active = href === "/panel" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-pill rounded-full px-3 py-2 text-sm font-bold whitespace-nowrap ${stacked ? "text-center" : ""} ${active ? "nav-on" : "bg-white/5 text-white/80"}`}
          >
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
  planName,
  unread = 0,
  children,
}: {
  name: string;
  username: string;
  balanceLabel: string;
  planName: string;
  unread?: number;
  children: React.ReactNode;
}) {
  const path = usePathname().replace(/\/$/, "") || "/";
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
            <span className="hidden rounded-full border border-white/15 px-3 py-2 text-white/80 sm:inline">
              {planName}
            </span>
            <span className="hidden text-white/70 sm:inline">{name}</span>
            {name !== username && <span className="hidden text-white/40 md:inline">{username}</span>}
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">Çıkış</button>
            </form>
          </div>
        </div>
        <nav className="mt-4 hidden flex-wrap gap-2 sm:flex">
          <NavLinks path={path} />
        </nav>
        <details className="mt-4 sm:hidden">
          <summary className="btn btn-ghost w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            Menü
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NavLinks path={path} stacked />
          </div>
        </details>
        <p className="trust-line">
          <span>KYC YOK</span>
          <span className="trust-hot">LOG YOK</span>
          <span>TAMAMEN GÜVENLİ VE ANONİM</span>
        </p>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

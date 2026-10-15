"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { Mark, Wordmark } from "./mark";

const LINKS = [
  ["/panel", "Özet"],
  ["/panel/kartlar", "Kartlar"],
  ["/panel/islemler", "İşlemler"],
  ["/panel/bildirimler", "Bildirimler"],
  ["/panel/yukle", "Cüzdan"],
  ["/panel/hesap", "Hesap"],
] as const;

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
  const path = usePathname();
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-5">
      <header className="glass rounded-[28px] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/panel/yukle" className="rounded-full bg-black/30 px-3 py-2">
              <span className="text-white/55">Bakiye </span>
              <span className="font-bold text-gold">{balanceLabel}</span>
            </Link>
            <span className="rounded-full border border-white/15 px-3 py-2 text-white/80">{planName}</span>
            <span className="hidden text-white/70 sm:inline">{name}</span>
            <span className="hidden text-white/40 md:inline">{username}</span>
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">Çıkış</button>
            </form>
          </div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto">
          {LINKS.map(([href, label]) => {
            const active = href === "/panel" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-gold text-[#24180a]" : "bg-white/5 text-white/80"}`}
              >
                {label}
                {href === "/panel/bildirimler" && unread > 0 && (
                  <span
                    className={`ml-2 inline-flex min-w-5 justify-center rounded-full px-1.5 text-xs ${active ? "bg-[#24180a] text-gold" : "bg-gold text-[#24180a]"}`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

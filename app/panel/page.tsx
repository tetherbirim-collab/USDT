"use client";

import Link from "next/link";
import { Notice } from "@/components/notice";
import { SpendChart } from "@/components/spend-chart";
import { VirtualCard } from "@/components/virtual-card";
import { remainLeft, remainMood } from "@/lib/remain";
import { formatSigned, formatTL, formatWhen } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import { last7Spend, monthSpend, monthTopup } from "@/lib/stats";
import { listCards, listNotices, listTransactions } from "@/lib/store";

export default function PanelHome() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  if (!user) return <Boot />;
  const cards = listCards(user.id);
  const txs = listTransactions(user.id);
  const notes = listNotices(user.id).slice(0, 3);
  const days = last7Spend(txs);
  const openCards = cards.filter((card) => card.status === "aktif" || card.status === "donduruldu");
  const open = cards.filter((card) => card.status !== "kapali").length;
  const tightest = openCards
    .map((card) => ({ card, left: remainLeft(card.limit, card.spent) }))
    .sort((a, b) => a.left - b.left)[0];
  const walletMood = tightest ? remainMood(tightest.left) : null;

  return (
    <div className="grid gap-6">
      <Notice code={query?.get("bildirim") || undefined} />
      <section className="relative overflow-hidden rounded-[32px] border border-gold/30 bg-gradient-to-br from-[#2a2114] via-[#14121c] to-[#0c1c1a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(240,201,138,.45),transparent_68%)]" />
        <p className="text-xs font-bold tracking-[0.22em] text-gold">CÜZDAN</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold sm:text-6xl">{formatTL(user.balance)}</h1>
        <p className="mt-2 max-w-lg text-white/70">
          Dolar bakiyesinin sabit kur karşılığı. {settings.plans?.[user.plan]?.name ?? "Plan"} planında {open}/{settings.plans?.[user.plan]?.cardLimit ?? 0} açık kart var.
        </p>
        {walletMood?.line && tightest && (
          <p className={`remain-note mt-4 max-w-lg ${walletMood.urgent ? "remain-note-hot" : ""}`}>
            {tightest.card.label}: {walletMood.line}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/panel/yukle" className="btn btn-gold">
            Bakiye yükle
          </Link>
          <Link href="/panel/kartlar/yeni" className="btn btn-ghost">
            Kart bas
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Bu ay harcama", formatTL(monthSpend(txs))],
          ["Bu ay yükleme", formatTL(monthTopup(txs))],
          ["Dondurulan", String(cards.filter((card) => card.status === "donduruldu").length)],
        ].map(([label, value]) => (
          <article key={label} className="glass rounded-[24px] p-4">
            <p className="text-sm text-white/55">{label}</p>
            <p className="font-display mt-2 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="glass rounded-[28px] p-5">
        <h2 className="font-display text-xl font-bold">Son 7 gün</h2>
        <SpendChart days={days} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Kartlarım</h2>
          <Link href="/panel/kartlar" className="text-sm font-semibold text-gold">
            Tümü
          </Link>
        </div>
        {cards.length === 0 ? (
          <div className="glass rounded-[24px] p-6">
            <p>Henüz kart yok.</p>
            <Link href="/panel/kartlar/yeni" className="btn btn-gold mt-4">
              İlk kartı bas
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {cards.slice(0, 3).map((card) => (
              <Link key={card.id} href="/panel/kartlar" className="block">
                <VirtualCard card={card} size="sm" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Son işlemler</h2>
          <Link href="/panel/islemler" className="text-sm font-semibold text-gold">
            Ödemeler
          </Link>
        </div>
        <ul className="glass divide-y divide-white/10 rounded-[24px] px-4">
          {txs.slice(0, 6).map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  {formatWhen(entry.createdAt)}
                  {entry.status === "reddedildi" ? " · Reddedildi" : ""}
                </p>
              </div>
              <p className={entry.amount > 0 ? "font-bold text-mint" : "font-semibold"}>
                {formatSigned(entry.amount)}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="glass rounded-[28px] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Bildirimler</h2>
          <Link href="/panel/bildirimler" className="text-sm font-semibold text-gold">
            Tümü
          </Link>
        </div>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">Henüz bildirim yok.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-2xl bg-black/25 px-3 py-3">
                <p className="font-semibold">{note.title}</p>
                <p className="text-sm text-white/70">{note.body}</p>
                <p className="mt-1 text-xs text-white/45">
                  {formatWhen(note.createdAt)} · {note.readAt ? "Okundu" : "Okunmadı"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

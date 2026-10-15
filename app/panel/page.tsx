import Link from "next/link";
import { Notice } from "@/components/notice";
import { VirtualCard } from "@/components/virtual-card";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/catalog";
import { formatSigned, formatTL, formatWhen } from "@/lib/format";
import { last7Spend, monthSpend, monthTopup } from "@/lib/stats";
import { listCards, listNotices, listTransactions } from "@/lib/store";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PanelHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const cards = listCards(user.id);
  const txs = listTransactions(user.id);
  const notes = listNotices(user.id).slice(0, 3);
  const days = last7Spend(txs);
  const peak = Math.max(...days.map((day) => day.total), 1);
  const open = cards.filter((card) => card.status !== "kapali").length;

  return (
    <div className="grid gap-6">
      <Notice code={one(sp.bildirim)} />
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
      <section className="relative overflow-hidden rounded-[32px] border border-gold/30 bg-gradient-to-br from-[#2a2114] via-[#14121c] to-[#0c1c1a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(240,201,138,.45),transparent_68%)]" />
        <p className="text-xs font-bold tracking-[0.22em] text-gold">SİMÜLASYON CÜZDANI</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold sm:text-6xl">{formatTL(user.balance)}</h1>
        <p className="mt-2 max-w-lg text-white/70">
          Kullanılabilir bakiye. Bu tutar gerçek para değildir. {PLANS[user.plan].name} vitrininde{" "}
          {open}/{PLANS[user.plan].cardLimit} açık kart var.
        </p>
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
        <h2 className="font-display text-xl font-bold">Son 7 gün · simüle harcama</h2>
        <div className="mt-5 flex h-36 items-end gap-2" role="img" aria-label="Son yedi günün simüle harcaması">
          {days.map((day) => (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t-xl ${day.total === 0 ? "bg-white/10" : "bg-gradient-to-t from-gold/30 to-gold"}`}
                  style={{
                    height: day.total === 0 ? "8%" : `${Math.max(18, Math.round((day.total / peak) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-white/50">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Kartlar</h2>
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
            Döküm
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
    </div>
  );
}

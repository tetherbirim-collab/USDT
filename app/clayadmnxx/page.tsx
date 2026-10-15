"use client";

import Link from "next/link";
import { ADMIN_PATH } from "@/lib/auth";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import { formatSigned, formatTL, formatWhen } from "@/lib/format";
import { KIND_LABEL } from "@/lib/catalog";
import { snapshot } from "@/lib/store";
import { Notice } from "@/components/notice";

export default function AdminHome() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;
  const db = snapshot();
  const members = db.users.filter((user) => user.role === "uye");
  const openCards = db.cards.filter((card) => card.status === "aktif" || card.status === "donduruldu");
  const openTickets = db.tickets.filter((ticket) => ticket.status === "acik");
  const latestTickets = [...db.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const latestTx = [...db.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const cards = [
    ["Üyeler", String(members.length), `${ADMIN_PATH}/uyeler`],
    ["Açık kart", String(openCards.length), `${ADMIN_PATH}/kartlar`],
    ["Açık talep", String(openTickets.length), `${ADMIN_PATH}/destek`],
    ["BIN", String(db.bins.length), `${ADMIN_PATH}/bin`],
  ] as const;
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">YÖNETİM</p>
        <h1 className="font-display text-4xl font-extrabold">Özet</h1>
        <p className="mt-2 max-w-2xl text-white/70">Her işlem kendi sekmesinde. Bu adres üye menüsünde yok.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="glass rounded-[24px] p-4">
            <p className="text-sm text-white/55">{label}</p>
            <p className="font-display mt-2 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>
      <section className="glass rounded-[28px] p-5">
        <h2 className="font-display text-2xl font-bold">Şu an geçerli</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li>Kart bedeli {formatTL(settings.issueFeeKurus)}</li>
          <li>Karta yükleme komisyonu %{String(settings.loadFeePercent).replace(".", ",")}</li>
          <li>Kartlar arası aktarım %{settings.transferFeePercent}</li>
          <li>Telegram {settings.telegram ? `@${settings.telegram}` : "yazılmadı"}</li>
          {(Object.keys(settings.plans) as (keyof typeof settings.plans)[]).map((id) => (
            <li key={id}>
              {settings.plans[id].name}: {settings.plans[id].priceUsdMinor / 100} USD · en fazla {settings.plans[id].cardLimit} kart
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Son talepler</h2>
          <Link href={`${ADMIN_PATH}/destek`} className="text-sm font-semibold text-gold">
            Destek masası
          </Link>
        </div>
        {latestTickets.length === 0 && <p className="text-sm text-white/60">Henüz talep yok.</p>}
        {latestTickets.map((ticket) => {
          const owner = db.users.find((user) => user.id === ticket.userId);
          return (
            <Link key={ticket.id} href={`${ADMIN_PATH}/destek`} className="glass rounded-[24px] px-4 py-3 text-sm">
              <p className="font-semibold">{ticket.subject}</p>
              <p className="text-white/70">{ticket.body}</p>
              <p className="mt-1 text-xs text-white/50">
                {owner?.username ?? "üye"} · {formatWhen(ticket.createdAt)} · {ticket.status === "kapandi" ? "Kapandı" : ticket.status === "yanitlandi" ? "Yanıtlandı" : "Açık"}
              </p>
            </Link>
          );
        })}
      </section>
      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Son işlemler</h2>
          <Link href={`${ADMIN_PATH}/islemler`} className="text-sm font-semibold text-gold">
            Tüm döküm
          </Link>
        </div>
        {latestTx.length === 0 && <p className="text-sm text-white/60">İşlem yok.</p>}
        {latestTx.map((entry) => {
          const owner = db.users.find((user) => user.id === entry.userId);
          return (
            <article key={entry.id} className="glass flex flex-wrap items-start justify-between gap-3 rounded-[24px] px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  {owner ? (
                    <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="text-gold">
                      {owner.username}
                    </Link>
                  ) : (
                    "üye"
                  )}
                  {" · "}
                  {KIND_LABEL[entry.kind]} · {formatWhen(entry.createdAt)}
                </p>
              </div>
              <p className={entry.amount > 0 ? "font-bold text-mint" : "font-semibold"}>{formatSigned(entry.amount)}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

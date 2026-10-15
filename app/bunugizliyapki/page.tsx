"use client";

import Link from "next/link";
import { ADMIN_PATH } from "@/lib/auth";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import { formatTL } from "@/lib/format";
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
          {(Object.keys(settings.plans) as (keyof typeof settings.plans)[]).map((id) => (
            <li key={id}>
              {settings.plans[id].name}: {settings.plans[id].priceUsdMinor / 100} USD · en fazla {settings.plans[id].cardLimit} kart
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

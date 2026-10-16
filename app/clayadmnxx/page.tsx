"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminOrderSlip } from "@/components/admin-order-slip";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES, KIND_LABEL } from "@/lib/catalog";
import { formatSigned, formatTL, formatWhen, showOrderCode } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

const REACH = [
  ["Üyeler ve bakiyeler", "Sahip, bakiye, askı.", `${ADMIN_PATH}/uyeler`],
  ["Kart ver", "Üyeyi seç, basım formuna in.", "#kart-sec"],
  ["Dondur, aç, kapat", "Kartın sahibi fişte yazar.", `${ADMIN_PATH}/kartlar`],
  ["Yükleme kayıtları", "Cüzdana giren tutarlar.", `${ADMIN_PATH}/islemler?tur=yukleme`],
  ["Aktarım", "Kayıtlar burada. Form üye sayfasında.", `${ADMIN_PATH}/islemler?tur=transfer`],
  ["Siparişler", "Clay numarası ve sahip.", `${ADMIN_PATH}/islemler#siparisler`],
  ["Çekim kuyruğu", "Bekleyen talep: gitti veya iptal.", `${ADMIN_PATH}/canli#cekim`],
  ["Destek", "Açık talebi yanıtla veya kapat.", `${ADMIN_PATH}/destek`],
  ["Bildirimler", "Üye ziline not ve duyuru.", `${ADMIN_PATH}/bildirimler`],
  ["Ücretler", "Basım, yükleme, aktarım.", `${ADMIN_PATH}/ucretler`],
  ["Planlar", "Ad, fiyat, kart hakkı.", `${ADMIN_PATH}/planlar`],
  ["BIN", "Basımda seçilen listeler.", `${ADMIN_PATH}/bin`],
  ["Telegram", "Köşe düğmesinin adresi.", `${ADMIN_PATH}/telegram`],
  ["Site yazıları", "Ana sayfa ve panel metni.", `${ADMIN_PATH}/metinler`],
] as const;

export default function AdminHome() {
  const query = useQuery();
  const [pick, setPick] = useState("");
  if (!query) return <Boot />;
  const db = snapshot();
  const members = db.users.filter((user) => user.role === "uye").sort((a, b) => a.username.localeCompare(b.username, "tr"));
  const chosen = members.some((user) => user.id === pick) ? pick : (members[0]?.id ?? "");

  const preparing = db.orders.filter((order) => order.status === "hazirlaniyor");
  const prints = [...db.orders].sort(
    (a, b) => Number(b.status === "hazirlaniyor") - Number(a.status === "hazirlaniyor") || b.createdAt.localeCompare(a.createdAt),
  );
  const waiting = db.payouts.filter((row) => row.status === "bekliyor");
  const openTickets = db.tickets.filter((ticket) => ticket.status === "acik").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const frozen = db.cards.filter((card) => card.status === "donduruldu").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const loads = [...db.transactions]
    .filter((entry) => entry.kind === "yukleme")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const transfers = [...db.transactions]
    .filter((entry) => entry.kind === "transfer")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const name = (id: string) => db.users.find((user) => user.id === id)?.username ?? "üye";
  const tiles = [
    ["Yeni basım", String(preparing.length), "#basimlar"],
    ["Bekleyen çekim", String(waiting.length), "#cekikler"],
    ["Açık talep", String(openTickets.length), "#talepler"],
    ["Dondurulmuş kart", String(frozen.length), "#donuklar"],
  ] as const;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">YÖNETİM</p>
        <h1 className="font-display text-4xl font-extrabold">Masa</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Üye paneli buradan açılır. Basım, çekim, talep ve dondurulmuş kart sahibiyle durur. İşin kendisi kendi sayfasında kalır.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value, href]) => (
          <Link key={label} href={href} className="glass rounded-[24px] p-4">
            <p className="text-sm text-white/55">{label}</p>
            <p className="font-display mt-2 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REACH.map(([title, line, href]) => (
          <Link key={title} href={href} className="glass rounded-[24px] px-4 py-3">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-white/60">{line}</p>
          </Link>
        ))}
      </section>

      <section id="kart-sec" className="glass grid gap-3 rounded-[28px] p-5 scroll-mt-24">
        <p className="text-xs font-bold tracking-[0.18em] text-gold">KART VER</p>
        <h2 className="font-display text-2xl font-bold">Üyeye kart bas</h2>
        <p className="text-sm text-white/70">Form üyenin sayfasında. Yalnız basım ücreti o bakiyeden düşer. Kart 0 bakiye ile açılır. Plan hakkı doluysa basım olmaz.</p>
        {members.length === 0 ? (
          <p className="text-sm text-white/55">Henüz üye yok.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm">
              Üye
              <select className="field w-56" value={chosen} onChange={(event) => setPick(event.target.value)}>
                {members.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </label>
            <Link href={`${ADMIN_PATH}/kullanici?id=${chosen}#kart-ver`} className="btn btn-gold">
              Kart verme sayfasına git
            </Link>
          </div>
        )}
      </section>

      <section id="basimlar" className="grid gap-3 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Basımlar</h2>
          <Link href={`${ADMIN_PATH}/islemler#siparisler`} className="text-sm font-semibold text-gold">
            Tüm siparişler
          </Link>
        </div>
        {prints.length === 0 && <p className="text-sm text-white/60">Henüz sipariş yok.</p>}
        {prints.slice(0, 4).map((order) => (
          <AdminOrderSlip key={order.id} order={order} />
        ))}
      </section>

      <section id="cekikler" className="grid gap-3 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Bekleyen çekimler</h2>
          <Link href={`${ADMIN_PATH}/canli#cekim`} className="text-sm font-semibold text-gold">
            Gitti veya iptal
          </Link>
        </div>
        {waiting.length === 0 && <p className="text-sm text-white/60">Bekleyen talep yok. Üye çekimi yerelde beklemeye yazılır.</p>}
        {waiting.map((row) => (
          <article key={row.id} className="glass rounded-[24px] px-4 py-3 text-sm">
            <p className="font-semibold">{formatTL(row.amount)}</p>
            <p className="text-white/70">
              {row.wallet}
              {row.coin ? ` · ${row.coin === "xmr" ? "XMR" : row.coin.toUpperCase()}` : ""}
            </p>
            <p className="mt-1 text-xs text-white/50">
              <Link href={`${ADMIN_PATH}/kullanici?id=${row.userId}`} className="font-semibold text-gold">
                {name(row.userId)}
              </Link>
              {" · "}
              {formatWhen(row.createdAt)} · bekliyor
            </p>
          </article>
        ))}
      </section>

      <section id="talepler" className="grid gap-3 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Açık talepler</h2>
          <Link href={`${ADMIN_PATH}/destek`} className="text-sm font-semibold text-gold">
            Destek masası
          </Link>
        </div>
        {openTickets.length === 0 && <p className="text-sm text-white/60">Açık talep yok.</p>}
        {openTickets.slice(0, 5).map((ticket) => (
          <Link key={ticket.id} href={`${ADMIN_PATH}/destek`} className="glass rounded-[24px] px-4 py-3 text-sm">
            <p className="font-semibold">{ticket.subject}</p>
            <p className="text-white/70">{ticket.body}</p>
            <p className="mt-1 text-xs text-white/50">
              <span className="font-semibold text-gold">{name(ticket.userId)}</span>
              {" · "}
              {formatWhen(ticket.createdAt)} · Açık
            </p>
          </Link>
        ))}
      </section>

      <section id="donuklar" className="grid gap-3 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Dondurulmuş kartlar</h2>
          <Link href={`${ADMIN_PATH}/kartlar?sekme=donuk`} className="text-sm font-semibold text-gold">
            Kartlar
          </Link>
        </div>
        {frozen.length === 0 && <p className="text-sm text-white/60">Dondurulmuş kart yok.</p>}
        {frozen.slice(0, 6).map((card) => {
          const order = db.orders.find((row) => row.cardId === card.id);
          const code = showOrderCode(order ?? { cardId: card.id, id: card.id });
          return (
            <Link key={card.id} href={`${ADMIN_PATH}/kartlar?sekme=donuk&vurgu=${card.id}`} className="order-slip">
              <p className="order-slip-code text-3xl">{code}</p>
              <p className="order-slip-phrase">
                numaralı sipariş · <span className="order-slip-owner text-gold">{name(card.userId)}</span>
              </p>
              <p className="mt-2 text-sm text-white/70">
                {card.label} · {CARD_TYPES[card.type].name} · {formatTL(card.spent)} / {formatTL(card.limit)}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Son yüklemeler</h2>
            <Link href={`${ADMIN_PATH}/islemler?tur=yukleme`} className="text-sm font-semibold text-gold">
              Tümü
            </Link>
          </div>
          {loads.length === 0 && <p className="text-sm text-white/60">Yükleme yok.</p>}
          {loads.map((entry) => (
            <article key={entry.id} className="glass flex items-start justify-between gap-3 rounded-[24px] px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  <Link href={`${ADMIN_PATH}/kullanici?id=${entry.userId}`} className="font-semibold text-gold">
                    {name(entry.userId)}
                  </Link>
                  {" · "}
                  {KIND_LABEL[entry.kind]} · {formatWhen(entry.createdAt)}
                </p>
              </div>
              <p className="font-bold text-mint">{formatSigned(entry.amount)}</p>
            </article>
          ))}
        </article>
        <article className="grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Son aktarımlar</h2>
            <Link href={`${ADMIN_PATH}/islemler?tur=transfer`} className="text-sm font-semibold text-gold">
              Tümü
            </Link>
          </div>
          {transfers.length === 0 && <p className="text-sm text-white/60">Aktarım yok.</p>}
          {transfers.map((entry) => (
            <article key={entry.id} className="glass flex items-start justify-between gap-3 rounded-[24px] px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  <Link href={`${ADMIN_PATH}/kullanici?id=${entry.userId}#aktarim`} className="font-semibold text-gold">
                    {name(entry.userId)}
                  </Link>
                  {" · "}
                  {formatWhen(entry.createdAt)}
                </p>
              </div>
              <p className={entry.amount > 0 ? "font-bold text-mint" : "font-semibold"}>{formatSigned(entry.amount)}</p>
            </article>
          ))}
        </article>
      </section>

      <section className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Bakiyeler</h2>
          <Link href={`${ADMIN_PATH}/uyeler`} className="text-sm font-semibold text-gold">
            Üye listesi
          </Link>
        </div>
        {members.slice(0, 8).map((user) => (
          <Link key={user.id} href={`${ADMIN_PATH}/kullanici?id=${user.id}#bakiye`} className="glass flex items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-sm">
            <span className="font-semibold text-gold">{user.username}</span>
            <span className="font-display text-xl font-bold">{formatTL(user.balance)}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

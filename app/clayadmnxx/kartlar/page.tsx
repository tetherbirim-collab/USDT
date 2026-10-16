"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminCardOps } from "@/components/admin-member-tools";
import { adminCardAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL, showOrderCode } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";
import type { Card } from "@/lib/types";

const STATUS_LABEL = {
  hazirlaniyor: "Hazırlanıyor",
  aktif: "Aktif",
  donduruldu: "Donduruldu",
  kapali: "Kapalı",
} as const;

const TABS = [
  ["acik", "Açık"],
  ["donuk", "Dondurulmuş"],
  ["kapali", "Kapanmış"],
] as const;

export default function AdminCardsPage() {
  const query = useQuery();
  const highlight = query?.get("vurgu") ?? null;
  const sekme = query?.get("sekme") ?? null;
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("acik");
  const [ask, setAsk] = useState<string | null>(null);
  useEffect(() => {
    const card = highlight ? snapshot().cards.find((row) => row.id === highlight) : undefined;
    if (card?.status === "donduruldu") setTab("donuk");
    else if (card?.status === "kapali") setTab("kapali");
    else if (card) setTab("acik");
    else if (sekme === "donuk" || sekme === "kapali" || sekme === "acik") setTab(sekme);
  }, [highlight, sekme]);
  useEffect(() => {
    if (!highlight) return;
    document.getElementById(highlight)?.scrollIntoView({ block: "center" });
  }, [highlight, tab]);
  if (!query) return <Boot />;
  const db = snapshot();
  const rank = { hazirlaniyor: 0, aktif: 1, donduruldu: 2, kapali: 3 };
  const cards = [...db.cards].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">KARTLAR</p>
        <h1 className="font-display text-4xl font-extrabold">Kartlar</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Açık, dondurulmuş ve kapanmış kartlar ayrı sekmede durur. Üye panelinde aktifleştirmek kart bedeli kadar düşer. Buradaki aktif et ücret yazmaz.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="card-tabs" role="tablist" aria-label="Kart durumları">
        {TABS.map(([id, title]) => {
          const count =
            id === "acik"
              ? cards.filter((card) => card.status === "aktif" || card.status === "hazirlaniyor").length
              : id === "donuk"
                ? cards.filter((card) => card.status === "donduruldu").length
                : cards.filter((card) => card.status === "kapali").length;
          return (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className="card-tab" onClick={() => setTab(id)}>
              {title} {count}
            </button>
          );
        })}
      </div>
      {(() => {
        const rows: Card[] =
          tab === "acik"
            ? cards.filter((card) => card.status === "aktif" || card.status === "hazirlaniyor")
            : tab === "donuk"
              ? cards.filter((card) => card.status === "donduruldu")
              : cards.filter((card) => card.status === "kapali");
        if (rows.length === 0) return <p className="text-sm text-white/50">Bu sekmede kart yok.</p>;
        return rows.map((card) => {
          const owner = db.users.find((user) => user.id === card.userId);
          const order = db.orders.find((row) => row.cardId === card.id);
          const code = showOrderCode(order ?? { cardId: card.id, id: card.id });
          return (
            <article
              key={card.id}
              id={card.id}
              className={`order-slip scroll-mt-24 ${highlight === card.id ? "ring-2 ring-gold" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="order-slip-kicker">{STATUS_LABEL[card.status]}</p>
                <p className="order-slip-code">{code}</p>
                <p className="order-slip-phrase">
                  numaralı sipariş ·{" "}
                  {owner ? (
                    <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="text-gold">
                      {owner.username}
                    </Link>
                  ) : (
                    "üye"
                  )}
                </p>
                <p className="mt-2 font-semibold">{card.label}</p>
                <p className="text-xs text-white/55">
                  {CARD_TYPES[card.type].name} · BIN {card.bin} · •••• {String(card.pan ?? "").slice(-4)} · {formatTL(card.spent)} / {formatTL(card.limit)}
                </p>
              </div>
              {card.status === "aktif" && ask !== card.id && (
                <button type="button" className="btn btn-ghost" onClick={() => setAsk(card.id)}>
                  Kartı dondur
                </button>
              )}
              {card.status === "aktif" && ask === card.id && (
                <form action={adminCardAction} className="grid gap-2">
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="mod" value="dondur" />
                  <p className="text-xs font-semibold">Emin misin? Kart dondurulmuş sekmeye gider.</p>
                  <div className="flex gap-2">
                    <button className="btn btn-gold">Evet, dondur</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>
                      Vazgeç
                    </button>
                  </div>
                </form>
              )}
              {card.status === "donduruldu" && (
                <form action={adminCardAction}>
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="mod" value="coz" />
                  <button className="btn btn-gold">Kartı aktif et</button>
                </form>
              )}
              <AdminCardOps cardId={card.id} userId={card.userId} status={card.status} back={`${ADMIN_PATH}/kartlar`} />
              </div>
            </article>
          );
        });
      })()}
    </div>
  );
}

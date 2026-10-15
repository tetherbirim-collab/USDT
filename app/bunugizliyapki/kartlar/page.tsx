"use client";

import Link from "next/link";
import { useState } from "react";
import { adminCardAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
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
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("acik");
  const [ask, setAsk] = useState<string | null>(null);
  if (!query) return <Boot />;
  const highlight = query.get("vurgu");
  const db = snapshot();
  const cards = [...db.cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
          return (
            <article
              key={card.id}
              className={`glass flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-4 ${highlight === card.id ? "ring-2 ring-gold" : ""}`}
            >
              <div>
                <p className="font-semibold">{card.label}</p>
                <p className="text-xs text-white/55">
                  {CARD_TYPES[card.type].name} · BIN {card.bin} · •••• {card.pan.slice(-4)} · {STATUS_LABEL[card.status]}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {formatTL(card.spent)} / {formatTL(card.limit)}
                  {owner ? (
                    <>
                      {" · "}
                      <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="text-gold underline decoration-gold/40">
                        {owner.username}
                      </Link>
                    </>
                  ) : null}
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
            </article>
          );
        });
      })()}
    </div>
  );
}

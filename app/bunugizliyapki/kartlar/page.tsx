"use client";

import Link from "next/link";
import { adminCardAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

const STATUS_LABEL = {
  hazirlaniyor: "Hazırlanıyor",
  aktif: "Aktif",
  donduruldu: "Donduruldu",
  kapali: "Kapalı",
} as const;

export default function AdminCardsPage() {
  const query = useQuery();
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
          Dondurulan kart harcama yapamaz. Aktif et, harcamayı yeniden açar. Ad, tavan ve durum üye detayından yazılır.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="grid gap-3">
        {cards.map((card) => {
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
              {card.status === "aktif" && (
                <form action={adminCardAction}>
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="mod" value="dondur" />
                  <button className="btn btn-ghost">Kartı dondur</button>
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
        })}
        {cards.length === 0 && <p className="text-sm text-white/50">Kart yok.</p>}
      </div>
    </div>
  );
}

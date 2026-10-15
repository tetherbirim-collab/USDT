"use client";

import { useEffect, useState } from "react";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { touchLedger } from "@/lib/store";
import type { Card } from "@/lib/types";

export function OrderSlip({ card }: { card: Card }) {
  const ready = card.readyAt ? Date.parse(card.readyAt) : Date.now();
  const [left, setLeft] = useState(() => Math.max(0, ready - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, ready - Date.now());
      setLeft(next);
      if (next === 0) touchLedger();
    }, 500);
    return () => clearInterval(timer);
  }, [ready]);

  const seconds = Math.ceil(left / 1000);
  return (
    <div className="rounded-2xl border border-gold/40 bg-black/25 p-4">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">SİPARİŞ</p>
      <p className="font-display mt-1 text-2xl font-bold">{card.label}</p>
      <p className="mt-1 text-sm text-white/70">
        {CARD_TYPES[card.type].name} · tavan {formatTL(card.limit)}
      </p>
      <p className="mt-2 font-mono text-xs text-white/55">Sipariş no {card.id}</p>
      <p className="mt-2 text-sm text-white/75">
        Basım ücreti {formatTL(CARD_TYPES[card.type].fee)} deftere yazıldı. Bu bir simülasyon fişidir.
      </p>
      <p className="mt-3 font-semibold text-gold">
        {seconds > 0 ? `Hazırlanıyor · ${seconds} sn` : "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz."}
      </p>
    </div>
  );
}

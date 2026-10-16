"use client";

import { useEffect, useState } from "react";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL, showOrderCode } from "@/lib/format";
import { useUser } from "@/lib/live";
import { orderForCard, touchLedger } from "@/lib/store";
import type { Card } from "@/lib/types";

export function OrderSlip({ card }: { card: Card }) {
  const owner = useUser();
  const order = orderForCard(card.id);
  const code = showOrderCode(order ?? { cardId: card.id, id: card.id });
  const fee = order?.fee ?? CARD_TYPES[card.type]?.fee ?? 0;
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
  const name = CARD_TYPES[card.type]?.name ?? "Kart";
  return (
    <article className="order-slip">
      <p className="order-slip-kicker">SİPARİŞ</p>
      <p className="order-slip-code">{code}</p>
      <p className="order-slip-phrase">numaralı sipariş</p>
      <p className="order-slip-owner">{owner?.username || "Üye"}</p>
      <div className="order-slip-row">
        <span>{name}</span>
        <span>{card.label}</span>
      </div>
      <div className="order-slip-row">
        <span>Kullanılabilir bakiye</span>
        <span>{formatTL(card.limit)}</span>
      </div>
      <div className="order-slip-row">
        <span>Basım ücreti</span>
        <span>{formatTL(fee)}</span>
      </div>
      <p className="order-slip-wait">
        {seconds > 0 ? `Hazırlanıyor · ${seconds} sn` : "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz."}
      </p>
    </article>
  );
}

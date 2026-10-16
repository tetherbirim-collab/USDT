"use client";

import { useEffect, useState } from "react";
import { GlassOrderCard } from "@/components/glass-order-card";
import { showOrderCode } from "@/lib/format";
import { useUser } from "@/lib/live";
import { orderForCard, touchLedger } from "@/lib/store";
import type { Card } from "@/lib/types";

export function OrderSlip({ card }: { card: Card }) {
  const owner = useUser();
  const order = orderForCard(card.id);
  const code = showOrderCode(order ?? { cardId: card.id, id: card.id });
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
    <GlassOrderCard
      type={card.type}
      label={card.label}
      code={code}
      owner={owner?.username || "Üye"}
      status={seconds > 0 ? "hazirlaniyor" : "hazir"}
      seconds={seconds}
    />
  );
}

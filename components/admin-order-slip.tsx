"use client";

import Link from "next/link";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL, formatWhen, showOrderCode } from "@/lib/format";
import { snapshot } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

const LABEL: Record<OrderStatus, string> = {
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
  iptal: "İptal",
};

export function AdminOrderSlip({ order }: { order: Order }) {
  const db = snapshot();
  const owner = db.users.find((user) => user.id === order.userId);
  const code = showOrderCode(order);
  return (
    <article className="order-slip">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="order-slip-kicker">SİPARİŞ</p>
          <p className="order-slip-code">{code}</p>
          <p className="order-slip-phrase">
            numaralı sipariş ·{" "}
            {owner ? (
              <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="order-slip-owner text-gold">
                {owner.username}
              </Link>
            ) : (
              <span className="order-slip-owner">üye</span>
            )}
          </p>
          <p className="mt-3 font-display text-2xl font-bold">{order.label}</p>
          <p className="text-sm text-white/65">
            {CARD_TYPES[order.type]?.name ?? "Kart"} · {LABEL[order.status]} · kullanılabilir bakiye {formatTL(order.limit)}
          </p>
          <p className="mt-1 text-sm text-white/70">Basım ücreti {formatTL(order.fee)}</p>
          <p className="text-xs text-white/45">{formatWhen(order.createdAt)}</p>
          {order.status === "hazir" && (
            <p className="mt-2 text-sm font-semibold text-mint">Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.</p>
          )}
        </div>
        <Link href={`${ADMIN_PATH}/kartlar?vurgu=${order.cardId}`} className="btn btn-ghost">
          Karta git
        </Link>
      </div>
    </article>
  );
}

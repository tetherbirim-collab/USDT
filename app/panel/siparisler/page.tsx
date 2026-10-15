"use client";

import { cancelOrderAction } from "@/lib/actions";
import { DeskArrival } from "@/components/desk-arrival";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL, formatWhen } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listOrders } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import Link from "next/link";

const LABEL: Record<OrderStatus, string> = {
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
  iptal: "İptal",
};

export default function OrdersPage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;
  const orders = listOrders(user.id);

  return (
    <div className="grid gap-5">
      <DeskArrival
        tone="orders"
        kicker="SİPARİŞLER"
        title="Basım siparişleri"
        line="Hazırlanan, teslim edilen ve iptal edilen kartlar burada durur."
      />
      <Notice code={query.get("bildirim") || undefined} />
      {orders.length === 0 ? (
        <p className="glass rounded-[24px] p-5 text-white/70">Henüz sipariş yok.</p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="glass rounded-[24px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold">{order.label}</p>
                  <p className="text-sm text-white/65">
                    {CARD_TYPES[order.type].name} · {LABEL[order.status]} · kullanılabilir bakiye {formatTL(order.limit)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/45">Sipariş no {order.id}</p>
                  <p className="mt-1 text-sm text-white/70">Basım ücreti {formatTL(order.fee)}</p>
                  <p className="text-xs text-white/45">{formatWhen(order.createdAt)}</p>
                  {order.status === "hazir" && (
                    <p className="mt-2 text-sm font-semibold text-mint">
                      Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/panel/kartlar#${order.cardId}`} className="btn btn-ghost">
                    Karta git
                  </Link>
                  {order.status === "hazirlaniyor" && (
                    <form action={cancelOrderAction}>
                      <input type="hidden" name="id" value={order.cardId} />
                      <SubmitButton className="btn btn-danger">Siparişi iptal et</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { cancelOrderAction, clearCancelledOrderAction } from "@/lib/actions";
import { DeskArrival } from "@/components/desk-arrival";
import { GlassOrderCard } from "@/components/glass-order-card";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { showOrderCode } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listOrders } from "@/lib/store";
import Link from "next/link";

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
        <ul className="order-board">
          {orders.map((order) => {
            const code = showOrderCode(order);
            return (
              <li key={order.id} className="order-board-item">
                <GlassOrderCard type={order.type} label={order.label} code={code} owner={user.username} status={order.status} />
                <div className="order-board-actions">
                  <Link href={`/panel/kartlar#${order.cardId}`} className="btn btn-ghost">
                    Karta git
                  </Link>
                  {order.status === "hazirlaniyor" && (
                    <form action={cancelOrderAction}>
                      <input type="hidden" name="id" value={order.cardId} />
                      <SubmitButton className="btn btn-danger">Siparişi iptal et</SubmitButton>
                    </form>
                  )}
                  {order.status === "iptal" && (
                    <form action={clearCancelledOrderAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={order.cardId} />
                      <label className="flex items-center gap-2 text-xs text-white/70">
                        <input type="checkbox" name="onay" value="on" required />
                        Kapalı kartla birlikte sil
                      </label>
                      <SubmitButton className="btn btn-ghost">Listeden kaldır</SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

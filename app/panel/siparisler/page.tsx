import { cancelOrderAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { formatTL, formatWhen } from "@/lib/format";
import { listOrders } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const LABEL: Record<OrderStatus, string> = {
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
  iptal: "İptal",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const orders = listOrders(user.id);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">SİPARİŞLER</p>
        <h1 className="font-display text-4xl font-extrabold">Basım siparişleri</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Hazırlanan, teslim edilen ve iptal edilen kartlar burada durur. Ücret simülasyondur.
        </p>
      </div>
      <Notice code={one(sp.bildirim)} />
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
                    {CARD_TYPES[order.type].name} · {LABEL[order.status]} · tavan {formatTL(order.limit)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/45">Sipariş no {order.id}</p>
                  <p className="mt-1 text-sm text-white/70">Basım ücreti {formatTL(order.fee)}</p>
                  <p className="text-xs text-white/45">{formatWhen(order.createdAt)}</p>
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

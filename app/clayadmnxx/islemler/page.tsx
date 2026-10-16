"use client";

import Link from "next/link";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatSigned, formatTL, formatWhen, showOrderCode } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

const ORDER_STATUS = {
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
  iptal: "İptal",
} as const;

export default function AdminLedgerPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const db = snapshot();
  const txs = [...db.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const name = (id: string) => db.users.find((user) => user.id === id)?.username ?? "üye";

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">İŞLEMLER</p>
        <h1 className="font-display text-4xl font-extrabold">Tüm hareket</h1>
        <p className="mt-2 max-w-2xl text-white/70">Yükleme, harcama, aktarım, basım ve plan ücreti her üyeden buraya düşer. Siparişler aynı sayfanın altında durur.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <section className="grid gap-2">
        {txs.length === 0 && <p className="text-sm text-white/55">İşlem yok.</p>}
        {txs.map((entry) => (
          <article key={entry.id} className="glass flex flex-wrap items-start justify-between gap-3 rounded-[24px] px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">{entry.title}</p>
              <p className="text-xs text-white/50">
                <Link href={`${ADMIN_PATH}/kullanici?id=${entry.userId}`} className="text-gold">
                  {name(entry.userId)}
                </Link>
                {" · "}
                {KIND_LABEL[entry.kind]} · {formatWhen(entry.createdAt)}
                {entry.status === "reddedildi" ? " · Reddedildi" : ""}
              </p>
              {entry.note ? <p className="mt-1 text-white/70">{entry.note}</p> : null}
            </div>
            <p className={entry.amount > 0 ? "font-bold text-mint" : "font-semibold"}>{formatSigned(entry.amount)}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-bold">Siparişler</h2>
        {orders.length === 0 && <p className="text-sm text-white/55">Sipariş yok.</p>}
        {orders.map((order) => {
          const code = showOrderCode(order);
          return (
          <article key={order.id} className="order-slip">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="order-slip-kicker">{ORDER_STATUS[order.status]}</p>
                <p className="order-slip-code">{code}</p>
                <p className="order-slip-phrase">
                  numaralı sipariş ·{" "}
                  <Link href={`${ADMIN_PATH}/kullanici?id=${order.userId}`} className="text-gold">
                    {name(order.userId)}
                  </Link>
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {order.label} · {formatWhen(order.createdAt)}
                </p>
              </div>
              <p className="font-semibold">Basım {formatTL(order.fee)}</p>
            </div>
          </article>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminOrderSlip } from "@/components/admin-order-slip";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatSigned, formatWhen } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";
import type { TxKind } from "@/lib/types";

const FILTERS = [
  ["", "Tümü"],
  ["yukleme", "Yüklemeler"],
  ["transfer", "Aktarımlar"],
  ["basim", "Basımlar"],
  ["harcama", "Harcamalar"],
] as const;

export default function AdminLedgerPage() {
  const query = useQuery();
  const asked = query?.get("tur") ?? "";
  const [kind, setKind] = useState<"" | TxKind>("");
  useEffect(() => {
    if (asked === "yukleme" || asked === "transfer" || asked === "basim" || asked === "harcama" || asked === "iade" || asked === "duzeltme" || asked === "yenileme") {
      setKind(asked);
    }
  }, [asked]);
  if (!query) return <Boot />;
  const db = snapshot();
  const txs = [...db.transactions]
    .filter((entry) => (kind ? entry.kind === kind : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const name = (id: string) => db.users.find((user) => user.id === id)?.username ?? "üye";

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">İŞLEMLER</p>
        <h1 className="font-display text-4xl font-extrabold">Tüm hareket</h1>
        <p className="mt-2 max-w-2xl text-white/70">Yükleme, harcama, aktarım ve basım her üyeden buraya düşer. Sipariş fişi Clay numarası ve sahibiyle altta durur.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([id, label]) => (
          <button key={label} type="button" className={`nav-pill rounded-full px-3 py-2 text-sm font-bold ${kind === id ? "nav-on" : "bg-white/5 text-white/80"}`} onClick={() => setKind(id)}>
            {label}
          </button>
        ))}
        <Link href={`${ADMIN_PATH}/canli#cekim`} className="nav-pill rounded-full bg-white/5 px-3 py-2 text-sm font-bold text-white/80">
          Çekim kuyruğu
        </Link>
      </div>
      <section id="hareket" className="grid gap-2 scroll-mt-24">
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
      <section id="siparisler" className="grid gap-3 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Siparişler</h2>
        {orders.length === 0 && <p className="text-sm text-white/55">Sipariş yok.</p>}
        {orders.map((order) => (
          <AdminOrderSlip key={order.id} order={order} />
        ))}
      </section>
    </div>
  );
}

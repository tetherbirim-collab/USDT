"use client";

import { useState } from "react";
import type { PaymentRow } from "@/lib/payments";

const TONE: Record<PaymentRow["tone"], string> = {
  ok: "bg-[#d8ffe8] text-[#123226]",
  hold: "bg-[#ffe3bf] text-[#3a2508]",
  bad: "bg-[#ffd0d4] text-[#4a1520]",
  mute: "bg-white/10 text-white/70",
  refund: "bg-[#efe4ff] text-[#2d1848]",
  cash: "bg-[#ffd9f4] text-[#4a1840]",
};

function StatusPill({ tone, label }: { tone: PaymentRow["tone"]; label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${TONE[tone]}`}>{label}</span>;
}

function CardLine({ row, pro }: { row: PaymentRow; pro: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold">{row.cardLabel}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
        {row.network && <span className="font-bold tracking-wide text-white/70">{row.network}</span>}
        {pro && row.last4 && <span className="font-mono">···· {row.last4}</span>}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{row.typeName}</span>
      </p>
    </div>
  );
}

export function PaymentsBoard({ rows }: { rows: PaymentRow[] }) {
  const [pro, setPro] = useState(true);

  return (
    <section className="grid gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          role="switch"
          aria-checked={pro}
          onClick={() => setPro((value) => !value)}
          className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-2"
        >
          <span className="text-xs font-bold tracking-[0.18em] text-white/70">PRO</span>
          <span className={`relative h-6 w-11 rounded-full transition ${pro ? "bg-mint" : "bg-white/15"}`}>
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-[#10241f] transition ${pro ? "left-6" : "left-1"}`}
            />
          </span>
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-white/65">Bu süzgeçte hareket yok.</p>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
          <div className="hidden grid-cols-[0.8fr_1.15fr_1.5fr_0.8fr_0.7fr] gap-3 px-5 py-3 text-[11px] font-bold tracking-[0.16em] text-white/40 md:grid">
            <span>Tarih</span>
            <span>Kart</span>
            <span>Ödeme</span>
            <span className="text-right">Miktar</span>
            <span className="text-right">Durum</span>
          </div>
          <ul className="divide-y divide-white/8">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-4 md:px-5">
                <div className="grid gap-3 md:grid-cols-[0.8fr_1.15fr_1.5fr_0.8fr_0.7fr] md:items-center">
                  <div>
                    <p className="font-semibold">{row.day}</p>
                    {pro && <p className="text-xs text-white/40">{row.when.split(" ").slice(-1)}</p>}
                  </div>
                  <CardLine row={row} pro={pro} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.title}</p>
                    {pro && row.detail && <p className="mt-1 truncate text-xs text-white/45">{row.detail}</p>}
                  </div>
                  <p
                    className={`font-bold tabular-nums md:text-right ${row.rejected ? "text-white/35 line-through" : row.incoming ? "text-mint" : "text-white"}`}
                  >
                    {row.amountLabel}
                  </p>
                  <div className="md:text-right">
                    <StatusPill tone={row.tone} label={row.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

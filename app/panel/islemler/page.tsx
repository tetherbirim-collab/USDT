"use client";

import Link from "next/link";
import { Notice } from "@/components/notice";
import { PaymentsBoard } from "@/components/payments-board";
import { KIND_LABEL } from "@/lib/catalog";
import { formatTL, formatWhen } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import {
  PAY_TILES,
  bucketTotals,
  filterLedger,
  payStatusLabel,
  paymentHref,
  paymentQueryFrom,
  presentPayments,
  type PaymentQuery,
} from "@/lib/payments";
import { listCards, listTransactions } from "@/lib/store";
import type { TxKind } from "@/lib/types";
import { workbookXlsx } from "@/lib/xlsx";

const KINDS = Object.keys(KIND_LABEL) as TxKind[];

function saveFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function cell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(userId: string, query: PaymentQuery) {
  const cards = new Map(listCards(userId).map((card) => [card.id, card]));
  const lines = ["tarih;tür;başlık;kart;tl;durum;not"];
  for (const entry of filterLedger(listTransactions(userId), query)) {
    const card = entry.cardId ? cards.get(entry.cardId) : undefined;
    lines.push(
      [
        cell(formatWhen(entry.createdAt)),
        cell(KIND_LABEL[entry.kind]),
        cell(entry.title),
        cell(card ? `${card.label} ···· ${card.pan.slice(-4)}` : ""),
        (entry.amount / 100).toFixed(2),
        cell(payStatusLabel(entry)),
        cell(entry.note),
      ].join(";"),
    );
  }
  saveFile("clay-odemeler.csv", new Blob([`\uFEFF${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" }));
}

function downloadXlsx(userId: string, query: PaymentQuery) {
  const cards = new Map(listCards(userId).map((card) => [card.id, card]));
  const rows = [
    ["Tarih", "Kart", "Son dört", "Ödeme", "TL karşılığı", "Durum", "Not"],
    ...filterLedger(listTransactions(userId), query).map((entry) => {
      const card = entry.cardId ? cards.get(entry.cardId) : undefined;
      return [
        formatWhen(entry.createdAt),
        card?.label ?? "Cüzdan",
        card ? card.pan.slice(-4) : "",
        entry.title,
        (entry.amount / 100).toFixed(2),
        payStatusLabel(entry),
        entry.note,
      ];
    }),
  ];
  const bytes = workbookXlsx(rows);
  saveFile(
    "clay-odemeler.xlsx",
    new Blob([bytes.slice()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
}

export default function PaymentsPage() {
  const user = useUser();
  const sp = useQuery();
  if (!user || !sp) return <Boot />;
  const query = paymentQueryFrom({
    tur: sp.get("tur") || "",
    durum: sp.get("durum") || "",
    kart: sp.get("kart") || "",
    q: sp.get("q") || "",
    bas: sp.get("bas") || "",
    bit: sp.get("bit") || "",
    enaz: sp.get("enaz") || "",
    encok: sp.get("encok") || "",
  });
  const cards = listCards(user.id);
  const all = listTransactions(user.id);
  const rows = filterLedger(all, query);
  const totals = bucketTotals(all);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">HAREKET</p>
          <h1 className="font-display text-4xl font-extrabold">Ödemeler</h1>
          <p className="mt-2 max-w-xl text-white/65">
            Her harcamanın gittiği yer burada durur. Tutarlar, doların sabit kur karşılığıdır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost px-3 py-2 text-sm" onClick={() => downloadCsv(user.id, query)}>
            Dışa aktar
          </button>
          <button type="button" className="btn btn-ghost px-3 py-2 text-sm" onClick={() => downloadCsv(user.id, query)}>
            CSV
          </button>
          <button type="button" className="btn btn-ghost px-3 py-2 text-sm" onClick={() => downloadXlsx(user.id, query)}>
            XLSX
          </button>
        </div>
      </div>
      <Notice code={sp.get("bildirim") || undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAY_TILES.map((tile) => {
          const active = query.durum === tile.id;
          const href = paymentHref("/panel/islemler", query, { durum: active ? "" : tile.id });
          return (
            <Link
              key={tile.id}
              href={href}
              className={`overflow-hidden rounded-[24px] border bg-white/[0.04] p-4 transition ${active ? "border-gold shadow-[0_0_0_1px_rgba(240,201,138,0.35)]" : "border-white/10 hover:border-white/25"}`}
            >
              <p className={`text-sm font-bold ${tile.tone === "ok" ? "text-mint" : tile.tone === "bad" ? "text-[#ffb4c0]" : tile.tone === "hold" ? "text-gold" : tile.tone === "refund" ? "text-[#e6d4ff]" : tile.tone === "cash" ? "text-[#ffc6ee]" : "text-white/70"}`}>
                {tile.label}
              </p>
              <p className="mt-3 truncate font-display text-3xl font-extrabold tracking-tight">{formatTL(totals[tile.id])}</p>
            </Link>
          );
        })}
      </div>
      <form action="/panel/islemler/" className="flex flex-wrap items-end gap-2">
        {query.durum && <input type="hidden" name="durum" value={query.durum} />}
        <label className="grid gap-1 text-xs text-white/55">
          Tür
          <select className="field w-40" name="tur" defaultValue={query.tur}>
            <option value="">Tümü</option>
            <option value="reddedilen">Reddedilen</option>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-white/55">
          Kart
          <select className="field w-44" name="kart" defaultValue={query.kart}>
            <option value="">Tüm kartlar</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-white/55">
          Ara
          <input className="field w-44" name="q" defaultValue={query.q} placeholder="Nereye gitti" />
        </label>
        <label className="grid gap-1 text-xs text-white/55">
          Başlangıç
          <input className="field w-40" type="date" name="bas" defaultValue={query.bas} />
        </label>
        <label className="grid gap-1 text-xs text-white/55">
          Bitiş
          <input className="field w-40" type="date" name="bit" defaultValue={query.bit} />
        </label>
        <button className="btn btn-gold px-4 py-2">Süz</button>
        <Link href="/panel/islemler" className="btn btn-ghost px-4 py-2">
          Temizle
        </Link>
      </form>
      <PaymentsBoard rows={presentPayments(rows, cards)} />
      {Object.values(query).some(Boolean) && (
        <p className="text-xs text-white/40">{rows.length} hareket süzgeçte. Kutular tüm defterin özetidir.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { Notice } from "@/components/notice";
import { PaymentsBoard } from "@/components/payments-board";
import { getCurrentUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import {
  PAY_TILES,
  bucketTotals,
  filterLedger,
  paymentHref,
  paymentQueryFrom,
  presentPayments,
} from "@/lib/payments";
import { listCards, listTransactions } from "@/lib/store";
import type { TxKind } from "@/lib/types";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const KINDS = Object.keys(KIND_LABEL) as TxKind[];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const query = paymentQueryFrom({
    tur: one(sp.tur),
    durum: one(sp.durum),
    kart: one(sp.kart),
    q: one(sp.q),
    bas: one(sp.bas),
    bit: one(sp.bit),
    enaz: one(sp.enaz),
    encok: one(sp.encok),
  });
  const cards = listCards(user.id);
  const all = listTransactions(user.id);
  const rows = filterLedger(all, query);
  const totals = bucketTotals(all);
  const csvHref = paymentHref("/panel/islemler/dokum", query);
  const xlsxHref = paymentHref("/panel/islemler/xlsx", query);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">HAREKET</p>
          <h1 className="font-display text-4xl font-extrabold">Ödemeler</h1>
          <p className="mt-2 max-w-xl text-white/65">
            Her harcamanın gittiği yer burada durur. Kayıtlar bu hesabın simülasyon defterindendir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={csvHref} className="btn btn-ghost px-3 py-2 text-sm">
            Dışa aktar
          </a>
          <a href={csvHref} className="btn btn-ghost px-3 py-2 text-sm">
            CSV
          </a>
          <a href={xlsxHref} className="btn btn-ghost px-3 py-2 text-sm">
            XLSX
          </a>
        </div>
      </div>
      <Notice code={one(sp.bildirim)} />
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
      <form action="/panel/islemler" className="flex flex-wrap items-end gap-2">
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

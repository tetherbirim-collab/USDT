"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cancelOrderAction, closeAction, freezeAction, refundAction, renewAction, spendAction } from "@/lib/actions";
import { KIND_LABEL, merchantsFor } from "@/lib/catalog";
import { formatTL, formatWhen, movementLabel } from "@/lib/format";
import { remainInk, remainLeft, remainMood } from "@/lib/remain";
import { listNotices } from "@/lib/store";
import type { Card, Tx } from "@/lib/types";
import { FundForm } from "./fund-form";
import { OrderSlip } from "./order-slip";
import { SubmitButton } from "./submit-button";
import { TransferForm } from "./transfer-form";

export function CardActions({
  card,
  entries = [],
  peers = [],
  balance = 0,
  drain = false,
}: {
  card: Card;
  entries?: Tx[];
  peers?: { id: string; label: string }[];
  balance?: number;
  drain?: boolean;
}) {
  const kalan = card.limit - card.spent;
  const left = remainLeft(card.limit, card.spent);
  const [shown, setShown] = useState(drain ? 100 : left);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!drain || reduce) {
      setShown(left);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1150);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(100 + (left - 100) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [left, drain]);
  const tone = remainInk(shown);
  const mood = remainMood(left);
  const readyNote = listNotices(card.userId).find((note) => note.ref === `hazir:${card.id}`);
  if (card.status === "hazirlaniyor") {
    return (
      <div className="mt-4 grid gap-3">
        <OrderSlip card={card} />
        <p className="text-xs text-white/50">Kart hazırlanıyor.</p>
        <form action={cancelOrderAction}>
          <input type="hidden" name="id" value={card.id} />
          <SubmitButton className="btn btn-danger w-fit">Siparişi iptal et</SubmitButton>
        </form>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3">
      {readyNote && (
        <p className="rounded-2xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint">
          Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Kalan tavan</span>
        <span className="font-semibold" style={{ color: tone.ink }}>
          %{shown} · {formatTL(kalan)}
        </span>
      </div>
      <div className="remain-track" data-remain={left}>
        <div className="remain-bar" style={{ width: `${shown}%`, background: tone.bar, boxShadow: `0 0 16px ${tone.ink}` }} />
      </div>
      {mood.line && <p className={`remain-note ${mood.urgent ? "remain-note-hot" : ""}`}>{mood.line}</p>}
      {mood.load && (
        <Link href="/panel/yukle" className={`btn btn-gold w-fit ${mood.urgent ? "btn-urge" : ""}`}>
          Bakiye yükle
        </Link>
      )}
      {card.status !== "kapali" && <FundForm cardId={card.id} balance={balance} />}
      {card.status !== "kapali" && peers.length > 0 && kalan > 0 && (
        <TransferForm cardId={card.id} kalan={kalan} peers={peers} />
      )}
      {card.spent > 0 && (
        <form action={renewAction} className="grid gap-1">
          <input type="hidden" name="id" value={card.id} />
          <SubmitButton className="btn btn-gold w-fit">Tavanı yenile</SubmitButton>
          <p className="text-xs text-white/50">Harcama sayacı sıfırlanır. Cüzdandan düşen tutar geri gelmez.</p>
        </form>
      )}
      <div className="flex flex-wrap gap-2">
        {card.status === "aktif" && (
          <form action={freezeAction}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="mod" value="dondur" />
            <SubmitButton className="btn btn-ghost">Kartı dondur</SubmitButton>
          </form>
        )}
        {card.status === "donduruldu" && (
          <form action={freezeAction}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="mod" value="coz" />
            <SubmitButton className="btn btn-gold">Kartı aktif et</SubmitButton>
          </form>
        )}
      </div>
      {card.status === "aktif" && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Harcama</summary>
          <form action={spendAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="grid gap-1 text-xs text-white/70">
              İşletme
              <select className="field" name="isletme" required defaultValue={merchantsFor(card.type)[0]}>
                {merchantsFor(card.type).map((merchant) => (
                  <option key={merchant}>{merchant}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-white/70">
              Tutar (USD)
              <input className="field" name="tutar" inputMode="decimal" placeholder="20" required />
            </label>
            <SubmitButton className="btn btn-ghost">Harcama yaz</SubmitButton>
          </form>
        </details>
      )}
      {card.status === "aktif" && card.spent > 0 && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">İade</summary>
          <form action={refundAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="grid gap-1 text-xs text-white/70">
              Tutar (USD)
              <input className="field" name="tutar" inputMode="decimal" placeholder="10" required />
            </label>
            <p className="text-xs text-white/50">
              En fazla {formatTL(card.spent)} geri yazılır. Tutar cüzdana döner, tavan açılır.
            </p>
            <SubmitButton className="btn btn-ghost">İade yaz</SubmitButton>
          </form>
        </details>
      )}
      {card.status !== "kapali" && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#ffd0dc]">Kartı kapat</summary>
          <form action={closeAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="flex items-start gap-2 text-sm text-white/75">
              <input type="checkbox" name="onay" required className="mt-1" />
              Bu kartı kapatıyorum. Geri açılmaz. Kart bedeli bakiyeye döner. Karta yazılmış tavan dönmez.
            </label>
            <SubmitButton className="btn btn-danger">Kapat</SubmitButton>
          </form>
        </details>
      )}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Bu kartın hareketi</p>
            <Link href={`/panel/islemler?kart=${card.id}`} className="text-xs font-semibold text-gold">
              Ödemeler
            </Link>
          </div>
          <ul className="mt-2 grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="block">{entry.title}</span>
                  <span className="text-xs text-white/45">
                    {formatWhen(entry.createdAt)} · {KIND_LABEL[entry.kind]}
                  </span>
                </span>
                <span className={entry.amount > 0 ? "font-semibold text-mint" : "font-semibold"}>
                  {movementLabel(entry.amount, entry.usdMinor)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { transferAction } from "@/lib/actions";
import { MIN_TRANSFER_KURUS, allTransferInput, transferFeeAt, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, parseTryToKurus } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import type { Card } from "@/lib/types";
import { VirtualCard } from "./virtual-card";

function TransferSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-gold w-fit" disabled={pending}>
      {pending ? "Aktarılıyor" : "Aktar"}
    </button>
  );
}

function tail(pan: string) {
  return pan.replace(/\D/g, "").slice(-4);
}

export function TransferForm({ card, peers }: { card: Card; peers: Card[] }) {
  const [raw, setRaw] = useState("");
  const [target, setTarget] = useState(peers[0]?.id ?? "");
  const settings = useSiteSettings();
  const kalan = card.limit - card.spent;
  const cents = parseTryToKurus(raw);
  const amount = cents !== null ? usdMinorToKurus(cents) : null;
  const fee = amount !== null && amount > 0 ? transferFeeAt(settings.transferFeePercent, amount) : 0;
  const credit = amount !== null ? amount - fee : 0;
  const ready =
    amount !== null &&
    amount >= MIN_TRANSFER_KURUS &&
    amount <= kalan &&
    fee >= 1 &&
    credit >= 1 &&
    target !== "";
  const peer = peers.find((item) => item.id === target) ?? peers[0];
  if (!peer) return null;

  return (
    <form action={transferAction} className="transfer-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Bakiye aktar</p>
        <span className="text-[11px] font-bold tracking-[0.16em] text-gold">%{settings.transferFeePercent}</span>
      </div>
      <div className="transfer-stage">
        <div className="transfer-face">
          <VirtualCard size="sm" card={card} />
        </div>
        <span className="transfer-track" aria-hidden>
          <span className="transfer-bead" />
        </span>
        <div className="transfer-face">
          <VirtualCard size="sm" card={peer} />
        </div>
      </div>
      <p className="transfer-route">
        {tail(card.pan)} karttan {tail(peer.pan)} karta transfer oluyor
        {amount !== null && amount > 0 ? ` · ${formatTL(amount)}` : ""}
      </p>
      <label className="grid gap-1 text-xs text-white/70">
        Karşı kart
        <select className="field" name="hedef" value={target} onChange={(event) => setTarget(event.target.value)} required>
          {peers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} · {tail(item.pan)} · kullanılabilir {formatTL(item.limit - item.spent)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-1 text-xs text-white/70">
        Tutar (USD)
        <div className="flex items-center gap-2">
          <input
            className="field"
            name="tutar"
            inputMode="decimal"
            placeholder="100"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            required
          />
          <button
            type="button"
            className="btn btn-ghost shrink-0 px-4 py-2 text-sm"
            onClick={() => setRaw(allTransferInput(kalan, settings.transferFeePercent))}
          >
            Tümü
          </button>
        </div>
      </div>
      <input type="hidden" name="id" value={card.id} />
      {amount !== null && amount > 0 && (
        <div className="transfer-split">
          <span>
            <small>Çıkar</small>
            {formatTL(amount)}
          </span>
          <span>
            <small>Komisyon</small>
            {formatTL(fee)}
          </span>
          <span>
            <small>Yazılır</small>
            {formatTL(Math.max(0, credit))}
          </span>
        </div>
      )}
      <TransferSubmit />
    </form>
  );
}

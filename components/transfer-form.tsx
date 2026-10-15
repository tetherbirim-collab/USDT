"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { transferAction } from "@/lib/actions";
import { MIN_TRANSFER_KURUS, TRANSFER_FEE_PERCENT, transferFee, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, parseTryToKurus } from "@/lib/format";

function TransferSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-gold w-fit" disabled={pending || disabled}>
      {pending ? "Aktarılıyor" : "Aktar"}
    </button>
  );
}

export function TransferForm({
  cardId,
  kalan,
  peers,
}: {
  cardId: string;
  kalan: number;
  peers: { id: string; label: string }[];
}) {
  const [raw, setRaw] = useState("");
  const [target, setTarget] = useState(peers[0]?.id ?? "");
  const cents = parseTryToKurus(raw);
  const amount = cents !== null ? usdMinorToKurus(cents) : null;
  const fee = amount !== null && amount > 0 ? transferFee(amount) : 0;
  const credit = amount !== null ? amount - fee : 0;
  const ready =
    amount !== null &&
    amount >= MIN_TRANSFER_KURUS &&
    amount <= kalan &&
    fee >= 1 &&
    credit >= 1 &&
    target !== "";
  const peer = peers.find((item) => item.id === target);

  return (
    <form action={transferAction} className="transfer-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Tavan aktar</p>
        <span className="text-[11px] font-bold tracking-[0.16em] text-gold">%{TRANSFER_FEE_PERCENT}</span>
      </div>
      <p className="text-xs text-white/50">Kalan tavan karşı karta gider. Ana bakiye değişmez, karşı karta %{TRANSFER_FEE_PERCENT} komisyon yazılır.</p>
      <div className="transfer-lane" aria-hidden>
        <span>Bu kart</span>
        <span className="transfer-track">
          <span className="transfer-bead" />
        </span>
        <span className="truncate">{peer?.label.split("·")[0]?.trim() || "Karşı kart"}</span>
      </div>
      <label className="grid gap-1 text-xs text-white/70">
        Karşı kart
        <select className="field" name="hedef" value={target} onChange={(event) => setTarget(event.target.value)} required>
          {peers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-white/70">
        Tutar (USD)
        <input
          className="field"
          name="tutar"
          inputMode="decimal"
          placeholder="100"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          required
        />
      </label>
      <input type="hidden" name="id" value={cardId} />
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
      <TransferSubmit disabled={!ready} />
    </form>
  );
}

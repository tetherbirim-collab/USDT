"use client";

import { useState } from "react";
import { transferAction } from "@/lib/actions";
import { MIN_TRANSFER_KURUS, TRANSFER_FEE_PERCENT, transferFee, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, parseTryToKurus } from "@/lib/format";
import { SubmitButton } from "./submit-button";

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

  return (
    <form action={transferAction} className="grid gap-2 rounded-2xl border border-white/10 p-3">
      <p className="text-sm font-semibold">Tavan aktar</p>
      <p className="text-xs text-white/50">
        Kalan tavan başka karta gider. Her aktarımda %{TRANSFER_FEE_PERCENT} komisyon kesilir. Cüzdan tutarı değişmez.
      </p>
      <label className="grid gap-1 text-xs text-white/70">
        Karşı kart
        <select className="field" name="hedef" value={target} onChange={(event) => setTarget(event.target.value)} required>
          {peers.map((peer) => (
            <option key={peer.id} value={peer.id}>
              {peer.label}
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
        <p className="text-xs text-white/70">
          {formatTL(amount)} çıkar · {formatTL(fee)} komisyon · {formatTL(Math.max(0, credit))} yazılır
        </p>
      )}
      <SubmitButton className="btn btn-gold w-fit" disabled={!ready}>
        Aktar
      </SubmitButton>
    </form>
  );
}

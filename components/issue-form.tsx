"use client";

import { useState } from "react";
import { issueAction } from "@/lib/actions";
import {
  CARD_TYPE_ORDER,
  CARD_TYPES,
  ISSUE_FEE_KURUS,
  MAX_LIMIT_KURUS,
  MIN_LIMIT_KURUS,
} from "@/lib/catalog";
import type { CardTypeId } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { VirtualCard } from "./virtual-card";

export function IssueForm({
  holder,
  balance,
  slotsLeft,
}: {
  holder: string;
  balance: number;
  slotsLeft: number;
}) {
  const [type, setType] = useState<CardTypeId>("reklam");
  const [label, setLabel] = useState("Yeni prova");
  const blocked = balance < ISSUE_FEE_KURUS || slotsLeft <= 0;

  return (
    <form action={issueAction} className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="grid gap-4">
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-semibold">Tür</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CARD_TYPE_ORDER.map((id) => (
              <label
                key={id}
                className={`cursor-pointer rounded-2xl border p-3 ${type === id ? "border-gold bg-white/10" : "border-white/10 bg-white/5"}`}
              >
                <input
                  className="mr-2"
                  type="radio"
                  name="tur"
                  value={id}
                  checked={type === id}
                  onChange={() => setType(id)}
                />
                <span className="font-semibold">{CARD_TYPES[id].name}</span>
                <span className="mt-1 block text-sm text-white/60">{CARD_TYPES[id].pitch}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1 text-sm">
          Etiket
          <input
            className="field"
            name="etiket"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            minLength={2}
            maxLength={32}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Aylık tavan (₺)
          <input
            className="field"
            name="limit"
            inputMode="decimal"
            defaultValue="5000"
            required
          />
          <span className="text-white/50">
            {MIN_LIMIT_KURUS / 100} ₺ – {MAX_LIMIT_KURUS / 100} ₺. Basım ücreti simülasyondur.
          </span>
        </label>
        {slotsLeft <= 0 && (
          <p className="banner-bad">Bu plandaki açık kart adedine ulaşıldı. Bir kartı kapatınca yer açılır.</p>
        )}
        {balance < ISSUE_FEE_KURUS && (
          <p className="banner-bad">Basım ücreti için simülasyon bakiyesi yetersiz. Önce cüzdanı yükle.</p>
        )}
        <SubmitButton className="btn btn-gold" disabled={blocked}>
          Kartı bas · simülasyon
        </SubmitButton>
      </div>
      <div>
        <VirtualCard
          card={{
            type,
            label: label || "Etiket",
            holder,
            pan: "",
            expiry: "",
            cvv: "",
            status: "aktif",
            masked: true,
          }}
        />
        <p className="mt-3 text-sm text-white/60">
          Numara basım anında 400000 test BIN’inden üretilir. Önizleme maskelidir; bu bir dışa
          aktarma değildir.
        </p>
      </div>
    </form>
  );
}

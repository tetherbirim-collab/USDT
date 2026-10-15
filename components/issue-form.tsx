"use client";

import { useState } from "react";
import { issueAction } from "@/lib/actions";
import {
  CARD_TYPE_ORDER,
  CARD_TYPES,
  MAX_LIMIT_KURUS,
  MIN_LIMIT_KURUS,
} from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import type { BinRow, CardTypeId } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { VirtualCard } from "./virtual-card";

export function IssueForm({
  holder,
  balance,
  slotsLeft,
  bins,
}: {
  holder: string;
  balance: number;
  slotsLeft: number;
  bins: Pick<BinRow, "id" | "type" | "label" | "digits">[];
}) {
  const [type, setType] = useState<CardTypeId>("facebook_ads");
  const [label, setLabel] = useState("Yeni prova");
  const [limit, setLimit] = useState("5000");
  const [step, setStep] = useState<"form" | "bin">("form");
  const [binId, setBinId] = useState("");
  const [localError, setLocalError] = useState("");
  const fee = CARD_TYPES[type].fee;
  const blocked = balance < fee || slotsLeft <= 0;
  const choices = bins.filter((row) => row.type === type);

  function openBinSection() {
    const clean = label.trim();
    const amount = Number(limit.replace(",", "."));
    if (clean.length < 2 || clean.length > 32) {
      setLocalError("Etiket 2–32 karakter olmalı.");
      return;
    }
    if (!Number.isFinite(amount) || amount * 100 < MIN_LIMIT_KURUS || amount * 100 > MAX_LIMIT_KURUS) {
      setLocalError("Tavan izin verilen aralığın dışında.");
      return;
    }
    setLocalError("");
    setBinId("");
    setStep("bin");
  }

  return (
    <form
      action={issueAction}
      className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr]"
      onSubmit={(event) => {
        if (step !== "bin" || choices.length === 0 || !binId) event.preventDefault();
      }}
    >
      <div className="grid gap-4">
        {step === "form" ? (
          <>
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
                      onChange={() => {
                        setType(id);
                        setStep("form");
                      }}
                    />
                    <span className="font-semibold">{CARD_TYPES[id].name}</span>
                    <span className="mt-1 block text-sm text-white/60">{CARD_TYPES[id].pitch}</span>
                    <span className="mt-1 block text-xs text-gold">Basım {formatTL(CARD_TYPES[id].fee)}</span>
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
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                required
              />
              <span className="text-white/50">
                {MIN_LIMIT_KURUS / 100} ₺ – {MAX_LIMIT_KURUS / 100} ₺. Basım ücreti simülasyondur.
              </span>
            </label>
            {localError && <p className="banner-bad">{localError}</p>}
            {slotsLeft <= 0 && (
              <p className="banner-bad">Bu plandaki açık kart adedine ulaşıldı. Bir kartı kapatınca yer açılır.</p>
            )}
            {balance < fee && (
              <p className="banner-bad">Bu türün basım ücreti için simülasyon bakiyesi yetersiz. Önce cüzdanı yükle.</p>
            )}
            <button type="button" className="btn btn-gold w-fit" disabled={blocked} onClick={openBinSection}>
              Kartı bas
            </button>
          </>
        ) : (
          <section id="bin-sec" className="grid gap-4 rounded-[24px] border border-gold/30 bg-black/20 p-4">
            <input type="hidden" name="tur" value={type} />
            <input type="hidden" name="etiket" value={label.trim()} />
            <input type="hidden" name="limit" value={limit} />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-gold">BIN SEÇ</p>
              <h2 className="font-display mt-1 text-2xl font-bold">{CARD_TYPES[type].name}</h2>
              <p className="mt-2 text-sm text-white/65">
                Yalnızca bu türün listesi açılır. Başka türlerin BIN satırları burada görünmez.
              </p>
            </div>
            {choices.length === 0 ? (
              <p className="rounded-2xl bg-black/30 px-3 py-3 text-sm text-white/75">
                Bu türün listesinde satır yok. Yönetim masası bir satır ekleyince burada görünür. Seçim
                yapılmadan kart oluşmaz.
              </p>
            ) : (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-semibold">Bu türün BIN satırları</legend>
                {choices.map((row) => (
                  <label key={row.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 px-3 py-3">
                    <input
                      type="radio"
                      name="bin"
                      value={row.id}
                      checked={binId === row.id}
                      onChange={() => setBinId(row.id)}
                      required
                    />
                    <span>
                      <span className="block font-semibold">{row.label}</span>
                      <span className="font-mono text-sm text-white/70">{row.digits}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setStep("form")}>
                Geri
              </button>
              <SubmitButton className="btn btn-gold" disabled={choices.length === 0 || !binId}>
                Kartı oluştur
              </SubmitButton>
            </div>
          </section>
        )}
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
          Numara, seçilen BIN önekiyle basım anında üretilir. Önizleme maskelidir. Bu bir numara
          sorgulama aracı değildir.
        </p>
      </div>
    </form>
  );
}

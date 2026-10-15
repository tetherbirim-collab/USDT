"use client";

import { useState } from "react";
import { issueAction } from "@/lib/actions";
import {
  CARD_TYPE_ORDER,
  CARD_TYPES,
  MAX_LIMIT_KURUS,
  MIN_LIMIT_KURUS,
} from "@/lib/catalog";
import { formatTL, holderLine } from "@/lib/format";
import { networkOf, previewPan } from "@/lib/pan";
import type { BinRow, CardTypeId } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { VirtualCard } from "./virtual-card";

export function IssueForm({
  balance,
  slotsLeft,
  bins,
}: {
  balance: number;
  slotsLeft: number;
  bins: Pick<BinRow, "id" | "type" | "label" | "digits">[];
}) {
  const [type, setType] = useState<CardTypeId>("facebook_ads");
  const [label, setLabel] = useState("");
  const [limit, setLimit] = useState("5000");
  const [binId, setBinId] = useState("");
  const [localError, setLocalError] = useState("");
  const fee = CARD_TYPES[type].fee;
  const blocked = balance < fee || slotsLeft <= 0;
  const choices = bins.filter((row) => row.type === type);
  const chosen = choices.find((row) => row.id === binId);
  const networkName = chosen ? (networkOf(chosen.digits) === "mastercard" ? "Mastercard" : networkOf(chosen.digits) === "visa" ? "Visa" : "Kart") : "";

  function readyToIssue() {
    const clean = label.trim();
    const amount = Number(limit.replace(",", "."));
    if (clean.length < 2 || clean.length > 32) {
      setLocalError("Kart adı 2–32 karakter olmalı.");
      return false;
    }
    if (!Number.isFinite(amount) || amount * 100 < MIN_LIMIT_KURUS || amount * 100 > MAX_LIMIT_KURUS) {
      setLocalError("Tavan izin verilen aralığın dışında.");
      return false;
    }
    if (!chosen) {
      setLocalError("Bir BIN seç.");
      return false;
    }
    setLocalError("");
    return true;
  }

  return (
    <form
      action={issueAction}
      className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr]"
      onSubmit={(event) => {
        if (!readyToIssue()) event.preventDefault();
      }}
    >
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
                      onChange={() => {
                        setType(id);
                        setBinId("");
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
              Karta isim ver
              <input
                className="field"
                name="etiket"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Kartının adı"
                minLength={2}
                maxLength={32}
                required
              />
              <span className="text-white/50">Bu ad kartın üzerinde görünür.</span>
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
            <section id="bin-sec" className="grid gap-3 rounded-[24px] border border-gold/30 bg-black/20 p-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-gold">BIN SEÇ</p>
                <p className="mt-2 text-sm text-white/65">
                  Yönetim masasının bu türe eklediği satırlar. Satın alırken kalan haneler X durur. Örnek: 42330 seçilirse önizleme 4233 0XXX XXXX XXXX olur.
                </p>
              </div>
              {choices.length === 0 ? (
                <p className="rounded-2xl bg-black/30 px-3 py-3 text-sm text-white/75">
                  Bu türün listesinde satır yok. Yönetim masası bir satır ekleyince burada görünür.
                </p>
              ) : (
                <fieldset className="grid gap-2">
                  <legend className="sr-only">BIN</legend>
                  {choices.map((row) => {
                    const mark = networkOf(row.digits);
                    return (
                      <label key={row.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 ${binId === row.id ? "border-gold bg-white/10" : "border-white/10"}`}>
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
                          <span className="font-mono text-sm text-white/70">{previewPan(row.digits)}</span>
                          <span className="mt-1 block text-xs text-white/50">{mark === "mastercard" ? "Mastercard" : mark === "visa" ? "Visa" : "Kart işareti"}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </section>
            <SubmitButton className="btn btn-gold w-fit" disabled={blocked || !chosen}>
              Kartı oluştur
            </SubmitButton>
      </div>
      <div>
        <VirtualCard
          card={{
            type,
            label: label.trim() || "Kart adı",
            holder: holderLine(label.trim() || "Kart adı"),
            pan: "",
            bin: chosen?.digits,
            panLine: chosen ? previewPan(chosen.digits) : "XXXX XXXX XXXX XXXX",
            expiry: "",
            cvv: "",
            status: "aktif",
            masked: true,
          }}
        />
        <p className="mt-3 text-sm text-white/60">
          {chosen
            ? `${networkName} işareti bu BIN’e göre durur. Satın alınca X’lerin yerine 16 hane yazılır.`
            : "BIN seçilince önek kalır, kalan haneler X olur. Satın alınca numara açılır."}
        </p>
      </div>
    </form>
  );
}

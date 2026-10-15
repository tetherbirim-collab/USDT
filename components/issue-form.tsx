"use client";

import { useState } from "react";
import { issueAction } from "@/lib/actions";
import {
  CARD_TYPE_ORDER,
  CARD_TYPES,
  MAX_LIMIT_USD_MINOR,
  MIN_LIMIT_USD_MINOR,
  loadFeeAt,
  usdMinorToKurus,
} from "@/lib/catalog";
import { formatTL, holderLine, parseTryToKurus } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import { networkOf, previewPan } from "@/lib/pan";
import type { BinRow, CardTypeId } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { VirtualCard } from "./virtual-card";

export function IssueForm({
  balance,
  slotsLeft,
  bins,
  account,
}: {
  balance: number;
  slotsLeft: number;
  bins: Pick<BinRow, "id" | "type" | "label" | "digits">[];
  account: { id: string; name: string; username: string };
}) {
  const [type, setType] = useState<CardTypeId>("facebook_ads");
  const [label, setLabel] = useState("");
  const [limit, setLimit] = useState("100");
  const [binId, setBinId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [localError, setLocalError] = useState("");
  const settings = useSiteSettings();
  const gross = usdMinorToKurus(parseTryToKurus(limit) ?? 0);
  const commission = gross > 0 ? loadFeeAt(settings.loadFeePercent, gross) : 0;
  const net = Math.max(0, gross - commission);
  const due = settings.issueFeeKurus + gross;
  const short = balance < due;
  const blocked = short || slotsLeft <= 0 || accountId !== account.id;
  const choices = bins.filter((row) => row.type === type);
  const chosen = choices.find((row) => row.id === binId);
  const networkName = chosen ? (networkOf(chosen.digits) === "mastercard" ? "Mastercard" : networkOf(chosen.digits) === "visa" ? "Visa" : "Kart") : "";

  function readyToIssue() {
    const clean = label.trim();
    const cents = parseTryToKurus(limit);
    if (clean.length < 2 || clean.length > 32) {
      setLocalError("Kart adı 2–32 karakter olmalı.");
      return false;
    }
    if (cents === null || cents < MIN_LIMIT_USD_MINOR || cents > MAX_LIMIT_USD_MINOR) {
      setLocalError("Kullanılabilir bakiye 10 ile 10.000 USD arasında olmalı.");
      return false;
    }
    if (accountId !== account.id) {
      setLocalError("Ödemenin düşeceği hesabı seç.");
      return false;
    }
    if (!chosen) {
      setLocalError("Bir BIN seç.");
      return false;
    }
    if (short) {
      setLocalError("Hesap bu kart bedelini ve karta ayrılan tutarı karşılamıyor.");
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
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-semibold">Ödeme hesabı</legend>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${accountId === account.id ? "border-gold bg-white/10" : "border-white/10 bg-white/5"}`}>
                <input
                  className="mt-1"
                  type="radio"
                  name="hesap"
                  value={account.id}
                  checked={accountId === account.id}
                  onChange={() => setAccountId(account.id)}
                  required
                />
                <span>
                  <span className="block font-semibold">{account.name}</span>
                  <span className="block text-sm text-white/60">{account.username}</span>
                  <span className="mt-1 block text-sm text-gold">Ana bakiye {formatTL(balance)}</span>
                </span>
              </label>
              <p className="text-xs text-white/50">Kart bedeli ve karta ayrılan tutar bu hesaptan düşer. Ana bakiyeye Heleket ile yüklemede komisyon yoktur.</p>
            </fieldset>
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
                    <span className="mt-1 block text-xs text-gold">Kart bedeli {formatTL(settings.issueFeeKurus)}</span>
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
              Karta ayrılacak tutar (USD)
              <input
                className="field"
                name="limit"
                inputMode="decimal"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                required
              />
              <span className="text-white/50">
                10–10.000 USD. Karşılığı {formatTL(gross)}. Bunun %{String(settings.loadFeePercent).replace(".", ",")} kadarı komisyon olarak kesilir.
              </span>
            </label>
            {localError && <p className="banner-bad">{localError}</p>}
            {slotsLeft <= 0 && (
              <p className="banner-bad">Bu plandaki kart hakkı doldu. Daha fazla kart için planı yükselt.</p>
            )}
            {short && (
              <p className="banner-bad">Hesap {formatTL(due)} için yetersiz. Önce ana bakiyeyi yükle.</p>
            )}
            <div className="grid gap-2 rounded-[24px] border border-gold/30 bg-black/25 p-4 text-sm">
              <p className="text-xs font-bold tracking-[0.18em] text-gold">HESAPTAN DÜŞECEK</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Kart bedeli</span>
                <span className="font-semibold">{formatTL(settings.issueFeeKurus)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Karta ayrılan</span>
                <span className="font-semibold">{formatTL(gross)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Komisyon %{String(settings.loadFeePercent).replace(".", ",")}</span>
                <span className="font-semibold text-[#ffb4a2]">{formatTL(commission)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Kullanılabilir bakiye</span>
                <span className="font-semibold text-mint">{formatTL(net)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                <span>Toplam düşüş</span>
                <span className="font-display text-xl font-bold text-gold">{formatTL(due)}</span>
              </div>
              <p className="text-xs text-white/55">
                {accountId === account.id
                  ? `İşlem sonrası ana bakiye ${formatTL(Math.max(0, balance - due))}.`
                  : "Düşüşü görmek için ödeme hesabını seç."}
              </p>
            </div>
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
            <SubmitButton className="btn btn-gold w-fit">
              Kartı oluştur · {formatTL(due)} düşer
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

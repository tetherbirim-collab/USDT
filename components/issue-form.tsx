"use client";

import { useState } from "react";
import { issueAction } from "@/lib/actions";
import { CARD_TYPE_ORDER, CARD_TYPES, OPENING_FEE_NOTE } from "@/lib/catalog";
import { formatTL, holderLine } from "@/lib/format";
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
  const [binId, setBinId] = useState("");
  const [usd, setUsd] = useState("");
  const [accountId, setAccountId] = useState(account.id);
  const [localError, setLocalError] = useState("");
  const settings = useSiteSettings();
  const due = settings.issueFeeKurus;
  const short = balance < due;
  const choices = bins.filter((row) => row.type === type);
  const chosen = choices.find((row) => row.id === binId);
  const networkName = chosen ? (networkOf(chosen.digits) === "mastercard" ? "Mastercard" : networkOf(chosen.digits) === "visa" ? "Visa" : "Kart") : "";

  function readyToIssue() {
    const clean = label.trim();
    if (clean.length < 2 || clean.length > 32) {
      setLocalError("Kart adı 2–32 karakter olmalı.");
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
    const amount = Number(usd.trim().replace(",", "."));
    if (!Number.isFinite(amount) || amount < 10) {
      setLocalError("Kripicard tutarı en az 10 USD olmalı.");
      return false;
    }
    if (short) {
      setLocalError("Hesap basım ücretini karşılamıyor.");
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
              <p className="text-xs text-white/50">Hesaptan yalnız basım ücreti düşer. Kripicard tutarı ayrıdır ve en az 10 USD olur. Yükleme komisyonu bu tutara yazılmaz.</p>
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
                    <span className="mt-1 block text-xs text-gold">Kart bedeli {formatTL(settings.issueFeeKurus)}. {OPENING_FEE_NOTE}</span>
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
              Kripicard tutarı (USD)
              <input
                className="field"
                name="tutar"
                inputMode="decimal"
                min={10}
                value={usd}
                onChange={(event) => setUsd(event.target.value)}
                placeholder="10"
                required
              />
              <span className="text-white/50">En az 10 USD. Sağlayıcıya gider. Yerel yükleme komisyonu kesilmez. Anahtarsız basım kart numarası üretmez.</span>
            </label>
            {localError && <p className="banner-bad">{localError}</p>}
            {slotsLeft <= 0 && (
              <p className="banner-bad">Bu plandaki kart hakkı doldu. Daha fazla kart için planı yükselt.</p>
            )}
            {short && (
              <p className="banner-bad">Hesap basım ücreti {formatTL(due)} için yetersiz. Önce ana bakiyeyi yükle.</p>
            )}
            <section className="fee-sheet" id="kesinti">
              <p className="fee-kicker">GÖNDERMEDEN ÖNCE</p>
              <h2 className="fee-title">Ne kesilir, ne kalır</h2>
              <p className="fee-lede">Kullanılabilir bakiye 0 ile başlar. Hesaptan yalnız basım ücreti düşer. Onaylamadan önce oku.</p>
              <dl className="fee-rows">
                <div className="fee-row">
                  <dt>
                    <span className="fee-label">Basım ücreti</span>
                    <span className="fee-note">Kartı oluşturunca hesaptan bir kez kesilir. Karta yazılmaz. {OPENING_FEE_NOTE}</span>
                  </dt>
                  <dd className="fee-value fee-cut">{formatTL(settings.issueFeeKurus)}</dd>
                </div>
                <div className="fee-row">
                  <dt>
                    <span className="fee-label">Karta yazılacak</span>
                    <span className="fee-note">Sağlayıcı bakiye döndürürse o yazılır. Döndürmezse 0 kalır. Yükleme en az 10 USD.</span>
                  </dt>
                  <dd className="fee-value fee-keep">{formatTL(0)}</dd>
                </div>
                <div className="fee-row">
                  <dt>
                    <span className="fee-label">30 gün sonra</span>
                    <span className="fee-note">Kart açık kalırsa kart bedeli yeniden kesilir. Şimdi düşmez.</span>
                  </dt>
                  <dd className="fee-value">{formatTL(settings.issueFeeKurus)}</dd>
                </div>
              </dl>
              <div className="fee-total">
                <div>
                  <p className="fee-label">Şimdi hesaptan düşecek</p>
                  <p className="fee-note">
                    {accountId !== account.id
                      ? "Düşüşü hesabına bağlamak için ödeme hesabını seç."
                      : short
                        ? `Ana bakiye ${formatTL(balance)}. Bu düşüşü karşılamıyor.`
                        : `İşlem sonrası ana bakiyede ${formatTL(balance - due)} kalır.`}
                  </p>
                </div>
                <p className="fee-total-num">{formatTL(due)}</p>
              </div>
            </section>
            <section id="bin-sec" className="grid gap-3 rounded-[24px] border border-gold/30 bg-black/20 p-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-gold">BIN SEÇ</p>
                <p className="mt-2 text-sm text-white/65">
                  Hizmet BIN’i 537872. Önizleme X ile durur; numara sağlayıcıdan gelmeden yazılmaz.
                </p>
              </div>
              {choices.length === 0 ? (
                <p className="rounded-2xl bg-black/30 px-3 py-3 text-sm text-white/75">
                  Bu türde 537872 satırı yok. Yönetim BIN listesine yazınca burada görünür.
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
            ? `${networkName} işareti bu BIN’e göre durur. Numara Kripicard döndürürse açılır. Yerel numara üretilmez.`
            : "BIN seçilince önizleme X ile durur. Numara sağlayıcıdan gelmeden yazılmaz."}
        </p>
      </div>
    </form>
  );
}

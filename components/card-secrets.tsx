"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { daysLeftLine, daysUntil, formatDay, formatPan, plusDaysIso } from "@/lib/format";
import type { Card } from "@/lib/types";
import { VirtualCard } from "./virtual-card";

function prettyExpiry(expiry: string) {
  return expiry.replace("/", " / ");
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}

function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <button type="button" className="shrink-0 text-xs font-bold text-gold" onClick={onCopy}>
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

export function CardSecrets({
  card,
  address,
  face = true,
  menu,
  children,
}: {
  card: Card;
  address: string;
  face?: boolean;
  menu?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [cvvOn, setCvvOn] = useState(false);
  const [copied, setCopied] = useState("");
  const dueIso = card.feeDueAt || plusDaysIso(String(card.createdAt ?? ""), 30);
  const due = formatDay(dueIso);
  const days = daysUntil(dueIso);
  const late = days < 0 || Boolean(card.feeDueAt && Date.parse(card.feeDueAt) <= Date.now());
  const leftLine = late ? "Ödeme günü geçti" : daysLeftLine(days);
  const pan = formatPan(card.pan);
  const expiry = prettyExpiry(String(card.expiry ?? ""));
  const line = String(address ?? "").trim();

  async function copy(key: string, value: string) {
    if (!open || !value) return;
    await writeClipboard(value);
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? "" : current)), 1600);
  }

  async function copyAll() {
    if (!open) return;
    const block = [
      `Kart: ${card.label}`,
      `Numara: ${pan}`,
      `Son kullanma: ${expiry}`,
      `CVV: ${cvvOn ? card.cvv : "gizli"}`,
      line ? `Adres: ${line}` : "Adres: yazılmadı",
      `Sonraki kart ödemesi: ${due}`,
      leftLine,
    ].join("\n");
    await copy("hepsi", block);
  }

  return (
    <div>
      {face && (
        <div className="card-face">
          {menu}
          <VirtualCard card={{ ...card, hideCvv: !open || !cvvOn }} />
        </div>
      )}
      {children}
      <section className="mt-3 rounded-2xl bg-white/[0.04] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/45">Sonraki ödeme</p>
            <p className="mt-1 font-display text-xl font-bold">{open ? due : "•• ••• ••••"}</p>
            {open && <p className={`fee-left ${late ? "fee-left-late" : ""}`}>{leftLine}</p>}
            <p className="mt-1 text-xs text-white/45">
              {late ? "Bu ödeme bakiyeden düşmedi. Kart açık kaldı." : "Kart bedeli o gün bakiyeden düşer."}
            </p>
          </div>
          {open && <CopyButton copied={copied === "odeme"} onCopy={() => copy("odeme", `${due} · ${leftLine}`)} />}
        </div>
      </section>
      <section className="mt-2 rounded-2xl bg-white/[0.04] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Detay</h2>
          <button type="button" className="text-sm font-semibold text-white/70" onClick={() => setOpen((value) => !value)}>
            {open ? "Gizle" : "Göster"}
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          <div className="rounded-2xl bg-black/25 px-3 py-2">
            <p className="text-xs text-white/50">No</p>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="font-mono text-sm tracking-wide">{open ? pan : `•••• •••• •••• ${String(card.pan ?? "").slice(-4)}`}</p>
              {open && <CopyButton copied={copied === "pan"} onCopy={() => copy("pan", pan)} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-2xl bg-black/25 px-3 py-2">
              <p className="text-xs text-white/50">SKT</p>
              <p className="mt-1 font-mono whitespace-nowrap">{open ? expiry : "•• / ••"}</p>
              {open && (
                <div className="mt-2">
                  <CopyButton copied={copied === "skt"} onCopy={() => copy("skt", expiry)} />
                </div>
              )}
            </div>
            <div className="min-w-0 rounded-2xl bg-black/25 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/50">CVV</p>
                {open && (
                  <button type="button" className="text-xs font-bold text-gold" onClick={() => setCvvOn((value) => !value)}>
                    {cvvOn ? "Gizle" : "Göster"}
                  </button>
                )}
              </div>
              <p className="mt-1 font-mono whitespace-nowrap">{open && cvvOn ? card.cvv : "•••"}</p>
              {open && cvvOn && (
                <div className="mt-2">
                  <CopyButton copied={copied === "cvv"} onCopy={() => copy("cvv", card.cvv)} />
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-3">
            <p className="text-xs text-white/50">Adres</p>
            <div className="mt-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              {open && line ? (
                <p className="min-w-0 break-words">{line}</p>
              ) : open ? (
                <p className="text-white/55">
                  Bu hesaba adres yazılmadı.{" "}
                  <Link href="/panel/hesap" className="font-semibold text-gold">
                    Hesap
                  </Link>
                </p>
              ) : (
                <p className="font-mono tracking-widest">••••••••</p>
              )}
              {open && line && <CopyButton copied={copied === "adres"} onCopy={() => copy("adres", line)} />}
            </div>
          </div>
          {open && (
            <button type="button" className="btn btn-ghost w-fit" onClick={copyAll}>
              {copied === "hepsi" ? "Kopyalandı" : "Bilgileri kopyala"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

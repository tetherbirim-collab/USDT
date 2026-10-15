"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatDay, formatPan, plusDaysIso } from "@/lib/format";
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
  children,
}: {
  card: Card;
  address: string;
  face?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState("");
  const due = formatDay(plusDaysIso(card.createdAt, 30));
  const pan = formatPan(card.pan);
  const expiry = prettyExpiry(card.expiry);
  const line = address.trim();

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
      `CVV: ${card.cvv}`,
      line ? `Adres: ${line}` : "Adres: yazılmadı",
      `Sonraki kart ödemesi: ${due}`,
    ].join("\n");
    await copy("hepsi", block);
  }

  return (
    <div>
      {face && <VirtualCard card={{ ...card, hideCvv: !open }} />}
      {children}
      <section className="mt-4 rounded-[22px] bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/45">SONRAKİ KART ÖDEMESİ</p>
            <p className="mt-1 font-display text-xl font-bold">{open ? due : "•• ••• ••••"}</p>
            <p className="mt-1 text-xs text-white/45">Sonraki kart ödemesinin tarihi.</p>
          </div>
          {open && <CopyButton copied={copied === "odeme"} onCopy={() => copy("odeme", due)} />}
        </div>
      </section>
      <section className="mt-3 rounded-[22px] bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Kart detayları</h2>
          <button type="button" className="text-sm font-semibold text-white/70" onClick={() => setOpen((value) => !value)}>
            {open ? "Gizle" : "Göster"}
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-black/25 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="font-mono text-base tracking-wide">{open ? pan : `•••• •••• •••• ${card.pan.slice(-4)}`}</p>
              {open && <CopyButton copied={copied === "pan"} onCopy={() => copy("pan", pan)} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-2xl bg-black/25 px-3 py-3">
              <p className="text-xs text-white/50">Son kullanma tarihi</p>
              <p className="mt-1 font-mono whitespace-nowrap">{open ? expiry : "•• / ••"}</p>
              {open && (
                <div className="mt-2">
                  <CopyButton copied={copied === "skt"} onCopy={() => copy("skt", expiry)} />
                </div>
              )}
            </div>
            <div className="min-w-0 rounded-2xl bg-black/25 px-3 py-3">
              <p className="text-xs text-white/50">CVV</p>
              <p className="mt-1 font-mono whitespace-nowrap">{open ? card.cvv : "•••"}</p>
              {open && (
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

"use client";

import { useState } from "react";
import { adminCardAction, adminCloseCardAction, adminIssueAction, adminPurgeCardAction, adminTransferAction } from "@/lib/actions";
import { CARD_TYPE_ORDER, CARD_TYPES } from "@/lib/catalog";
import type { BinRow, Card, CardStatus } from "@/lib/types";

export function AdminIssueForm({ userId, bins, back }: { userId: string; bins: BinRow[]; back: string }) {
  const [type, setType] = useState<(typeof CARD_TYPE_ORDER)[number]>("facebook_ads");
  const choices = bins.filter((row) => row.type === type);
  return (
    <form action={adminIssueAction} className="glass grid gap-3 rounded-[28px] p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">KART VER</p>
      <h2 className="font-display text-2xl font-bold">Bu üyeye kart bas</h2>
      <p className="text-sm text-white/70">Kart bedeli ve yüklenecek tutar üyenin bakiyesinden düşer. Plan hakkı doluysa basım olmaz.</p>
      <input type="hidden" name="uye" value={userId} />
      <input type="hidden" name="donus" value={back} />
      <label className="grid gap-1 text-sm">
        Tür
        <select className="field" name="tur" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
          {CARD_TYPE_ORDER.map((id) => (
            <option key={id} value={id}>
              {CARD_TYPES[id].name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Kart adı
        <input className="field" name="etiket" required minLength={2} maxLength={32} placeholder="Kampanya" />
      </label>
      <label className="grid gap-1 text-sm">
        Kullanılabilir bakiye (USD)
        <input className="field" name="limit" inputMode="decimal" required placeholder="100" />
      </label>
      <label className="grid gap-1 text-sm">
        BIN
        <select key={type} className="field" name="bin" required defaultValue={choices[0]?.id ?? ""}>
          {choices.map((row) => (
            <option key={row.id} value={row.id}>
              {row.digits} · {row.label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-gold w-fit" disabled={choices.length === 0}>
        Kartı ver
      </button>
    </form>
  );
}

export function AdminTransferForm({ userId, cards, back }: { userId: string; cards: Card[]; back: string }) {
  const open = cards.filter((card) => card.status === "aktif" || card.status === "donduruldu");
  if (open.length < 2) return null;
  return (
    <form action={adminTransferAction} className="glass grid gap-3 rounded-[28px] p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">AKTARIM</p>
      <h2 className="font-display text-2xl font-bold">Karttan karta</h2>
      <p className="text-sm text-white/70">Tutar kaynak kartın tavanından düşer. Karşı karta %4 sonrası yazılır. Ana bakiye değişmez.</p>
      <input type="hidden" name="uye" value={userId} />
      <input type="hidden" name="donus" value={back} />
      <label className="grid gap-1 text-sm">
        Kaynak
        <select className="field" name="id" required defaultValue={open[0]?.id}>
          {open.map((card) => (
            <option key={card.id} value={card.id}>
              {card.label} · {card.pan.slice(-4)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Karşı kart
        <select className="field" name="hedef" required defaultValue={open[1]?.id}>
          {open.map((card) => (
            <option key={card.id} value={card.id}>
              {card.label} · {card.pan.slice(-4)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Tutar (USD)
        <input className="field" name="tutar" inputMode="decimal" required placeholder="10" />
      </label>
      <button className="btn btn-gold w-fit">Aktar</button>
    </form>
  );
}

export function AdminCardOps({
  cardId,
  userId,
  status,
  back,
}: {
  cardId: string;
  userId: string;
  status: CardStatus;
  back: string;
}) {
  const [ask, setAsk] = useState<"kapat" | "sil" | "dondur" | null>(null);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "aktif" && ask === null && (
        <button type="button" className="btn btn-ghost" onClick={() => setAsk("dondur")}>
          Kartı dondur
        </button>
      )}
      {ask === "dondur" && (
        <form action={adminCardAction} className="grid gap-2">
          <input type="hidden" name="id" value={cardId} />
          <input type="hidden" name="mod" value="dondur" />
          <input type="hidden" name="donus" value={back} />
          <p className="text-sm font-semibold">Emin misin? Kart dondurulmuş sekmeye gider.</p>
          <div className="flex gap-2">
            <button className="btn btn-gold">Evet, dondur</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>
              Vazgeç
            </button>
          </div>
        </form>
      )}
      {status === "donduruldu" && ask === null && (
        <form action={adminCardAction}>
          <input type="hidden" name="id" value={cardId} />
          <input type="hidden" name="mod" value="coz" />
          <input type="hidden" name="donus" value={back} />
          <button className="btn btn-gold">Kartı aktif et</button>
        </form>
      )}
      {(status === "aktif" || status === "donduruldu") && ask !== "kapat" && ask !== "sil" && (
        <button type="button" className="btn btn-ghost" onClick={() => setAsk("kapat")}>
          Kartı kapat
        </button>
      )}
      {status === "kapali" && ask !== "sil" && (
        <button type="button" className="btn btn-ghost" onClick={() => setAsk("sil")}>
          Kartı kalıcı sil
        </button>
      )}
      {ask === "kapat" && (
        <form action={adminCloseCardAction} className="grid gap-2">
          <input type="hidden" name="id" value={cardId} />
          <input type="hidden" name="uye" value={userId} />
          <input type="hidden" name="donus" value={back} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="onay" value="on" required />
            Emin misin? Basım ücreti bakiyeye döner.
          </label>
          <div className="flex gap-2">
            <button className="btn btn-gold">Evet, kapat</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>
              Vazgeç
            </button>
          </div>
        </form>
      )}
      {ask === "sil" && (
        <form action={adminPurgeCardAction} className="grid gap-2">
          <input type="hidden" name="id" value={cardId} />
          <input type="hidden" name="uye" value={userId} />
          <input type="hidden" name="donus" value={back} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="onay" value="on" required />
            Emin misin? Kart ve siparişi silinir. Bakiye değişmez.
          </label>
          <div className="flex gap-2">
            <button className="btn btn-gold">Evet, sil</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAsk(null)}>
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { activateCardAction, cancelOrderAction, closeAction, freezeAction, purgeCardAction } from "@/lib/actions";
import { formatTL } from "@/lib/format";
import type { Card } from "@/lib/types";

export function CardMenu({ card, fee }: { card: Card; fee: number }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [erasing, setErasing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const price = formatTL(fee);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setClosing(false);
        setFreezing(false);
        setErasing(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="card-menu" ref={root}>
      <button
        type="button"
        className="card-menu-btn"
        aria-expanded={open}
        aria-label="Kart işlemleri"
        onClick={() => {
          setOpen((value) => !value);
          setClosing(false);
          setFreezing(false);
          setErasing(false);
        }}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="card-menu-pop" role="menu">
          {card.status !== "kapali" && !closing && !freezing && (
            <button
              type="button"
              className="card-menu-item card-menu-danger"
              onClick={() => {
                setClosing(true);
                setFreezing(false);
              }}
            >
              Kartı kapat
            </button>
          )}
          {card.status === "aktif" && !closing && !freezing && (
            <button
              type="button"
              className="card-menu-item"
              onClick={() => {
                setFreezing(true);
                setClosing(false);
              }}
            >
              Kartı dondur
            </button>
          )}
          {freezing && card.status === "aktif" && (
            <form action={freezeAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <input type="hidden" name="mod" value="dondur" />
              <p className="text-xs font-semibold">Emin misin?</p>
              <p className="text-xs text-white/70">Kart dondurulmuş sekmeye gider. Harcama durur. Yeniden açmak {price} tutar.</p>
              <button className="btn btn-gold" type="submit">
                Evet, dondur
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setFreezing(false)}>
                Vazgeç
              </button>
            </form>
          )}
          {(card.status === "donduruldu" || card.status === "kapali") && !erasing && (
            <form action={activateCardAction}>
              <input type="hidden" name="id" value={card.id} />
              <button className="card-menu-item" type="submit">
                Kartı aktifleştir · {price}
              </button>
            </form>
          )}
          {card.status === "kapali" && !erasing && (
            <button type="button" className="card-menu-item card-menu-danger" onClick={() => setErasing(true)}>
              Kartı kalıcı olarak sil
            </button>
          )}
          {erasing && card.status === "kapali" && (
            <form action={purgeCardAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <p className="text-xs font-semibold">Emin misin?</p>
              <label className="flex items-start gap-2 text-xs text-white/75">
                <input type="checkbox" name="onay" required className="mt-0.5" />
                Kart ve siparişi silinir. Geri gelmez. Cüzdan hareketi durur.
              </label>
              <button className="btn btn-danger" type="submit">
                Kalıcı olarak sil
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setErasing(false)}>
                Vazgeç
              </button>
            </form>
          )}
          {closing && card.status === "hazirlaniyor" && (
            <form action={cancelOrderAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <p className="text-xs font-semibold">Emin misin?</p>
              <p className="text-xs text-white/70">Sipariş iptal olur. Kart bedeli bakiyeye döner. Kart kapanmış sekmeye gider.</p>
              <button className="btn btn-danger" type="submit">
                Kapat
              </button>
            </form>
          )}
          {closing && card.status !== "hazirlaniyor" && card.status !== "kapali" && (
            <form action={closeAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <p className="text-xs font-semibold">Emin misin?</p>
              <label className="flex items-start gap-2 text-xs text-white/75">
                <input type="checkbox" name="onay" required className="mt-0.5" />
                Kapanmış sekmeye gider. Kart bedeli döner. Kullanılabilir bakiye dönmez. Yeniden açmak {price} tutar.
              </label>
              <button className="btn btn-danger" type="submit">
                Kapat
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

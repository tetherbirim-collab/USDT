"use client";

import { useEffect, useRef, useState } from "react";
import { activateCardAction, cancelOrderAction, closeAction, freezeAction } from "@/lib/actions";
import { formatTL } from "@/lib/format";
import type { Card } from "@/lib/types";

export function CardMenu({ card, fee }: { card: Card; fee: number }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const price = formatTL(fee);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setClosing(false);
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
        }}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="card-menu-pop" role="menu">
          {card.status !== "kapali" && !closing && (
            <button type="button" className="card-menu-item card-menu-danger" onClick={() => setClosing(true)}>
              Kartı kapat
            </button>
          )}
          {card.status === "aktif" && (
            <form action={freezeAction}>
              <input type="hidden" name="id" value={card.id} />
              <input type="hidden" name="mod" value="dondur" />
              <button className="card-menu-item" type="submit">
                Kartı dondur
              </button>
            </form>
          )}
          {(card.status === "donduruldu" || card.status === "kapali") && (
            <form action={activateCardAction}>
              <input type="hidden" name="id" value={card.id} />
              <button className="card-menu-item" type="submit">
                Kartı aktifleştir · {price}
              </button>
            </form>
          )}
          {closing && card.status === "hazirlaniyor" && (
            <form action={cancelOrderAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <p className="text-xs text-white/70">Sipariş iptal olur. Kart bedeli bakiyeye döner. Kart kapanmış bölüme gider.</p>
              <button className="btn btn-danger" type="submit">
                Kapat
              </button>
            </form>
          )}
          {closing && card.status !== "hazirlaniyor" && card.status !== "kapali" && (
            <form action={closeAction} className="grid gap-2 px-2 py-2">
              <input type="hidden" name="id" value={card.id} />
              <label className="flex items-start gap-2 text-xs text-white/75">
                <input type="checkbox" name="onay" required className="mt-0.5" />
                Kapanmış bölüme gider. Kart bedeli döner. Tavan dönmez. Yeniden açmak {price} tutar.
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

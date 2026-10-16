"use client";

import { useActionState, useState } from "react";
import { adminAssignPlanAction, adminCardAction, adminCloseCardAction, adminIssueAction, adminMemberPasswordAction, adminPurgeCardAction, adminTransferAction } from "@/lib/actions";
import { CARD_TYPE_ORDER, CARD_TYPES } from "@/lib/catalog";
import type { BinRow, Card, CardStatus, PlanId } from "@/lib/types";

export function AdminPasswordForm({ userId }: { userId: string; seeded?: boolean }) {
  const [state, action] = useActionState(adminMemberPasswordAction, { error: "", once: "" });
  return (
    <form action={action} className="glass grid gap-3 rounded-[28px] p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">PAROLA</p>
      <h2 className="font-display text-2xl font-bold">Parola yaz</h2>
      <p className="text-sm text-white/70">
        Yeni parola en az 6 karakter. Harf ve rakam yazılır. Deftere düz yazılmaz. Kaydedince burada bir kez görünür.
      </p>
      <input type="hidden" name="uye" value={userId} />
      <label className="grid gap-1 text-sm">
        Yeni parola
        <input className="field" name="parola" type="text" required minLength={6} maxLength={72} pattern="[A-Za-z0-9]{6,72}" autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        Yeniden
        <input className="field" name="parola2" type="text" required autoComplete="off" />
      </label>
      <button className="btn btn-gold w-fit">Parolayı yaz</button>
      {state.once ? <p className="rounded-2xl bg-mint/15 px-3 py-3 text-sm font-semibold text-mint">Yeni parola {state.once}. Bu sayfa kapanınca bir daha görünmez.</p> : null}
      {state.error ? <p className="text-sm font-semibold text-[#ffb4c4]">{state.error}</p> : null}
    </form>
  );
}

export function AdminPlanAssign({ userId, back, plan }: { userId: string; back: string; plan: PlanId }) {
  return (
    <form action={adminAssignPlanAction} className="glass grid gap-3 rounded-[28px] p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">PLAN</p>
      <h2 className="font-display text-2xl font-bold">Plan yaz</h2>
      <p className="text-sm text-white/70">Kıvılcım, Atölye veya Galeri. Ücret üyenin bakiyesinden düşer. Bakiye yetmezse plan değişmez.</p>
      <input type="hidden" name="uye" value={userId} />
      <input type="hidden" name="donus" value={back} />
      <label className="grid gap-1 text-sm">
        Plan
        <select className="field" name="plan" defaultValue={plan}>
          <option value="kivilcim">Kıvılcım</option>
          <option value="atolye">Atölye</option>
          <option value="galeri">Galeri</option>
        </select>
      </label>
      <button className="btn btn-gold w-fit">Ücreti düş ve yaz</button>
    </form>
  );
}

export function AdminIssueForm({ userId, bins, back }: { userId: string; bins: BinRow[]; back: string }) {
  const [type, setType] = useState<(typeof CARD_TYPE_ORDER)[number]>("facebook_ads");
  const choices = bins.filter((row) => row.type === type);
  return (
    <form id="kart-ver" action={adminIssueAction} className="glass grid gap-3 rounded-[28px] p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-gold">KART VER</p>
      <h2 className="font-display text-2xl font-bold">Bu üyeye kart bas</h2>
      <p className="text-sm text-white/70">Yalnız basım ücreti üyenin bakiyesinden düşer. Kartın kullanılabilir bakiyesi 0 başlar. Plan hakkı doluysa basım olmaz.</p>
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
      <p className="text-sm text-white/60">Kullanılabilir bakiye 0 ile başlar. Yükleme üye kartından, kendi hesabıyla yapılır.</p>
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
      <button className="btn btn-gold w-fit">
        Kartı ver
      </button>
    </form>
  );
}

export function AdminTransferForm({ userId, cards, back }: { userId: string; cards: Card[]; back: string }) {
  const open = cards.filter((card) => card.status === "aktif" || card.status === "donduruldu");
  if (open.length < 2) {
    return (
      <article id="aktarim" className="glass grid gap-3 rounded-[28px] p-5">
        <p className="text-xs font-bold tracking-[0.18em] text-gold">AKTARIM</p>
        <h2 className="font-display text-2xl font-bold">Karttan karta</h2>
        <p className="text-sm text-white/70">Aktarım için bu üyede en az iki açık veya dondurulmuş kart gerekir. Ana bakiye bu işte değişmez.</p>
      </article>
    );
  }
  return (
    <form id="aktarim" action={adminTransferAction} className="glass grid gap-3 rounded-[28px] p-5">
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

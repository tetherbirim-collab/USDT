"use client";

import { adminTelegramAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";

export default function AdminTelegramPage() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;
  const name = settings.telegram;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">TELEGRAM</p>
        <h1 className="font-display text-4xl font-extrabold">Telegram</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Kullanıcı adını yaz. Sağ alttaki düğme t.me adresine gider. Silince düğme kaybolur.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminTelegramAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Telegram adı
          <input className="field" name="telegram" defaultValue={name} placeholder="claydestek" autoComplete="off" />
        </label>
        <p className="text-xs text-white/50">@ işareti veya t.me linki de olur. Örnek: claydestek</p>
        <button className="btn btn-gold w-fit">Kaydet</button>
      </form>
      {name && (
        <form action={adminTelegramAction}>
          <input type="hidden" name="sil" value="1" />
          <p className="mb-3 text-sm text-white/70">
            Şu an <span className="font-semibold text-gold">t.me/{name}</span>
          </p>
          <button className="btn btn-danger">Telegramı sil</button>
        </form>
      )}
    </div>
  );
}

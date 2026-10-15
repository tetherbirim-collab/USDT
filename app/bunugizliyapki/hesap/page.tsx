"use client";

import { adminPasswordAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { Boot, useQuery, useUser } from "@/lib/live";

export default function AdminAccountPage() {
  const query = useQuery();
  const user = useUser();
  if (!query || !user) return <Boot />;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">HESAP</p>
        <h1 className="font-display text-4xl font-extrabold">Yönetici hesabı</h1>
        <p className="mt-2 text-white/70">Kullanıcı adı {user.username}. Parola bu formdan değişir.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminPasswordAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Mevcut parola
          <input className="field" name="eski" type="password" required autoComplete="current-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola
          <input className="field" name="yeni" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola, tekrar
          <input className="field" name="yeni2" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <button className="btn btn-gold w-fit">Parolayı kaydet</button>
      </form>
    </div>
  );
}

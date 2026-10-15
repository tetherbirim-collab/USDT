import { Notice } from "@/components/notice";
import { displayNameAction, passwordChangeAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">HESAP</p>
        <h1 className="font-display text-4xl font-extrabold">Hesap</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Yükleme, basım ve harcama yalnızca bu hesabın bakiyesinden düşer. Başka bir kullanıcının kartı veya bakiyesi değişmez.
        </p>
      </div>
      <Notice code={one(sp.bildirim)} />
      <dl className="glass grid max-w-md gap-3 rounded-[28px] p-5 text-sm">
        <div>
          <dt className="text-white/50">Hesap no</dt>
          <dd className="font-mono text-base">{user.id}</dd>
        </div>
        <div>
          <dt className="text-white/50">Kullanıcı adı</dt>
          <dd className="font-semibold">{user.username}</dd>
        </div>
        <div>
          <dt className="text-white/50">Görünen ad</dt>
          <dd className="font-semibold">{user.name}</dd>
        </div>
      </dl>
      <form action={displayNameAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Görünen ad
          <input className="field" name="ad" required minLength={2} maxLength={40} defaultValue={user.name} />
        </label>
        <p className="text-xs text-white/50">Kartın ad satırında bunun ilk 24 karakteri büyük harfle durur.</p>
        <button className="btn btn-gold w-fit">Adı kaydet</button>
      </form>
      <form action={passwordChangeAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Mevcut parola
          <input className="field" name="eski" type="password" required autoComplete="current-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola
          <input className="field" name="yeni" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola tekrar
          <input className="field" name="yeni2" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <button className="btn btn-gold w-fit">Parolayı güncelle</button>
      </form>
    </div>
  );
}

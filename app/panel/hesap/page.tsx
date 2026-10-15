import { Notice } from "@/components/notice";
import { passwordChangeAction } from "@/lib/actions";
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
        <h1 className="font-display text-4xl font-extrabold">Parola</h1>
        <p className="mt-2 max-w-xl text-white/70">
          {user.username} için yeni parola yazılır. Yönetim masasında düz metin olarak yeni değer görünür. Bu bir simülasyondur.
        </p>
      </div>
      <Notice code={one(sp.bildirim)} />
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

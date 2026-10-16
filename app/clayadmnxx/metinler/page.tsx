"use client";

import { adminCopyAction, adminResetAction } from "@/lib/actions";
import { ADMIN_PATH } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { COPY, COPY_KEYS, siteText } from "@/lib/copy";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";

export default function AdminCopyPage() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;
  const groups = [...new Set(COPY_KEYS.map((key) => COPY[key].group))];

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">YAZILAR</p>
        <h1 className="font-display text-4xl font-extrabold">Site yazıları</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Ana sayfa, giriş ve panel menüsü bu kaydı okur. Satırı boş bırakırsan varsayılan Türkçe metin döner. Güven satırının varsayılanı KYC YOK, LOG YOK ve TAMAMEN GÜVENLİ VE ANONİM olarak kalır.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminResetAction}>
        <input type="hidden" name="alan" value="metin" />
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/metinler`} />
        <button className="btn btn-ghost">Yazıları varsayılana al</button>
      </form>
      <form action={adminCopyAction} className="grid gap-5">
        {groups.map((group) => (
          <section key={group} className="glass grid gap-3 rounded-[28px] p-5">
            <h2 className="font-display text-2xl font-bold">{group}</h2>
            {COPY_KEYS.filter((key) => COPY[key].group === group).map((key) => {
              const row = COPY[key];
              const value = siteText(settings, key);
              const long = row.max > 80;
              return (
                <label key={key} className="grid gap-1 text-sm">
                  <span className="font-semibold">{row.label}</span>
                  {long ? (
                    <textarea className="field min-h-20" name={key} maxLength={row.max} defaultValue={value} />
                  ) : (
                    <input className="field" name={key} maxLength={row.max} defaultValue={value} />
                  )}
                </label>
              );
            })}
          </section>
        ))}
        <button className="btn btn-gold w-fit">Yazıları kaydet</button>
      </form>
    </div>
  );
}

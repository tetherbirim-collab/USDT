"use client";

import { adminAnnounceAction, adminClearMemberNoticesAction, adminDeleteNoticeAction, adminNoticeAction, adminNoticeRemoveAction, adminNoticeSaveAction } from "@/lib/actions";
import { ADMIN_PATH } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { formatWhen } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";
import type { InboxNote, User } from "@/lib/types";

function batches(notices: InboxNote[], users: User[]) {
  const names = new Map(users.map((user) => [user.id, user.username]));
  const seen = new Map<
    string,
    { batch: string; title: string; body: string; createdAt: string; who: string[]; read: number; editable: boolean; ids: string[] }
  >();
  for (const note of [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const row = seen.get(note.batch);
    const name = names.get(note.userId) ?? "üye";
    if (!row) {
      seen.set(note.batch, {
        batch: note.batch,
        title: note.title,
        body: note.body,
        createdAt: note.createdAt,
        who: [name],
        read: note.readAt ? 1 : 0,
        editable: note.ref == null,
        ids: [note.id],
      });
    } else {
      row.who.push(name);
      row.ids.push(note.id);
      if (note.readAt) row.read += 1;
      if (note.ref) row.editable = false;
    }
  }
  return [...seen.values()];
}

export default function AdminNoticesPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const db = snapshot();
  const members = db.users.filter((user) => user.role === "uye").sort((a, b) => a.username.localeCompare(b.username, "tr"));
  const announce = db.settings.announcement;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">BİLDİRİMLER</p>
        <h1 className="font-display text-4xl font-extrabold">Bildirimler</h1>
        <p className="mt-2 max-w-2xl text-white/70">Mesaj üye paneline düşer. E-posta veya kısa mesaj gitmez.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminAnnounceAction} className="glass grid gap-3 rounded-[28px] p-5">
        <p className="text-xs font-bold tracking-[0.18em] text-gold">DUYURU</p>
        <h2 className="font-display text-2xl font-bold">Sitede yayınla</h2>
        <p className="text-sm text-white/70">Açık duyuru ana sayfada ve üye panelinin üstünde durur. Kutuyu boşaltıp kaydedersen şerit kalkar.</p>
        <label className="grid gap-1 text-sm">
          Başlık
          <input className="field" name="baslik" maxLength={80} defaultValue={announce?.title ?? ""} placeholder="Kısa duyuru" />
        </label>
        <label className="grid gap-1 text-sm">
          Metin
          <textarea className="field min-h-20" name="mesaj" maxLength={240} defaultValue={announce?.body ?? ""} placeholder="İsteğe bağlı açıklama" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="yayin" value="on" defaultChecked={Boolean(announce?.on)} />
          Yayında
        </label>
        <button className="btn btn-gold w-fit">Duyuruyu kaydet</button>
      </form>
      <form action={adminNoticeAction} className="glass grid gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Başlık
          <input className="field" name="baslik" required minLength={2} maxLength={80} placeholder="Kısa başlık" />
        </label>
        <label className="grid gap-1 text-sm">
          Mesaj
          <textarea className="field min-h-24" name="mesaj" required minLength={2} maxLength={400} placeholder="Üyelere kısa bir not." />
        </label>
        <label className="grid gap-1 text-sm">
          Kime
          <select className="field" name="hedef" defaultValue="tumu">
            <option value="tumu">Tüm üyeler</option>
            {members.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-gold w-fit">Bildirimi gönder</button>
      </form>
      {members.length > 0 && <form action={adminClearMemberNoticesAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/bildirimler`} />
        <label className="grid gap-1 text-sm">
          Üyenin kutusunu boşalt
          <select className="field" name="uye" required defaultValue={members[0]?.id ?? ""}>
            {members.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-ghost">Tümünü sil</button>
      </form>}
      <ul className="grid gap-2">
        {batches(db.notices, db.users).map((item) => (
          <li key={item.batch} className="glass rounded-[24px] px-4 py-3 text-sm">
            <p className="font-semibold">{item.title}</p>
            <p className="text-white/70">{item.body}</p>
            <p className="mt-1 text-xs text-white/45">
              {formatWhen(item.createdAt)} · {item.who.join(", ")} · {item.read}/{item.who.length} okudu
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.ids.map((id) => (
                <form key={id} action={adminDeleteNoticeAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="donus" value={`${ADMIN_PATH}/bildirimler`} />
                  <button className="btn btn-ghost">Sil</button>
                </form>
              ))}
            </div>
            {item.editable && (
              <form action={adminNoticeSaveAction} className="mt-3 grid gap-2">
                <input type="hidden" name="batch" value={item.batch} />
                <input className="field" name="baslik" defaultValue={item.title} required minLength={2} maxLength={80} />
                <textarea className="field min-h-16" name="mesaj" defaultValue={item.body} required minLength={2} maxLength={400} />
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-gold">Yazıyı güncelle</button>
                  <button className="btn btn-ghost" formAction={adminNoticeRemoveAction}>
                    Bildirimi sil
                  </button>
                </div>
              </form>
            )}
          </li>
        ))}
        {db.notices.length === 0 && <li className="text-sm text-white/50">Henüz gönderilmedi.</li>}
      </ul>
    </div>
  );
}

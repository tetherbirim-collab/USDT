"use client";

import { adminNoticeAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { formatWhen } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";
import type { InboxNote, User } from "@/lib/types";

function batches(notices: InboxNote[], users: User[]) {
  const names = new Map(users.map((user) => [user.id, user.username]));
  const seen = new Map<
    string,
    { batch: string; title: string; body: string; createdAt: string; who: string[]; read: number }
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
      });
    } else {
      row.who.push(name);
      if (note.readAt) row.read += 1;
    }
  }
  return [...seen.values()];
}

export default function AdminNoticesPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const db = snapshot();
  const members = db.users.filter((user) => user.role === "uye").sort((a, b) => a.username.localeCompare(b.username, "tr"));

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">BİLDİRİMLER</p>
        <h1 className="font-display text-4xl font-extrabold">Bildirimler</h1>
        <p className="mt-2 max-w-2xl text-white/70">Mesaj üye paneline düşer. E-posta veya kısa mesaj gitmez.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
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
      <ul className="grid gap-2">
        {batches(db.notices, db.users).map((item) => (
          <li key={item.batch} className="glass rounded-[24px] px-4 py-3 text-sm">
            <p className="font-semibold">{item.title}</p>
            <p className="text-white/70">{item.body}</p>
            <p className="mt-1 text-xs text-white/45">
              {formatWhen(item.createdAt)} · {item.who.join(", ")} · {item.read}/{item.who.length} okudu
            </p>
          </li>
        ))}
        {db.notices.length === 0 && <li className="text-sm text-white/50">Henüz gönderilmedi.</li>}
      </ul>
    </div>
  );
}

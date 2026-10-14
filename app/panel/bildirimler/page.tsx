import { getCurrentUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { listNotices } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function NoticesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const notes = listNotices(user.id);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">SİMÜLASYON</p>
        <h1 className="font-display text-4xl font-extrabold">Bildirimler</h1>
        <p className="mt-2 max-w-xl text-white/70">
          CLAY yönetim masasının yazdığı mesajlar. E-posta veya SMS gitmez; kayıt yalnızca bu panelde durur.
        </p>
      </div>
      {notes.length === 0 ? (
        <p className="glass rounded-[24px] px-4 py-6 text-white/60">Henüz bildirim yok.</p>
      ) : (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id} className="glass rounded-[24px] px-4 py-4">
              <p className="font-display text-xl font-bold">{note.title}</p>
              <p className="mt-2 text-white/75">{note.body}</p>
              <p className="mt-2 text-xs text-white/45">{formatWhen(note.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

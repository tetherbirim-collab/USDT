import { Notice } from "@/components/notice";
import { markAllNoticesReadAction, markNoticeReadAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { listNotices } from "@/lib/store";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const notes = listNotices(user.id);
  const unread = notes.filter((note) => !note.readAt).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">SİMÜLASYON</p>
          <h1 className="font-display text-4xl font-extrabold">Bildirimler</h1>
          <p className="mt-2 max-w-xl text-white/70">
            CLAY yönetim masasının yazdığı mesajlar. Sayfayı açmak okundu saymaz. E-posta veya kısa mesaj gitmez.
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNoticesReadAction}>
            <button className="btn btn-gold">Tümünü okundu say</button>
          </form>
        )}
      </div>
      <Notice code={one(sp.bildirim)} />
      {notes.length === 0 ? (
        <p className="glass rounded-[24px] px-4 py-6 text-white/60">Henüz bildirim yok.</p>
      ) : (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id} className="glass rounded-[24px] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-display text-xl font-bold">{note.title}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${note.readAt ? "bg-white/10 text-white/60" : "bg-gold text-[#24180a]"}`}>
                  {note.readAt ? "Okundu" : "Okunmadı"}
                </span>
              </div>
              <p className="mt-2 text-white/75">{note.body}</p>
              <p className="mt-2 text-xs text-white/45">
                {formatWhen(note.createdAt)}
                {note.readAt ? ` · okundu ${formatWhen(note.readAt)}` : ""}
              </p>
              {!note.readAt && (
                <form action={markNoticeReadAction} className="mt-3">
                  <input type="hidden" name="id" value={note.id} />
                  <button className="btn btn-ghost">Okundu</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

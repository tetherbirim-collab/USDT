"use client";

import Link from "next/link";
import { adminClearTicketsAction, adminDeleteTicketAction, adminTicketCloseAction, adminTicketReplyAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

export default function AdminSupportPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const db = snapshot();
  const tickets = [...db.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">DESTEK</p>
        <h1 className="font-display text-4xl font-extrabold">Destek talepleri</h1>
        <p className="mt-2 max-w-2xl text-white/70">Üye talep yazınca burada durur. Yanıt üyenin ziline de düşer.</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminClearTicketsAction}>
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/destek`} />
        <button className="btn btn-ghost">Kapanmış talepleri temizle</button>
      </form>
      <ul className="grid gap-3">
        {tickets.map((ticket) => {
          const owner = db.users.find((item) => item.id === ticket.userId);
          return (
            <li key={ticket.id} className="glass rounded-[28px] px-4 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">{ticket.subject}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === "acik" ? "bg-gold text-white" : "bg-mint text-[#10241f]"}`}>
                  {ticket.status === "yanitlandi" ? "Yanıtlandı" : ticket.status === "kapandi" ? "Kapandı" : "Açık"}
                </span>
              </div>
              <p className="mt-1 text-white/70">{ticket.body}</p>
              <p className="mt-1 text-xs text-white/45">
                {formatWhen(ticket.createdAt)} ·{" "}
                {owner ? (
                  <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="font-semibold text-gold">
                    {owner.username}
                  </Link>
                ) : (
                  "üye"
                )}
              </p>
              {ticket.reply && <p className="mt-2 text-mint">Yanıt: {ticket.reply}</p>}
              <form action={adminTicketReplyAction} className="mt-3 grid gap-2">
                <input type="hidden" name="id" value={ticket.id} />
                <textarea className="field min-h-20" name="yanit" required minLength={2} maxLength={400} placeholder="Üyeye kısa yanıt" defaultValue={ticket.reply ?? ""} />
                <button className="btn btn-gold w-fit">Yanıtla</button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                {ticket.status !== "kapandi" && (
                  <form action={adminTicketCloseAction}>
                    <input type="hidden" name="id" value={ticket.id} />
                    <button className="btn btn-ghost">Talebi kapat</button>
                  </form>
                )}
                <form action={adminDeleteTicketAction}>
                  <input type="hidden" name="id" value={ticket.id} />
                  <input type="hidden" name="donus" value={`${ADMIN_PATH}/destek`} />
                  <button className="btn btn-ghost">Talebi sil</button>
                </form>
              </div>
            </li>
          );
        })}
        {tickets.length === 0 && <li className="text-sm text-white/50">Henüz talep yok.</li>}
      </ul>
    </div>
  );
}

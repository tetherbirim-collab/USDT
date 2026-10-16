"use client";

import { Notice } from "@/components/notice";
import { ticketAction } from "@/lib/actions";
import { formatWhen } from "@/lib/format";
import { useChrome } from "@/components/chrome-controls";
import { siteText } from "@/lib/copy";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import { listTickets } from "@/lib/store";

const STATUS = {
  acik: "Açık",
  yanitlandi: "Yanıtlandı",
  kapandi: "Kapandı",
} as const;

export default function SupportPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  const { lang } = useChrome();
  if (!user || !query) return <Boot />;
  const tickets = listTickets(user.id);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">DESTEK</p>
        <h1 className="font-display text-4xl font-extrabold">{siteText(settings, "supportTitle", lang)}</h1>
        <p className="mt-2 max-w-xl text-white/70">{siteText(settings, "supportLede", lang)}</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={ticketAction} className="glass grid max-w-xl gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Konu
          <input className="field" name="konu" required minLength={2} maxLength={80} placeholder="Kısa konu" />
        </label>
        <label className="grid gap-1 text-sm">
          Şikayet
          <textarea
            className="field min-h-32"
            name="sikayet"
            required
            minLength={4}
            maxLength={800}
            placeholder="Ne oldu, kısaca yaz."
          />
        </label>
        <button className="btn btn-gold w-fit">Talebi gönder</button>
      </form>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-bold">Taleplerim</h2>
        {tickets.length === 0 ? (
          <p className="glass rounded-[24px] px-4 py-6 text-white/60">Henüz talep yok.</p>
        ) : (
          tickets.map((ticket) => (
            <article key={ticket.id} className="glass rounded-[24px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-display text-xl font-bold">{ticket.subject}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === "yanitlandi" ? "bg-mint text-[#10241f]" : ticket.status === "kapandi" ? "bg-white text-[#7a2432]" : "bg-gold text-white"}`}>
                  {STATUS[ticket.status]}
                </span>
              </div>
              <p className="mt-2 text-white/75">{ticket.body}</p>
              <p className="mt-2 text-xs text-white/45">{formatWhen(ticket.createdAt)}</p>
              {ticket.reply && (
                <p className="mt-3 rounded-2xl border border-mint/30 bg-mint/10 px-3 py-3 text-sm">
                  <span className="block text-xs font-bold tracking-[0.16em] text-mint">YANIT</span>
                  {ticket.reply}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

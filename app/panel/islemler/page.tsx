import { Notice } from "@/components/notice";
import { getCurrentUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatSigned, formatWhen } from "@/lib/format";
import { listCards, listTransactions } from "@/lib/store";
import type { TxKind } from "@/lib/types";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const FILTERS: [string, string][] = [
  ["", "Tümü"],
  ["yukleme", "Yükleme"],
  ["harcama", "Harcama"],
  ["iade", "İade"],
  ["basim", "Basım"],
  ["reddedilen", "Reddedilen"],
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const tur = one(sp.tur) || "";
  const q = (one(sp.q) || "").trim();
  const kart = one(sp.kart) || "";
  const cards = listCards(user.id);
  const labels = new Map(cards.map((card) => [card.id, card.label]));

  let rows = listTransactions(user.id);
  if (tur === "reddedilen") rows = rows.filter((entry) => entry.status === "reddedildi");
  else if (tur === "yukleme" || tur === "harcama" || tur === "iade" || tur === "basim") {
    rows = rows.filter((entry) => entry.kind === (tur as TxKind));
  }
  if (kart) rows = rows.filter((entry) => entry.cardId === kart);
  if (q) {
    const needle = q.toLocaleLowerCase("tr-TR");
    rows = rows.filter((entry) =>
      `${entry.title} ${entry.note}`.toLocaleLowerCase("tr-TR").includes(needle),
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-mint">DÖKÜM</p>
        <h1 className="font-display text-4xl font-extrabold">İşlemler</h1>
        <p className="mt-2 text-white/65">Hepsi simülasyon kaydıdır. Banka ekstresi değildir.</p>
      </div>
      <Notice code={one(sp.bildirim)} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => {
          const params = new URLSearchParams();
          if (id) params.set("tur", id);
          if (kart) params.set("kart", kart);
          if (q) params.set("q", q);
          const href = params.size ? `/panel/islemler?${params}` : "/panel/islemler";
          const active = tur === id;
          return (
            <a
              key={label}
              href={href}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${active ? "bg-gold text-[#24180a]" : "bg-white/5 text-white/75"}`}
            >
              {label}
            </a>
          );
        })}
      </div>
      <form className="glass grid gap-3 rounded-[24px] p-4 sm:grid-cols-[1fr_1fr_auto]" action="/panel/islemler">
        {tur && <input type="hidden" name="tur" value={tur} />}
        <label className="grid gap-1 text-sm">
          Kart
          <select className="field" name="kart" defaultValue={kart}>
            <option value="">Tüm kartlar</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Ara
          <input className="field" name="q" defaultValue={q} placeholder="İşletme adı" />
        </label>
        <button className="btn btn-ghost self-end">Süz</button>
      </form>
      {rows.length === 0 ? (
        <p className="glass rounded-[24px] p-5 text-white/70">Bu süzgeçte kayıt yok.</p>
      ) : (
        <ul className="glass divide-y divide-white/10 rounded-[24px] px-4">
          {rows.map((entry) => (
            <li key={entry.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  {formatWhen(entry.createdAt)} · {KIND_LABEL[entry.kind]}
                  {entry.cardId ? ` · ${labels.get(entry.cardId) ?? "Kart"}` : ""}
                  {entry.status === "reddedildi" ? " · Reddedildi" : ""}
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>
              </div>
              <p
                className={`font-bold ${entry.status === "reddedildi" ? "text-white/40 line-through" : entry.amount > 0 ? "text-mint" : ""}`}
              >
                {formatSigned(entry.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

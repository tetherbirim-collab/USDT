import { getCurrentUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatWhen } from "@/lib/format";
import { filterLedger, paymentQueryFrom, payStatusLabel } from "@/lib/payments";
import { listCards, listTransactions } from "@/lib/store";

export const dynamic = "force-dynamic";

function cell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Giriş yok", { status: 401 });
  const url = new URL(request.url);
  const query = paymentQueryFrom({
    tur: url.searchParams.get("tur") || "",
    durum: url.searchParams.get("durum") || "",
    kart: url.searchParams.get("kart") || "",
    q: url.searchParams.get("q") || "",
    bas: url.searchParams.get("bas") || "",
    bit: url.searchParams.get("bit") || "",
    enaz: url.searchParams.get("enaz") || "",
    encok: url.searchParams.get("encok") || "",
  });
  const cards = new Map(listCards(user.id).map((card) => [card.id, card]));
  const lines = ["tarih;tür;başlık;kart;tutar_kurus;dolar_sent;durum;not"];
  for (const entry of filterLedger(listTransactions(user.id), query)) {
    const card = entry.cardId ? cards.get(entry.cardId) : undefined;
    lines.push(
      [
        cell(formatWhen(entry.createdAt)),
        cell(KIND_LABEL[entry.kind]),
        cell(entry.title),
        cell(card ? `${card.label} ···· ${card.pan.slice(-4)}` : ""),
        String(entry.amount),
        entry.usdMinor == null ? "" : String(entry.usdMinor),
        cell(payStatusLabel(entry)),
        cell(entry.note),
      ].join(";"),
    );
  }
  return new Response(`\uFEFF${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clay-odemeler.csv"',
    },
  });
}

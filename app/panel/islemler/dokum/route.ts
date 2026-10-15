import { getCurrentUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/catalog";
import { formatWhen } from "@/lib/format";
import { listCards, listTransactions } from "@/lib/store";

export const dynamic = "force-dynamic";

function cell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Giriş yok", { status: 401 });
  const cards = new Map(listCards(user.id).map((card) => [card.id, card.label]));
  const lines = ["tarih;tür;başlık;kart;tutar_kurus;dolar_sent;durum;not"];
  for (const entry of listTransactions(user.id)) {
    lines.push(
      [
        cell(formatWhen(entry.createdAt)),
        cell(KIND_LABEL[entry.kind]),
        cell(entry.title),
        cell(entry.cardId ? (cards.get(entry.cardId) ?? "") : ""),
        String(entry.amount),
        entry.usdMinor == null ? "" : String(entry.usdMinor),
        cell(entry.status === "tamamlandi" ? "Tamamlandı" : "Reddedildi"),
        cell(entry.note),
      ].join(";"),
    );
  }
  return new Response(`\uFEFF${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clay-dokum.csv"',
    },
  });
}

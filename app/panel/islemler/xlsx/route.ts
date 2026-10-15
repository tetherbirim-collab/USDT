import { getCurrentUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { filterLedger, paymentQueryFrom, payStatusLabel } from "@/lib/payments";
import { listCards, listTransactions } from "@/lib/store";
import { workbookXlsx } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

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
  const rows = [
    ["Tarih", "Kart", "Son dört", "Ödeme", "Miktar kuruş", "Durum", "Not"],
    ...filterLedger(listTransactions(user.id), query).map((entry) => {
      const card = entry.cardId ? cards.get(entry.cardId) : undefined;
      return [
        formatWhen(entry.createdAt),
        card?.label ?? "Cüzdan",
        card ? card.pan.slice(-4) : "",
        entry.title,
        String(entry.amount),
        payStatusLabel(entry),
        entry.note,
      ];
    }),
  ];
  const body = workbookXlsx(rows);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="clay-odemeler.xlsx"',
    },
  });
}

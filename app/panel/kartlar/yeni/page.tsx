import Link from "next/link";
import { IssueForm } from "@/components/issue-form";
import { Notice } from "@/components/notice";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/catalog";
import { holderLine } from "@/lib/format";
import { listCards, snapshot } from "@/lib/store";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const open = listCards(user.id).filter((card) => card.status !== "kapali").length;
  const slotsLeft = PLANS[user.plan].cardLimit - open;

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/panel/kartlar" className="text-sm text-gold">
          ← Kartlara dön
        </Link>
        <h1 className="font-display mt-3 text-4xl font-extrabold">Kart bas</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Türü seçip Kartı bas dediğinde yalnızca o türün BIN listesi açılır. Her türde hazır bir test
          öneki durur: Test öneki, 400000. Yönetici başka satır ekleyebilir. Seçim yapılmadan kart
          oluşmaz. Numara sorgulama, kimlik belgesi ve ödeme yoktur. Tür adları senaryo etiketidir.
        </p>
      </div>
      <Notice code={one(sp.bildirim)} />
      <div className="glass rounded-[28px] p-4 sm:p-6">
        <IssueForm
          holder={holderLine(user.name)}
          balance={user.balance}
          slotsLeft={slotsLeft}
          bins={snapshot().bins}
        />
      </div>
    </div>
  );
}

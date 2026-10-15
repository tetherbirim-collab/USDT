import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelFrame } from "@/components/panel-frame";
import { SubmitButton } from "@/components/submit-button";
import { renewAction } from "@/lib/actions";
import { clearSession, getCurrentUser, readSessionUserId } from "@/lib/auth";
import { findUserById, listCards, unreadNoticeCount } from "@/lib/store";
import { PLANS } from "@/lib/catalog";
import { formatTL, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sessionId = await readSessionUserId();
  const user = await getCurrentUser();
  if (!user) {
    if (sessionId) {
      const row = findUserById(sessionId);
      if (row?.status === "askida") {
        await clearSession();
        redirect("/giris?bildirim=e-askida");
      }
    }
    redirect("/giris");
  }
  if (user.role === "yonetici") redirect("/admin");
  const hot = listCards(user.id).filter(
    (card) =>
      (card.status === "aktif" || card.status === "donduruldu") &&
      card.limit > 0 &&
      card.spent / card.limit >= 0.8,
  );
  return (
    <PanelFrame
      name={user.name}
      username={user.username}
      balanceLabel={formatTL(user.balance)}
      usdLabel={formatUsd(user.usdMinor)}
      planName={`${PLANS[user.plan].name} · vitrin`}
      unread={unreadNoticeCount(user.id)}
    >
      {hot.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#ff6a80]/50 bg-[#ff3b4e]/15 px-4 py-3">
          <div>
            <p className="font-display text-lg font-extrabold tracking-wide text-[#ffd5dc]">
              KARTIN BAKİYESİ BİTİYOR
            </p>
            <p className="text-sm text-[#ffd5dc]/90">{hot.map((card) => card.label).join(" · ")}</p>
            <p className="mt-1 text-xs text-[#ffd5dc]/70">Tavanı yenile harcama sayacını sıfırlar. Cüzdan tutarı aynı kalır.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hot.map((card) => (
              <form key={card.id} action={renewAction}>
                <input type="hidden" name="id" value={card.id} />
                <SubmitButton className="btn btn-gold">Tavanı yenile · {card.label}</SubmitButton>
              </form>
            ))}
            <Link href="/panel/yukle" className="btn btn-ghost">
              Cüzdan
            </Link>
          </div>
        </div>
      )}
      {children}
    </PanelFrame>
  );
}

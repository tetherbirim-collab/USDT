import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelFrame } from "@/components/panel-frame";
import { clearSession, getCurrentUser, readSessionUserId } from "@/lib/auth";
import { findUserById, unreadNoticeCount } from "@/lib/store";
import { PLANS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";

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
  return (
    <PanelFrame
      name={user.name}
      username={user.username}
      balanceLabel={formatTL(user.balance)}
      planName={`${PLANS[user.plan].name} · vitrin`}
      unread={unreadNoticeCount(user.id)}
    >
      {children}
    </PanelFrame>
  );
}

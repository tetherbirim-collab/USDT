import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelFrame } from "@/components/panel-frame";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return (
    <PanelFrame
      name={user.name}
      email={user.email}
      balanceLabel={formatTL(user.balance)}
      planName={`${PLANS[user.plan].name} · vitrin`}
    >
      {children}
    </PanelFrame>
  );
}

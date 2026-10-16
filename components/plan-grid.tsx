"use client";

import Link from "next/link";
import { PLANS, usdMinorToKurus } from "@/lib/catalog";
import { FeeRows, packageLines, percentText } from "@/components/fee-sheet";
import { formatTL } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import type { PlanId } from "@/lib/types";

const PACKAGE_NAME: Record<PlanId, string> = {
  kivilcim: "Kıvılcım",
  atolye: "Atölye",
  galeri: "Galeri",
};

export function PlanGrid() {
  const settings = useSiteSettings();
  const ids = Object.keys(PLANS) as PlanId[];
  const issue = formatTL(settings.issueFeeKurus);
  const load = percentText(settings.loadFeePercent);
  const transfer = percentText(settings.transferFeePercent);
  return (
    <>
      <p className="mt-3 max-w-3xl text-white/75">
        Üç paket. Basım ücreti, yükleme komisyonu, 30 günlük kart bedeli ve aktarım her pakette aynıdır. Değişen, aylık paket ücreti ve açık kart hakkıdır. Kartı oluşturmadan önce aynı satırlar, o an kesilecek tutarla birlikte durur.
      </p>
      <div className="plan-grid mt-8">
        {ids.map((id) => {
          const plan = settings.plans[id];
          const featured = id === "atolye";
          return (
            <article key={id} className={`pkg-card${featured ? " pkg-card-on" : ""}`}>
              <div className="pkg-top">
                <p className="pkg-kicker">{featured ? "Öne çıkan" : "Paket"}</p>
                <p className="pkg-limit">{plan.cardLimit} kart</p>
              </div>
              <h3 className="pkg-name">{PACKAGE_NAME[id]}</h3>
              <p className="pkg-metal">{plan.name}</p>
              <div className="pkg-price-block">
                <p className="pkg-price">
                  {plan.priceUsdMinor / 100} <span>USD</span>
                </p>
                <p className="pkg-sub">{formatTL(usdMinorToKurus(plan.priceUsdMinor))} · ay</p>
              </div>
              <FeeRows lines={packageLines(settings, plan)} withNotes={false} />
              <Link href="/kayit" className="btn btn-gold pkg-cta w-full">
                Hesap aç
              </Link>
            </article>
          );
        })}
      </div>
      <section className="fee-sheet mt-6" id="paket-ucret">
        <p className="fee-kicker">KART OLUŞTURURKEN</p>
        <h3 className="fee-title">Ne kesilir, ne kalır</h3>
        <ul className="fee-sentences">
          <li>Basım ücreti {issue}. Kartı oluşturunca hesaptan bir kez kesilir. Bu para karta yazılmaz.</li>
          <li>Karta ayırdığın tutar da hesaptan düşer. Bunun {load} kadarı yükleme komisyonu olarak kesilir, kalan karta yazılır.</li>
          <li>30 günlük kart bedeli yine {issue}. Kart açık kaldıkça her 30 günde bir kesilir. Oluşturma anında bu ikinci kez düşmez.</li>
          <li>Aktarımda karşı karta geçen tutardan {transfer} kesilir. Ana bakiye değişmez.</li>
          <li>
            Aylık paket ücreti yalnız plan değişince düşer. Kıvılcım {settings.plans.kivilcim.priceUsdMinor / 100} USD, Atölye{" "}
            {settings.plans.atolye.priceUsdMinor / 100} USD, Galeri {settings.plans.galeri.priceUsdMinor / 100} USD.
          </li>
        </ul>
      </section>
    </>
  );
}

"use client";

import { percentText } from "@/components/fee-sheet";
import { PublicPlanOffers } from "@/components/plan-offers";
import { OPENING_FEE_NOTE } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";

export function PlanGrid() {
  const settings = useSiteSettings();
  const issue = formatTL(settings.issueFeeKurus);
  const load = percentText(settings.loadFeePercent);
  const transfer = percentText(settings.transferFeePercent);
  return (
    <>
      <p className="mt-3 max-w-3xl text-white/75">
        Üç paket. Basım ücreti, yükleme komisyonu, 30 günlük kart bedeli ve aktarım her pakette aynıdır. Değişen, aylık paket ücreti ve açık kart hakkıdır. Kartı oluşturmadan önce aynı satırlar, o an kesilecek tutarla birlikte durur.
      </p>
      <div className="mt-8">
        <PublicPlanOffers />
      </div>
      <section className="fee-sheet mt-6" id="paket-ucret">
        <p className="fee-kicker">KART OLUŞTURURKEN</p>
        <h3 className="fee-title">Ne kesilir, ne kalır</h3>
        <ul className="fee-sentences">
          <li>Basım ücreti {issue}. {OPENING_FEE_NOTE}. Kartı oluşturunca hesaptan bir kez kesilir. Bu para karta yazılmaz.</li>
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

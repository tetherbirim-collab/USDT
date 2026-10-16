import { OPENING_FEE_NOTE, usdMinorToKurus } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

export function percentText(value: number): string {
  return `%${String(value).replace(".", ",")}`;
}

export type FeeLine = {
  label: string;
  value: string;
  note: string;
};

export function packageLines(
  settings: SiteSettings,
  plan: { priceUsdMinor: number; cardLimit: number },
): FeeLine[] {
  const price = formatTL(usdMinorToKurus(plan.priceUsdMinor));
  const issue = formatTL(settings.issueFeeKurus);
  const load = percentText(settings.loadFeePercent);
  const transfer = percentText(settings.transferFeePercent);
  return [
    {
      label: "Aylık paket",
      value: `${plan.priceUsdMinor / 100} USD`,
      note: `Plan değişince bakiyeden ${price} düşer. Aynı pakette ücret alınmaz.`,
    },
    {
      label: "Açık kart hakkı",
      value: String(plan.cardLimit),
      note: `Bu pakette en fazla ${plan.cardLimit} kart açık kalır.`,
    },
    {
      label: "Basım ücreti",
      value: issue,
      note: `Kartı oluşturunca hesaptan bir kez kesilir. Bu tutar karta yazılmaz. ${OPENING_FEE_NOTE}`,
    },
    {
      label: "Yükleme komisyonu",
      value: load,
      note: "Karta ayırdığın tutarın bu kadarı kesilir. Kalan, kartın kullanılabilir bakiyesi olur.",
    },
    {
      label: "30 günlük kart bedeli",
      value: issue,
      note: "Kart açık kaldıkça her 30 günde bir aynı tutar yeniden kesilir. Oluşturma anında ayrıca düşmez.",
    },
    {
      label: "Aktarım",
      value: transfer,
      note: "Kartlar arası aktarımda karşı karta geçen tutardan kesilir. Ana bakiye değişmez.",
    },
  ];
}

export function FeeRows({ lines, withNotes = true }: { lines: FeeLine[]; withNotes?: boolean }) {
  return (
    <dl className="fee-rows">
      {lines.map((line) => (
        <div key={line.label} className="fee-row">
          <dt>
            <span className="fee-label">{line.label}</span>
            {withNotes ? <span className="fee-note">{line.note}</span> : null}
          </dt>
          <dd className="fee-value">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

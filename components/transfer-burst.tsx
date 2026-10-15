import { formatTL } from "@/lib/format";
import type { Card } from "@/lib/types";
import { VirtualCard } from "./virtual-card";

function tail(pan: string) {
  return pan.replace(/\D/g, "").slice(-4);
}

export function TransferBurst({
  from,
  to,
  left,
  fee,
  arrived,
}: {
  from: Card;
  to: Card;
  left: number;
  fee: number;
  arrived: number;
}) {
  return (
    <div className="transfer-burst" role="status">
      <p className="transfer-word">Aktarıldı</p>
      <p className="transfer-route">
        {tail(from.pan)} karttan {tail(to.pan)} karta aktarıldı
      </p>
      <div className="transfer-stage">
        <div className="transfer-face">
          <VirtualCard size="sm" card={from} />
        </div>
        <span className="transfer-track" aria-hidden>
          <span className="transfer-bead" />
        </span>
        <div className="transfer-face">
          <VirtualCard size="sm" card={to} />
        </div>
      </div>
      <p className="transfer-math">
        {formatTL(left)} çıktı · {formatTL(fee)} komisyon · {formatTL(arrived)} yazıldı
      </p>
    </div>
  );
}

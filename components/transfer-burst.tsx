import { formatTL } from "@/lib/format";

export function TransferBurst({
  from,
  to,
  left,
  fee,
  arrived,
}: {
  from: string;
  to: string;
  left: number;
  fee: number;
  arrived: number;
}) {
  return (
    <div className="transfer-burst" role="status">
      <p className="transfer-word">Aktarıldı</p>
      <div className="transfer-lane">
        <span>{from}</span>
        <span className="transfer-track">
          <span className="transfer-bead" />
        </span>
        <span>{to}</span>
      </div>
      <p className="transfer-math">
        {formatTL(left)} çıktı · {formatTL(fee)} komisyon · {formatTL(arrived)} yazıldı
      </p>
    </div>
  );
}

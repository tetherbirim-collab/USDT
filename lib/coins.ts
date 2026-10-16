import type { PayoutCoin } from "./types";

export const PAYOUT_COINS: {
  id: PayoutCoin;
  name: string;
  short: string;
  hint: string;
  placeholder: string;
}[] = [
  { id: "btc", name: "Bitcoin", short: "BTC", hint: "Bitcoin adresi", placeholder: "bc1…" },
  { id: "usdt", name: "USDT", short: "USDT", hint: "USDT adresi", placeholder: "T…" },
  { id: "xmr", name: "Monero", short: "XMR", hint: "Monero adresi", placeholder: "4…" },
];

export function payoutCoin(value: unknown): PayoutCoin | null {
  if (value === "btc" || value === "usdt" || value === "xmr") return value;
  return null;
}

export function payoutCoinShort(value: unknown): string {
  return PAYOUT_COINS.find((row) => row.id === value)?.short ?? "";
}

export function payoutCoinName(value: unknown): string {
  return PAYOUT_COINS.find((row) => row.id === value)?.name ?? "";
}

export function payoutNote(phase: "bekliyor" | "gitti" | "iptal", mask: string, coin: unknown): string {
  const tag = payoutCoinShort(coin);
  const coinBit = tag ? ` ${tag}.` : "";
  if (phase === "gitti") return `Gitti. Tutar gönderildi.${coinBit} Cüzdan ${mask}.`;
  if (phase === "iptal") return `İptal. Talep durduruldu.${coinBit} Cüzdan ${mask}.`;
  return `Bekliyor. Tutar beklemeye alındı.${coinBit} Cüzdan ${mask}.`;
}

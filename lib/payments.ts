import { CARD_TYPES, KIND_LABEL } from "./catalog";
import { formatDay, formatWhen, istanbulKey, movementLabel, parseTryToKurus } from "./format";
import { networkOf } from "./pan";
import type { Card, CardTypeId, Tx, TxKind } from "./types";

export type PayBucket = "basarili" | "beklemede" | "reddedildi" | "iptal" | "iade" | "nakit" | "diger";

export type PayTone = "ok" | "hold" | "bad" | "mute" | "refund" | "cash";

export const PAY_TILES: { id: Exclude<PayBucket, "diger">; label: string; tone: PayTone }[] = [
  { id: "basarili", label: "Başarılı", tone: "ok" },
  { id: "beklemede", label: "Beklemede", tone: "hold" },
  { id: "reddedildi", label: "Reddedildi", tone: "bad" },
  { id: "iptal", label: "İptal", tone: "mute" },
  { id: "iade", label: "İade", tone: "refund" },
  { id: "nakit", label: "Cashback", tone: "cash" },
];

const NETWORK: Record<CardTypeId, string> = {
  facebook_ads: "Mastercard",
  tiktok: "Mastercard",
  google_ads: "Visa",
  ultima: "Visa",
};

function networkLabel(card: Card): string {
  const mark = networkOf(card.bin || card.pan);
  if (mark === "visa") return "Visa";
  if (mark === "mastercard") return "Mastercard";
  return NETWORK[card.type];
}

const KINDS = new Set<TxKind>(["yukleme", "harcama", "iade", "basim", "duzeltme", "yenileme", "transfer"]);

export type PaymentQuery = {
  tur: string;
  durum: string;
  kart: string;
  q: string;
  bas: string;
  bit: string;
  enaz: string;
  encok: string;
};

export function blankPaymentQuery(): PaymentQuery {
  return { tur: "", durum: "", kart: "", q: "", bas: "", bit: "", enaz: "", encok: "" };
}

export function paymentQueryFrom(source: Record<string, string | undefined>): PaymentQuery {
  const pick = (key: keyof PaymentQuery) => source[key]?.trim() || "";
  return {
    tur: pick("tur"),
    durum: pick("durum"),
    kart: pick("kart"),
    q: pick("q"),
    bas: pick("bas"),
    bit: pick("bit"),
    enaz: pick("enaz"),
    encok: pick("encok"),
  };
}

export function paymentHref(path: string, current: PaymentQuery, patch: Partial<PaymentQuery> = {}): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

export function payoutPhase(entry: Tx): "bekliyor" | "gitti" | "iptal" | null {
  const note = typeof entry.note === "string" ? entry.note : "";
  const title = typeof entry.title === "string" ? entry.title : "";
  const ref = typeof entry.ref === "string" ? entry.ref : "";
  if (ref.endsWith(":iptal") || title === "Çekim iadesi") return "iptal";
  if (note.startsWith("Gitti.")) return "gitti";
  if (note.startsWith("İptal.")) return "iptal";
  if (note.startsWith("Bekliyor.") || title === "Çekim talebi") return "bekliyor";
  return null;
}

export function payBucket(entry: Tx): PayBucket {
  if (entry.status === "reddedildi") return "reddedildi";
  const phase = payoutPhase(entry);
  if (phase === "bekliyor") return "beklemede";
  if (phase === "iptal") {
    const ref = typeof entry.ref === "string" ? entry.ref : "";
    if (ref.endsWith(":iptal") || entry.title === "Çekim iadesi") return "iade";
    return "iptal";
  }
  if (entry.kind === "iade") return "iade";
  if (typeof entry.title === "string" && entry.title.startsWith("Basım iadesi")) return "iptal";
  if (entry.kind === "harcama") return "basarili";
  return "diger";
}

export function payTone(bucket: PayBucket): PayTone {
  if (bucket === "basarili") return "ok";
  if (bucket === "beklemede") return "hold";
  if (bucket === "reddedildi") return "bad";
  if (bucket === "iade") return "refund";
  if (bucket === "nakit") return "cash";
  return "mute";
}

export function payStatusLabel(entry: Tx): string {
  const phase = payoutPhase(entry);
  if (phase === "bekliyor") return "Bekliyor";
  if (phase === "gitti") return "Gitti";
  if (phase === "iptal") return "İptal";
  const bucket = payBucket(entry);
  return PAY_TILES.find((tile) => tile.id === bucket)?.label ?? KIND_LABEL[entry.kind];
}

export function filterLedger(entries: Tx[], query: PaymentQuery): Tx[] {
  const minKurus = query.enaz ? parseTryToKurus(query.enaz) : null;
  const maxKurus = query.encok ? parseTryToKurus(query.encok) : null;
  const needle = query.q.toLocaleLowerCase("tr-TR");
  return entries.filter((entry) => {
    if (query.tur === "reddedilen" && entry.status !== "reddedildi") return false;
    if (query.tur && query.tur !== "reddedilen" && KINDS.has(query.tur as TxKind) && entry.kind !== query.tur) return false;
    if (query.durum && payBucket(entry) !== query.durum) return false;
    if (query.kart && entry.cardId !== query.kart) return false;
    if (needle && !`${entry.title} ${entry.note}`.toLocaleLowerCase("tr-TR").includes(needle)) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(query.bas) && istanbulKey(entry.createdAt) < query.bas) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(query.bit) && istanbulKey(entry.createdAt) > query.bit) return false;
    if (minKurus !== null && Math.abs(entry.amount) < minKurus) return false;
    if (maxKurus !== null && Math.abs(entry.amount) > maxKurus) return false;
    return true;
  });
}

export function bucketTotals(entries: Tx[]): Record<Exclude<PayBucket, "diger">, number> {
  const totals = { basarili: 0, beklemede: 0, reddedildi: 0, iptal: 0, iade: 0, nakit: 0 };
  for (const entry of entries) {
    const bucket = payBucket(entry);
    if (bucket === "diger") continue;
    totals[bucket] += Math.abs(entry.amount);
  }
  return totals;
}

export type PaymentRow = {
  id: string;
  day: string;
  when: string;
  cardLabel: string;
  last4: string;
  network: string;
  typeName: string;
  title: string;
  detail: string;
  amountLabel: string;
  incoming: boolean;
  rejected: boolean;
  status: string;
  tone: PayTone;
};

export function presentPayments(entries: Tx[], cards: Card[]): PaymentRow[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return entries.map((entry) => {
    const card = entry.cardId ? byId.get(entry.cardId) : undefined;
    const bucket = payBucket(entry);
    const phase = payoutPhase(entry);
    const tone = phase === "gitti" ? "ok" : phase === "bekliyor" ? "hold" : payTone(bucket);
    return {
      id: entry.id,
      day: formatDay(entry.createdAt),
      when: formatWhen(entry.createdAt),
      cardLabel: card?.label ?? "Cüzdan",
      last4: card && typeof card.pan === "string" ? card.pan.slice(-4) : "",
      network: card ? networkLabel(card) : "",
      typeName: card ? (CARD_TYPES[card.type]?.name ?? "Kart") : "Hesap",
      title: typeof entry.title === "string" ? entry.title : "",
      detail: typeof entry.note === "string" ? entry.note : "",
      amountLabel: movementLabel(entry.amount, entry.usdMinor),
      incoming: entry.amount > 0 || (entry.amount === 0 && (entry.usdMinor ?? 0) > 0),
      rejected: entry.status === "reddedildi",
      status: payStatusLabel(entry),
      tone,
    };
  });
}

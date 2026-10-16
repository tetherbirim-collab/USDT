import { usdMinorToKurus } from "./catalog";

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

export function formatTL(kurus: number): string {
  const value = typeof kurus === "number" ? kurus : Number(kurus);
  return money.format((Number.isFinite(value) ? value : 0) / 100);
}

export function formatSigned(kurus: number): string {
  const abs = formatTL(Math.abs(kurus));
  if (kurus > 0) return `+${abs}`;
  if (kurus < 0) return `−${abs}`;
  return abs;
}

export function parseTryToKurus(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [lira, frac = ""] = normalized.split(".");
  const kurus = Number(lira) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(kurus)) return null;
  return kurus;
}

export function parseSignedTryToKurus(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace("−", "-");
  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed.replace(/^\+/, "");
  const amount = parseTryToKurus(body);
  if (amount === null) return null;
  return negative ? -amount : amount;
}

export function kurusToInput(kurus: number): string {
  const sign = kurus < 0 ? "-" : "";
  const abs = Math.abs(kurus);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${Math.floor(abs / 100)},${frac}`;
}

function validDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function istanbulInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00+03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function isoToIstanbulInput(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

export function formatPan(pan: string): string {
  return String(pan ?? "").replace(/(.{4})/g, "$1 ").trim();
}

const PLAN_PERIOD_MS = 30 * 86_400_000;

export function planEndsAt(createdAt: string, planUntil: string | null | undefined, now = Date.now()): string {
  const stored = planUntil ? Date.parse(planUntil) : Number.NaN;
  const anchor = Number.isFinite(stored) ? stored : Date.parse(createdAt);
  if (!Number.isFinite(anchor)) return new Date(now + PLAN_PERIOD_MS).toISOString();
  if (Number.isFinite(stored) && now < stored) return new Date(stored).toISOString();
  if (now <= anchor) return new Date(anchor + PLAN_PERIOD_MS).toISOString();
  const cycles = Math.floor((now - anchor) / PLAN_PERIOD_MS) + 1;
  return new Date(anchor + cycles * PLAN_PERIOD_MS).toISOString();
}

export function daysUntil(iso: string, now = Date.now()): number {
  const due = Date.parse(`${istanbulKey(iso)}T00:00:00+03:00`);
  const today = Date.parse(`${istanbulKey(new Date(now).toISOString())}T00:00:00+03:00`);
  if (!Number.isFinite(due) || !Number.isFinite(today)) return 0;
  return Math.round((due - today) / 86_400_000);
}

export function daysLeftLine(days: number): string {
  if (days > 1) return `${days} gün kaldı`;
  if (days === 1) return "1 gün kaldı";
  if (days === 0) return "Bugün";
  return "Günü geçti";
}

export function formatDay(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function plusDaysIso(iso: string, days: number): string {
  const date = validDate(iso) ?? new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function formatWhen(iso: string): string {
  const d = validDate(iso);
  if (!d) return "";
  const date = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date} ${time}`;
}

export function istanbulKey(iso: string): string {
  const date = validDate(iso);
  if (!date) return "1970-01-01";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function holderLine(name: string): string {
  return name.toLocaleUpperCase("tr-TR").slice(0, 24);
}

/** Short public order number. The same sum runs in the PHP ledger. */
export function orderCodeFrom(seed: string, taken?: Set<string>): string {
  let n = 7;
  for (const ch of seed) n = (n * 131 + ch.charCodeAt(0)) % 900000;
  for (let step = 0; step < 900000; step += 1) {
    const code = `Clay-${100000 + ((n + step) % 900000)}`;
    if (!taken?.has(code)) return code;
  }
  return `Clay-${100000 + n}`;
}

export function showOrderCode(row: { code?: string | null; cardId?: string | null; id?: string | null }): string {
  if (typeof row.code === "string" && /^Clay-\d{6}$/.test(row.code)) return row.code;
  return orderCodeFrom(row.cardId || row.id || "clay");
}

export function orderPhrase(code: string): string {
  return `${code} numaralı sipariş`;
}

/** Same folding as the PHP ledger, so a Turkish answer matches later. */
export function foldAnswer(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("İ", "i")
    .replaceAll("I", "ı")
    .replaceAll("Ş", "ş")
    .replaceAll("Ğ", "ğ")
    .replaceAll("Ü", "ü")
    .replaceAll("Ö", "ö")
    .replaceAll("Ç", "ç")
    .toLowerCase();
}

export function movementLabel(amount: number, usdMinor?: number | null): string {
  if (amount === 0 && usdMinor) {
    const kurus = usdMinorToKurus(Math.abs(usdMinor));
    return formatSigned(usdMinor < 0 ? -kurus : kurus);
  }
  return formatSigned(amount);
}

export function formatUsd(minor: number): string {
  const text = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
  return `${text} USD`;
}

export function formatRate(rate: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(rate);
}

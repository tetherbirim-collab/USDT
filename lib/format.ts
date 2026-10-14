const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

export function formatTL(kurus: number): string {
  return money.format(kurus / 100);
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

export function istanbulInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00+03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function isoToIstanbulInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

export function formatPan(pan: string): string {
  return pan.replace(/(.{4})/g, "$1 ").trim();
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function holderLine(name: string): string {
  return name.toLocaleUpperCase("tr-TR").slice(0, 24);
}

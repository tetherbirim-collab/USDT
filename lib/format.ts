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

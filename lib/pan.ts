import { TEST_BIN } from "./catalog";

/** Luhn check digit for a payload that does not yet include the check digit. */
export function luhnCheckDigit(payload: string): string {
  let sum = 0;
  let doubleIt = true;
  for (let i = payload.length - 1; i >= 0; i -= 1) {
    let digit = Number(payload[i]);
    if (doubleIt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleIt = !doubleIt;
  }
  return String((10 - (sum % 10)) % 10);
}

export function luhnOk(num: string): boolean {
  let sum = 0;
  let doubleIt = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let digit = Number(num[i]);
    if (Number.isNaN(digit)) return false;
    if (doubleIt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleIt = !doubleIt;
  }
  return sum % 10 === 0;
}

export const BIN_PATTERN = /^\d{4,8}$/;

/** Visa starts with 4. Mastercard starts with 5, or the 2-series. */
export function networkOf(prefix: string): "visa" | "mastercard" | null {
  const digits = prefix.replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("5") || digits.startsWith("2")) return "mastercard";
  return null;
}

/** Purchase preview: keep the chosen BIN and fill the rest of the 16 digits with X. */
export function previewPan(bin: string): string {
  const digits = bin.replace(/\D/g, "").slice(0, 15);
  const line = `${digits}${"X".repeat(16)}`.slice(0, 16);
  return line.replace(/(.{4})/g, "$1 ").trim();
}

/** Demo PAN. Prefix is the BIN stored on the card; the rest is a local serial plus a Luhn digit. */
export function makePan(serial: number, bin = TEST_BIN): string {
  if (!BIN_PATTERN.test(bin)) throw new Error("BIN rakamları geçersiz");
  if (!Number.isInteger(serial) || serial < 0) throw new Error("Geçersiz simülasyon seri numarası");
  const accountLen = 15 - bin.length;
  const body = `${bin}${String(serial % 10 ** accountLen).padStart(accountLen, "0")}`;
  return body + luhnCheckDigit(body);
}

export function makeCvv(serial: number): string {
  return String((serial * 97 + 13) % 900 + 100);
}

export function makeExpiry(from = new Date()): string {
  const month = ((from.getUTCMonth() + 8) % 12) + 1;
  const year = (from.getUTCFullYear() + 3) % 100;
  return `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}`;
}

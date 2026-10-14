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

/** Fake demo PAN. Always the reserved test BIN, never a live account number. */
export function makePan(serial: number): string {
  if (!Number.isInteger(serial) || serial < 0 || serial > 999_999_999) {
    throw new Error("Geçersiz simülasyon seri numarası");
  }
  const body = `${TEST_BIN}${String(serial).padStart(9, "0")}`;
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

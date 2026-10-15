import { istanbulKey } from "./format";
import type { Tx } from "./types";

export function monthSpend(transactions: Tx[], now = new Date()): number {
  const month = istanbulKey(now.toISOString()).slice(0, 7);
  return transactions
    .filter(
      (entry) =>
        entry.kind === "harcama" &&
        entry.status === "tamamlandi" &&
        istanbulKey(entry.createdAt).startsWith(month),
    )
    .reduce((sum, entry) => sum + -entry.amount, 0);
}

export function monthTopup(transactions: Tx[], now = new Date()): number {
  const month = istanbulKey(now.toISOString()).slice(0, 7);
  return transactions
    .filter(
      (entry) =>
        entry.kind === "yukleme" &&
        entry.amount > 0 &&
        entry.status === "tamamlandi" &&
        istanbulKey(entry.createdAt).startsWith(month),
    )
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function last7Spend(transactions: Tx[], now = new Date()) {
  const days: { key: string; label: string; total: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const cursor = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const key = istanbulKey(cursor.toISOString());
    const total = transactions
      .filter(
        (entry) =>
          entry.kind === "harcama" &&
          entry.status === "tamamlandi" &&
          istanbulKey(entry.createdAt) === key,
      )
      .reduce((sum, entry) => sum + -entry.amount, 0);
    days.push({ key, label: key.slice(8), total });
  }
  return days;
}

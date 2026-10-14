import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { WELCOME_BONUS_KURUS } from "./catalog";
import { holderLine } from "./format";
import { luhnOk, makeCvv, makeExpiry, makePan } from "./pan";
import { hashPassword } from "./password";
import type { Card, CardTypeId, DB, Tx, User } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "sanalkart.json");

function tx(partial: Omit<Tx, "note"> & { note?: string }): Tx {
  return { note: "", ...partial };
}

function createSeed(): DB {
  const demoId = "usr_demo";
  const reklam: Card = {
    id: "crd_reklam",
    userId: demoId,
    type: "reklam",
    label: "Kuzey Kampanya",
    limit: 2_500_000,
    spent: 0,
    pan: makePan(100_000_001),
    expiry: "08/28",
    cvv: makeCvv(100_000_001),
    holder: "DEMO KULLANICI",
    status: "aktif",
    createdAt: "2026-09-28T09:04:00.000Z",
  };
  const alisveris: Card = {
    id: "crd_alisveris",
    userId: demoId,
    type: "alisveris",
    label: "Pazar Sepeti",
    limit: 1_000_000,
    spent: 0,
    pan: makePan(100_000_002),
    expiry: "03/29",
    cvv: makeCvv(100_000_002),
    holder: "DEMO KULLANICI",
    status: "aktif",
    createdAt: "2026-10-05T08:39:00.000Z",
  };
  const abonelik: Card = {
    id: "crd_abonelik",
    userId: demoId,
    type: "abonelik",
    label: "Araçlar",
    limit: 400_000,
    spent: 0,
    pan: makePan(100_000_003),
    expiry: "11/27",
    cvv: makeCvv(100_000_003),
    holder: "DEMO KULLANICI",
    status: "donduruldu",
    createdAt: "2026-10-08T08:59:00.000Z",
  };

  const user: User = {
    id: demoId,
    name: "Demo Kullanıcı",
    email: "demo@sanalkart.local",
    passwordHash: hashPassword("demo123"),
    balance: 0,
    plan: "atolye",
    createdAt: "2026-09-28T09:00:00.000Z",
  };

  const transactions: Tx[] = [
    tx({
      id: "tx_01",
      userId: demoId,
      cardId: null,
      kind: "yukleme",
      title: "Simülasyon yüklemesi",
      amount: 2_000_000,
      status: "tamamlandi",
      createdAt: "2026-09-28T09:00:00.000Z",
    }),
    tx({
      id: "tx_02",
      userId: demoId,
      cardId: reklam.id,
      kind: "basim",
      title: "Basım · Kuzey Kampanya",
      note: "Simülasyon basım ücreti",
      amount: -2900,
      status: "tamamlandi",
      createdAt: "2026-09-28T09:05:00.000Z",
    }),
    tx({
      id: "tx_03",
      userId: demoId,
      cardId: reklam.id,
      kind: "harcama",
      title: "Kuzey Ajans Medya",
      amount: -186_000,
      status: "tamamlandi",
      createdAt: "2026-09-30T14:10:00.000Z",
    }),
    tx({
      id: "tx_04",
      userId: demoId,
      cardId: reklam.id,
      kind: "harcama",
      title: "Vitrin Reklam Ağı",
      amount: -240_000,
      status: "tamamlandi",
      createdAt: "2026-10-02T11:20:00.000Z",
    }),
    tx({
      id: "tx_05",
      userId: demoId,
      cardId: reklam.id,
      kind: "harcama",
      title: "Sahne Reklam",
      amount: -60_000,
      status: "tamamlandi",
      createdAt: "2026-10-04T16:00:00.000Z",
    }),
    tx({
      id: "tx_06",
      userId: demoId,
      cardId: null,
      kind: "yukleme",
      title: "Simülasyon yüklemesi",
      amount: 800_000,
      status: "tamamlandi",
      createdAt: "2026-10-05T08:30:00.000Z",
    }),
    tx({
      id: "tx_07",
      userId: demoId,
      cardId: alisveris.id,
      kind: "basim",
      title: "Basım · Pazar Sepeti",
      note: "Simülasyon basım ücreti",
      amount: -2900,
      status: "tamamlandi",
      createdAt: "2026-10-05T08:40:00.000Z",
    }),
    tx({
      id: "tx_08",
      userId: demoId,
      cardId: alisveris.id,
      kind: "harcama",
      title: "Tezgah Pazaryeri",
      amount: -129_000,
      status: "tamamlandi",
      createdAt: "2026-10-06T13:15:00.000Z",
    }),
    tx({
      id: "tx_09",
      userId: demoId,
      cardId: alisveris.id,
      kind: "harcama",
      title: "Ada Kargo Sim",
      amount: -85_500,
      status: "tamamlandi",
      createdAt: "2026-10-07T10:05:00.000Z",
    }),
    tx({
      id: "tx_10",
      userId: demoId,
      cardId: abonelik.id,
      kind: "basim",
      title: "Basım · Araçlar",
      note: "Simülasyon basım ücreti",
      amount: -2900,
      status: "tamamlandi",
      createdAt: "2026-10-08T09:00:00.000Z",
    }),
    tx({
      id: "tx_11",
      userId: demoId,
      cardId: abonelik.id,
      kind: "harcama",
      title: "Bulut Kalem",
      amount: -99_000,
      status: "tamamlandi",
      createdAt: "2026-10-08T19:40:00.000Z",
    }),
    tx({
      id: "tx_12",
      userId: demoId,
      cardId: abonelik.id,
      kind: "harcama",
      title: "Nota Stüdyo",
      amount: -90_000,
      status: "tamamlandi",
      createdAt: "2026-10-10T07:55:00.000Z",
    }),
    tx({
      id: "tx_13",
      userId: demoId,
      cardId: alisveris.id,
      kind: "iade",
      title: "Tezgah Pazaryeri iadesi",
      note: "Simüle iade",
      amount: 35_000,
      status: "tamamlandi",
      createdAt: "2026-10-11T15:12:00.000Z",
    }),
    tx({
      id: "tx_14",
      userId: demoId,
      cardId: alisveris.id,
      kind: "harcama",
      title: "Mavi Otel Prova",
      amount: -42_000,
      status: "tamamlandi",
      createdAt: "2026-10-12T18:05:00.000Z",
    }),
    tx({
      id: "tx_15",
      userId: demoId,
      cardId: abonelik.id,
      kind: "harcama",
      title: "Nota Stüdyo",
      note: "Kart dondurulmuş",
      amount: -12_000,
      status: "reddedildi",
      createdAt: "2026-10-13T12:00:00.000Z",
    }),
    tx({
      id: "tx_16",
      userId: demoId,
      cardId: reklam.id,
      kind: "harcama",
      title: "Vitrin Reklam Ağı",
      amount: -64_000,
      status: "tamamlandi",
      createdAt: "2026-10-14T08:20:00.000Z",
    }),
  ];

  const db: DB = {
    users: [user],
    cards: [reklam, alisveris, abonelik],
    transactions,
    nextSerial: 100_000_004,
  };
  applyLedger(db);
  return db;
}

function applyLedger(db: DB) {
  for (const user of db.users) user.balance = 0;
  for (const card of db.cards) card.spent = 0;
  const ordered = [...db.transactions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  for (const entry of ordered) {
    if (entry.status !== "tamamlandi") continue;
    const user = db.users.find((item) => item.id === entry.userId);
    if (!user) continue;
    user.balance += entry.amount;
    if (!entry.cardId) continue;
    const card = db.cards.find((item) => item.id === entry.cardId);
    if (!card) continue;
    if (entry.kind === "harcama") card.spent += -entry.amount;
    if (entry.kind === "iade") card.spent -= entry.amount;
  }
}

function assertDb(db: DB) {
  for (const user of db.users) {
    if (user.balance < 0) throw new Error("Simülasyon bakiyesi eksi olamaz");
  }
  for (const card of db.cards) {
    if (!card.pan.startsWith("400000") || card.pan.length !== 16 || !luhnOk(card.pan)) {
      throw new Error("Kart numarası test BIN kuralına uymuyor");
    }
    if (card.spent < 0 || card.spent > card.limit) {
      throw new Error("Kart harcaması limit dışında");
    }
  }
}

function write(db: DB) {
  mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, DATA_PATH);
}

function read(): DB {
  if (!existsSync(DATA_PATH)) {
    const seeded = createSeed();
    assertDb(seeded);
    write(seeded);
    return seeded;
  }
  const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as DB;
  if (!parsed.users || !parsed.cards || !parsed.transactions) {
    throw new Error("Simülasyon verisi okunamadı");
  }
  return parsed;
}

export function mutate<T>(fn: (db: DB) => T): T {
  const db = read();
  const result = fn(db);
  assertDb(db);
  write(db);
  return result;
}

export function snapshot(): DB {
  return read();
}

export function findUserByEmail(email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  return read().users.find((user) => user.email === needle);
}

export function findUserById(id: string): User | undefined {
  return read().users.find((user) => user.id === id);
}

export function createUser(input: { name: string; email: string; password: string }): User {
  return mutate((db) => {
    const user: User = {
      id: `usr_${randomUUID()}`,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: hashPassword(input.password),
      balance: WELCOME_BONUS_KURUS,
      plan: "kivilcim",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: user.id,
      cardId: null,
      kind: "yukleme",
      title: "Hoş geldin simülasyon bakiyesi",
      note: "Gerçek tahsilat yoktur.",
      amount: WELCOME_BONUS_KURUS,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return user;
  });
}

export function listCards(userId: string): Card[] {
  const rank = { aktif: 0, donduruldu: 1, kapali: 2 };
  return read()
    .cards.filter((card) => card.userId === userId)
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt),
    );
}

export function listTransactions(userId: string): Tx[] {
  return read()
    .transactions.filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function openCardCount(db: DB, userId: string): number {
  return db.cards.filter((card) => card.userId === userId && card.status !== "kapali").length;
}

export function issueCard(
  db: DB,
  input: { userId: string; type: CardTypeId; label: string; limit: number; fee: number },
): Card {
  const user = db.users.find((item) => item.id === input.userId);
  if (!user) throw new Error("Hesap yok");
  const serial = db.nextSerial;
  db.nextSerial += 1;
  const now = new Date().toISOString();
  const card: Card = {
    id: `crd_${randomUUID()}`,
    userId: user.id,
    type: input.type,
    label: input.label,
    limit: input.limit,
    spent: 0,
    pan: makePan(serial),
    expiry: makeExpiry(),
    cvv: makeCvv(serial),
    holder: holderLine(user.name),
    status: "aktif",
    createdAt: now,
  };
  user.balance -= input.fee;
  db.cards.push(card);
  db.transactions.push({
    id: `tx_${randomUUID()}`,
    userId: user.id,
    cardId: card.id,
    kind: "basim",
    title: `Basım · ${card.label}`,
    note: "Simülasyon basım ücreti. Kart gerçek üye işyerinde kullanılamaz.",
    amount: -input.fee,
    status: "tamamlandi",
    createdAt: now,
  });
  return card;
}

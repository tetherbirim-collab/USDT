import { CARD_PREP_MS, CARD_TYPE_ORDER, CARD_TYPES, MAX_BALANCE_KURUS, MAX_USD_MINOR, MIN_USD_MINOR, TEST_BIN, USD_RATE_AS_OF, USD_SELL_RATE, WELCOME_BONUS_KURUS, WELCOME_USD_MINOR, defaultSettings, merchantsFor, usdMinorToKurus } from "./catalog";
import { formatRate, formatTL, formatUsd, holderLine, istanbulKey } from "./format";
import { luhnOk, makeCvv, makeExpiry, makePan } from "./pan";
import type { BinRow, Card, CardTypeId, DB, Order, PublicUser, Tx, User } from "./types";

const LEDGER_KEY = "clay-ledger-v1";

function rid() {
  return globalThis.crypto.randomUUID();
}

export function pushNotice(
  db: DB,
  input: { userId: string; title: string; body: string; ref?: string | null },
) {
  if (input.ref && db.notices.some((note) => note.ref === input.ref)) return;
  db.notices.push({
    id: `nt_${rid()}`,
    userId: input.userId,
    batch: rid(),
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    readAt: null,
    ref: input.ref ?? null,
  });
}

let cache: DB | null = null;
let booted = false;
let remoteMode = false;
let remoteMe: PublicUser | null = null;
let bootPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const CARD_FEE_STEP_MS = 30 * 86_400_000;

export function remoteSession(): { mode: boolean; me: PublicUser | null } {
  return { mode: remoteMode, me: remoteMe };
}

export function usingRemoteLedger(): boolean {
  return remoteMode;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeLedger(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ledgerSnapshot(): DB | null {
  return booted ? cache : null;
}

export function readSettings() {
  return read().settings;
}

export function bootLedger() {
  if (booted || bootPromise) return;
  bootPromise = (async () => {
    const remote = await probeRemote();
    if (!remote) read();
    booted = true;
    emit();
  })();
}

export function touchLedger() {
  if (!cache) return;
  if (remoteMode) {
    void remoteCall("state", {});
    return;
  }
  normalize(cache);
}

async function probeRemote(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const response = await fetch("/api/ledger.php", {
      method: "POST",
      credentials: "same-origin",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Clay": "1",
      },
      body: JSON.stringify({ action: "state" }),
    });
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith("{")) return false;
    const data = JSON.parse(trimmed) as { mode?: string; me?: PublicUser | null; db?: DB };
    if (data.mode !== "php" || !data.db?.settings || !Array.isArray(data.db.bins)) return false;
    cache = data.db;
    remoteMode = true;
    remoteMe = data.me ?? null;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function remoteCall(
  action: string,
  fields: Record<string, string>,
): Promise<{ code: string; id?: string } | null> {
  if (!remoteMode) return null;
  try {
    const response = await fetch("/api/ledger.php", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Clay": "1",
      },
      body: JSON.stringify({ action, ...fields }),
    });
    const text = await response.text();
    const data = JSON.parse(text) as { mode?: string; code?: string; me?: PublicUser | null; db?: DB; id?: string };
    if (data.mode !== "php" || !data.db?.settings) return { code: "e-defter" };
    if (!Array.isArray(data.db.payouts)) data.db.payouts = [];
    cache = data.db;
    remoteMe = data.me ?? null;
    if (booted) emit();
    return { code: String(data.code ?? ""), id: data.id };
  } catch {
    return { code: "e-defter" };
  }
}

function tx(partial: Omit<Tx, "note"> & { note?: string }): Tx {
  return { note: "", ...partial };
}

function createSeed(): DB {
  const demoId = "usr_demo";
  const reklam: Card = {
    id: "crd_reklam",
    userId: demoId,
    type: "facebook_ads",
    label: "Akış Kampanyası",
    limit: 2_500_000,
    spent: 0,
    pan: makePan(100_000_001),
    bin: "400000",
    binLabel: "Standart",
    expiry: "08/28",
    cvv: makeCvv(100_000_001),
    holder: holderLine("Clay Üye"),
    status: "aktif",
    readyAt: null,
    period: 1,
    createdAt: "2026-09-28T09:04:00.000Z",
  };
  const alisveris: Card = {
    id: "crd_alisveris",
    userId: demoId,
    type: "tiktok",
    label: "Kısa Video",
    limit: 1_000_000,
    spent: 0,
    pan: makePan(100_000_002),
    bin: "400000",
    binLabel: "Standart",
    expiry: "03/29",
    cvv: makeCvv(100_000_002),
    holder: holderLine("Clay Üye"),
    status: "aktif",
    readyAt: null,
    period: 1,
    createdAt: "2026-10-05T08:39:00.000Z",
  };
  const abonelik: Card = {
    id: "crd_abonelik",
    userId: demoId,
    type: "google_ads",
    label: "Arama Kampanyası",
    limit: 400_000,
    spent: 0,
    pan: makePan(100_000_003),
    bin: "400000",
    binLabel: "Standart",
    expiry: "11/27",
    cvv: makeCvv(100_000_003),
    holder: holderLine("Clay Üye"),
    status: "donduruldu",
    readyAt: null,
    period: 1,
    createdAt: "2026-10-08T08:59:00.000Z",
  };

  const user: User = {
    id: demoId,
    name: "Clay Üye",
    username: "demo",
    password: "demo123",
    balance: 0,
    usdMinor: 0,
    plan: "atolye",
    role: "uye",
    status: "acik",
    address: "",
    createdAt: "2026-09-28T09:00:00.000Z",
  };

  const transactions: Tx[] = [
    tx({
      id: "tx_01",
      userId: demoId,
      cardId: null,
      kind: "yukleme",
      title: "Bakiye yüklemesi",
      amount: 2_000_000,
      status: "tamamlandi",
      createdAt: "2026-09-28T09:00:00.000Z",
    }),
    tx({
      id: "tx_02",
      userId: demoId,
      cardId: reklam.id,
      kind: "basim",
      title: "Basım · Akış Kampanyası",
      note: "Basım ücreti",
      amount: -4500,
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
      title: "Bakiye yüklemesi",
      amount: 800_000,
      status: "tamamlandi",
      createdAt: "2026-10-05T08:30:00.000Z",
    }),
    tx({
      id: "tx_07",
      userId: demoId,
      cardId: alisveris.id,
      kind: "basim",
      title: "Basım · Kısa Video",
      note: "Basım ücreti",
      amount: -3900,
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
      title: "Basım · Arama Kampanyası",
      note: "Basım ücreti",
      amount: -4500,
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
      note: "İade",
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
    tx({
      id: "tx_17",
      userId: demoId,
      cardId: "crd_ultima",
      kind: "basim",
      title: "Basım · Ultima",
      note: "Basım ücreti",
      amount: -7900,
      status: "tamamlandi",
      createdAt: "2026-10-09T09:10:00.000Z",
    }),
  ];

  const ultima: Card = {
    id: "crd_ultima",
    userId: demoId,
    type: "ultima",
    label: "Ultima",
    limit: 5_000_000,
    spent: 0,
    pan: makePan(100_000_004),
    bin: "400000",
    binLabel: "Standart",
    expiry: "01/30",
    cvv: makeCvv(100_000_004),
    holder: holderLine("Clay Üye"),
    status: "aktif",
    readyAt: null,
    period: 1,
    createdAt: "2026-10-09T09:10:00.000Z",
  };

  const db: DB = {
    users: [user, adminRecord()],
    cards: [reklam, alisveris, abonelik, ultima],
    transactions,
    notices: [],
    tickets: [],
    bins: testBins(),
    orders: [],
    payouts: [],
    settings: defaultSettings(),
    nextSerial: 100_000_005,
  };
  db.orders = ordersFromCards(db);
  applyLedger(db);
  return db;
}

function ordersFromCards(db: DB): Order[] {
  return db.cards.map((card) => {
    const feeTx = db.transactions.find((entry) => entry.cardId === card.id && entry.kind === "basim");
    return {
      id: `ord_${card.id}`,
      userId: card.userId,
      cardId: card.id,
      type: card.type,
      label: card.label,
      limit: card.limit,
      fee: feeTx ? Math.abs(feeTx.amount) : CARD_TYPES[card.type].fee,
      status: card.status === "hazirlaniyor" ? "hazirlaniyor" : "hazir",
      createdAt: card.createdAt,
      readyAt: card.status === "hazirlaniyor" ? card.readyAt : null,
    };
  });
}

function testBins(): BinRow[] {
  return CARD_TYPE_ORDER.map((type) => ({
    id: `bin_${type}`,
    type,
    label: "Standart",
    digits: TEST_BIN,
  }));
}

function ensureTestBins(db: DB) {
  for (const type of CARD_TYPE_ORDER) {
    if (db.bins.some((row) => row.type === type)) continue;
    db.bins.push({
      id: `bin_${type}`,
      type,
      label: "Standart",
      digits: TEST_BIN,
    });
  }
}

function applyLedger(db: DB) {
  for (const user of db.users) {
    user.balance = 0;
    user.usdMinor = 0;
  }
  for (const card of db.cards) card.spent = 0;
  const ordered = [...db.transactions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  for (const entry of ordered) {
    if (entry.status !== "tamamlandi") continue;
    if (entry.kind === "transfer") continue;
    const user = db.users.find((item) => item.id === entry.userId);
    if (!user) continue;
    user.balance += entry.amount;
    if (typeof entry.usdMinor === "number") user.usdMinor += entry.usdMinor;
    if (!entry.cardId) continue;
    const card = db.cards.find((item) => item.id === entry.cardId);
    if (!card) continue;
    if (entry.kind === "yenileme") card.spent = 0;
    if (entry.kind === "harcama") card.spent += -entry.amount;
    if (entry.kind === "iade") card.spent -= entry.amount;
  }
}

function adminRecord(): User {
  return {
    id: "usr_admin",
    name: "CLAY Yönetici",
    username: "clayadmin",
    password: "clayadmin",
    balance: 0,
    usdMinor: 0,
    plan: "kivilcim",
    role: "yonetici",
    status: "acik",
    address: "",
    createdAt: "2026-09-01T08:00:00.000Z",
  };
}

type LegacyUser = User & {
  email?: string;
  passwordHash?: string;
  username?: string;
  password?: string;
};

function usernameFromLegacy(user: LegacyUser): string {
  if (user.username && /^[a-z0-9_]{2,24}$/.test(user.username)) return user.username;
  if (user.email === "admin@sanalkart.local") return "clayadmin";
  if (user.email === "demo@sanalkart.local") return "demo";
  const local = (user.email ?? "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  return local.slice(0, 24) || "uye";
}

function sweepCardFees(db: DB): boolean {
  const now = Date.now();
  const fee = db.settings.issueFeeKurus;
  let dirty = false;
  for (const card of db.cards) {
    if (card.id.startsWith("crd_pst_")) continue;
    if (card.status === "kapali") continue;
    const start = Date.parse(card.createdAt);
    if (!Number.isFinite(start)) continue;
    const user = db.users.find((item) => item.id === card.userId);
    if (!user) continue;
    let due = start + CARD_FEE_STEP_MS;
    let guard = 0;
    while (due <= now && guard < 36) {
      guard += 1;
      const ref = `kart-odeme:${card.id}:${due}`;
      if (db.transactions.some((entry) => entry.ref === ref)) {
        due += CARD_FEE_STEP_MS;
        continue;
      }
      if (fee <= 0) {
        due += CARD_FEE_STEP_MS;
        continue;
      }
      if (user.balance < fee) {
        const noticeRef = `kart-odeme-yok:${card.id}:${due}`;
        if (!db.notices.some((note) => note.ref === noticeRef)) {
          pushNotice(db, {
            userId: user.id,
            title: "Kart ödemesi bekliyor",
            body: `${card.label} kartının ${formatTL(fee)} ödemesi için bakiye yetmedi. Kart açık kaldı.`,
            ref: noticeRef,
          });
          dirty = true;
        }
        break;
      }
      user.balance -= fee;
      db.transactions.push({
        id: `tx_${rid()}`,
        userId: user.id,
        cardId: card.id,
        kind: "duzeltme",
        title: `Kart ödemesi · ${card.label}`,
        note: "30 günlük kart bedeli.",
        amount: -fee,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: new Date().toISOString(),
        ref,
      });
      pushNotice(db, {
        userId: user.id,
        title: "Kart ödemesi düştü",
        body: `${card.label} için ${formatTL(fee)} kart bedeli bakiyeden düştü. Kalan bakiye ${formatTL(user.balance)}.`,
        ref: `note:${ref}`,
      });
      dirty = true;
      due += CARD_FEE_STEP_MS;
    }
    const iso = new Date(due).toISOString();
    if (card.feeDueAt !== iso) {
      card.feeDueAt = iso;
      dirty = true;
    }
  }
  return dirty;
}

const AUTO_SPEND_CENTS = 100;

function sweepAutoSpend(db: DB): boolean {
  const day = istanbulKey(new Date().toISOString());
  const amount = usdMinorToKurus(AUTO_SPEND_CENTS);
  if (amount < 1) return false;
  let dirty = false;
  for (const card of db.cards) {
    if (card.id.startsWith("crd_pst_")) continue;
    if (card.status !== "aktif") continue;
    const user = db.users.find((item) => item.id === card.userId);
    const merchant = merchantsFor(card.type)[0];
    if (!user || !merchant) continue;
    const ref = `oto-harcama:${card.id}:${day}`;
    if (db.transactions.some((entry) => entry.ref === ref)) continue;
    if (card.spent + amount > card.limit || amount > user.balance) continue;
    user.balance -= amount;
    card.spent += amount;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: user.id,
      cardId: card.id,
      kind: "harcama",
      title: merchant,
      note: `${formatUsd(AUTO_SPEND_CENTS)} karşılığı ${formatTL(amount)} kendiliğinden düştü.`,
      amount: -amount,
      usdMinor: -AUTO_SPEND_CENTS,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
      ref,
    });
    pushNotice(db, {
      userId: user.id,
      title: "Harcama düştü",
      body: `${card.label} kartından ${merchant} kendiliğinden işlendi. ${formatTL(amount)} işlem geçmişine yazıldı.`,
      ref: `note:${ref}`,
    });
    if (card.limit > 0 && card.spent / card.limit >= 0.5) {
      pushNotice(db, {
        userId: user.id,
        title: "Bakiye yarıda",
        body: `${card.label} kartının kullanılabilir bakiyesinin yarısı kullanıldı.`,
        ref: `tavan50:${card.id}:${card.period}`,
      });
    }
    dirty = true;
  }
  return dirty;
}

function normalize(db: DB): DB {
  if (!Array.isArray(db.payouts)) db.payouts = [];
  let dirty = false;
  const rows = db.users as LegacyUser[];
  for (const user of rows) {
    const username = usernameFromLegacy(user);
    if (user.username !== username) {
      user.username = username;
      dirty = true;
    }
    if (typeof user.password !== "string" || user.password.length === 0) {
      if (username === "admin" || username === "clayadmin") user.password = "clayadmin";
      else if (username === "demo") user.password = "demo123";
      dirty = true;
    }
    if ("email" in user || "passwordHash" in user) {
      delete user.email;
      delete user.passwordHash;
      dirty = true;
    }
    if (user.role !== "uye" && user.role !== "yonetici") {
      user.role = user.username === "admin" || user.username === "clayadmin" ? "yonetici" : "uye";
      dirty = true;
    }
    if ((user.username === "admin" || user.id === "usr_admin") && user.role === "yonetici") {
      user.username = "clayadmin";
      if (user.password === "admin123") user.password = "clayadmin";
      user.role = "yonetici";
      dirty = true;
    }
    if (user.username === "clayadmin" && user.role !== "yonetici") {
      user.role = "yonetici";
      dirty = true;
    }
    if (user.username === "demo" && user.name === "Demo Kullanıcı") {
      user.name = "Clay Üye";
      dirty = true;
      for (const card of db.cards) {
        if (card.userId === user.id && card.holder === "DEMO KULLANICI") {
          card.holder = holderLine("Clay Üye");
        }
      }
    }
    if (user.status !== "acik" && user.status !== "askida") {
      user.status = "acik";
      dirty = true;
    }
    if (typeof user.usdMinor !== "number" || user.usdMinor < 0) {
      user.usdMinor = 0;
      dirty = true;
    }
    if (typeof user.address !== "string") {
      user.address = "";
      dirty = true;
    } else {
      const address = user.address.replace(/\s+/g, " ").trim().slice(0, 120);
      if (address !== user.address) {
        user.address = address;
        dirty = true;
      }
    }
  }
  if (!db.users.some((user) => user.role === "yonetici")) {
    db.users.push(adminRecord());
    dirty = true;
  }
  if (!db.settings || typeof db.settings.issueFeeKurus !== "number" || !db.settings.plans) {
    db.settings = defaultSettings();
    dirty = true;
  } else {
    const fresh = defaultSettings();
    for (const id of ["kivilcim", "atolye", "galeri"] as const) {
      const row = db.settings.plans[id];
      if (!row || typeof row.name !== "string" || typeof row.cardLimit !== "number" || typeof row.priceUsdMinor !== "number") {
        db.settings.plans[id] = fresh.plans[id];
        dirty = true;
      }
    }
    if (typeof db.settings.loadFeePercent !== "number") {
      db.settings.loadFeePercent = fresh.loadFeePercent;
      dirty = true;
    }
    if (typeof db.settings.transferFeePercent !== "number") {
      db.settings.transferFeePercent = fresh.transferFeePercent;
      dirty = true;
    }
    if (typeof db.settings.telegram !== "string") {
      db.settings.telegram = "";
      dirty = true;
    }
    const announce = db.settings.announcement;
    if (!announce || typeof announce.title !== "string" || typeof announce.body !== "string" || typeof announce.on !== "boolean") {
      db.settings.announcement = fresh.announcement;
      dirty = true;
    }
    if (!db.settings.copy || typeof db.settings.copy !== "object" || Array.isArray(db.settings.copy)) {
      db.settings.copy = {};
      dirty = true;
    }
  }
  if (!Array.isArray(db.notices)) {
    db.notices = [];
    dirty = true;
  }
  if (!Array.isArray(db.tickets)) {
    db.tickets = [];
    dirty = true;
  } else {
    const tickets = db.tickets.filter(
      (ticket) => ticket && typeof ticket.id === "string" && typeof ticket.userId === "string" && typeof ticket.body === "string",
    );
    if (tickets.length !== db.tickets.length) {
      db.tickets = tickets;
      dirty = true;
    }
    for (const ticket of db.tickets) {
      if (typeof ticket.subject !== "string" || ticket.subject.length === 0) {
        ticket.subject = "Talep";
        dirty = true;
      }
      if (ticket.status !== "acik" && ticket.status !== "yanitlandi" && ticket.status !== "kapandi") {
        ticket.status = "acik";
        dirty = true;
      }
      if (ticket.reply === undefined) {
        ticket.reply = null;
        dirty = true;
      }
      if (ticket.repliedAt === undefined) {
        ticket.repliedAt = null;
        dirty = true;
      }
      if (typeof ticket.createdAt !== "string") {
        ticket.createdAt = new Date().toISOString();
        dirty = true;
      }
    }
  }
  if (!Array.isArray(db.bins)) {
    db.bins = [];
    dirty = true;
  }
  const kept = new Set(["facebook_ads", "tiktok", "google_ads", "ultima"]);
  const cardCount = db.cards.length;
  db.cards = db.cards.filter((card) => kept.has(card.type));
  if (db.cards.length !== cardCount) dirty = true;
  const binCount = db.bins.length;
  db.bins = db.bins.filter((row) => kept.has(row.type));
  if (db.bins.length !== binCount) dirty = true;
  const beforeBins = db.bins.length;
  ensureTestBins(db);
  if (db.bins.length !== beforeBins) dirty = true;
  for (const note of db.notices) {
    if (note.readAt === undefined || (note.readAt !== null && typeof note.readAt !== "string")) {
      note.readAt = null;
      dirty = true;
    }
    if (note.ref === undefined) {
      note.ref = null;
      dirty = true;
    }
  }
  for (const card of db.cards) {
    if (!/^\d{4,8}$/.test(card.bin ?? "")) {
      card.bin = card.pan.slice(0, 6);
      dirty = true;
    }
    if (typeof card.binLabel !== "string") {
      card.binLabel = "";
      dirty = true;
    }
    const owner = db.users.find((user) => user.id === card.userId);
    const personal = owner ? holderLine(owner.name) : "";
    if (personal && (card.holder === "Clay" || card.holder === "CLAY" || card.holder.trim() === "")) {
      card.holder = personal;
      dirty = true;
    }
    if (card.readyAt === undefined) {
      card.readyAt = null;
      dirty = true;
    }
    if (typeof card.period !== "number" || card.period < 1) {
      card.period = 1;
      dirty = true;
    }
    if (card.status === "hazirlaniyor") {
      const ready = card.readyAt ? Date.parse(card.readyAt) : 0;
      if (!Number.isFinite(ready) || ready <= Date.now()) {
        card.status = "aktif";
        card.readyAt = null;
        const ref = `hazir:${card.id}`;
        if (!db.notices.some((note) => note.ref === ref)) {
          db.notices.push({
            id: `nt_${rid()}`,
            userId: card.userId,
            batch: rid(),
            title: "Kart hazır",
            body: "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.",
            createdAt: new Date().toISOString(),
            readAt: null,
            ref,
          });
        }
        dirty = true;
        const order = Array.isArray(db.orders)
          ? db.orders.find((item) => item.cardId === card.id && item.status === "hazirlaniyor")
          : undefined;
        if (order) {
          order.status = "hazir";
          order.readyAt = null;
        }
      }
    }
  }
  for (const entry of db.transactions) {
    if (entry.usdMinor === undefined) {
      entry.usdMinor = null;
      dirty = true;
    }
  }
  if (!Array.isArray(db.orders)) {
    db.orders = ordersFromCards(db);
    dirty = true;
  }
  if (sweepCardFees(db)) dirty = true;
  if (sweepAutoSpend(db)) dirty = true;
  if (dirty) {
    assertDb(db);
    write(db);
  } else if (!cache) {
    cache = db;
  }
  return cache ?? db;
}

function assertDb(db: DB) {
  for (const user of db.users) {
    if (user.balance < 0 || user.usdMinor < 0) throw new Error("Bakiye eksi olamaz");
  }
  for (const card of db.cards) {
    const pstMask = card.id.startsWith("crd_pst_") && /^\d{6}\*{6}\d{4}$/.test(card.pan) && card.pan.startsWith(card.bin);
    if (!pstMask && (!/^\d{16}$/.test(card.pan) || !luhnOk(card.pan) || !card.pan.startsWith(card.bin))) {
      throw new Error("Kart numarası kayıtlı BIN ile uyuşmuyor");
    }
    if (card.spent < 0 || (!card.id.startsWith("crd_pst_") && card.spent > card.limit)) {
      throw new Error("Kart harcaması limit dışında");
    }
  }
}

function write(db: DB) {
  cache = structuredClone(db);
  if (!remoteMode && typeof window !== "undefined") localStorage.setItem(LEDGER_KEY, JSON.stringify(cache));
  if (booted) emit();
}

function read(): DB {
  if (cache) return cache;
  let parsed: DB | null = null;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as DB;
        if (data.users && data.cards && data.transactions) parsed = data;
      } catch {
        parsed = null;
      }
    }
  }
  return normalize(parsed ?? createSeed());
}

export async function creditHeleketPayment(input: {
  userId: string;
  orderId: string;
  cents: number;
}): Promise<"ok" | "var" | "tavan" | "yok" | "tutar"> {
  if (remoteMode) {
    const hit = await remoteCall("heleket", { orderId: input.orderId });
    const code = hit?.code ?? "yok";
    if (code === "ok" || code === "var" || code === "tavan" || code === "yok" || code === "tutar") return code;
    return "yok";
  }
  if (!/^clay-[a-f0-9]{16}$/.test(input.orderId)) return "tutar";
  if (input.cents < MIN_USD_MINOR || input.cents > MAX_USD_MINOR) return "tutar";
  const credit = usdMinorToKurus(input.cents);
  const ref = `heleket:${input.orderId}`;
  return mutate((db) => {
    if (db.transactions.some((entry) => entry.ref === ref)) return "var" as const;
    const row = db.users.find((item) => item.id === input.userId);
    if (!row) return "yok" as const;
    if (row.balance + credit > MAX_BALANCE_KURUS) return "tavan" as const;
    row.balance += credit;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: null,
      kind: "yukleme",
      title: "Heleket yüklemesi",
      note: `${formatUsd(input.cents)} × ${formatRate(USD_SELL_RATE)} = ${formatTL(credit)}. Heleket ödemesi, sabit kur ${USD_RATE_AS_OF}.`,
      amount: credit,
      usdMinor: input.cents,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
      ref,
    });
    pushNotice(db, {
      userId: row.id,
      title: "Bakiye yüklendi",
      body: `Bakiyeniz yüklendi. ${formatUsd(input.cents)} karşılığı ${formatTL(credit)} yazıldı.`,
      ref: `note:${ref}`,
    });
    return "ok" as const;
  });
}

export function mutate<T>(fn: (db: DB) => T): T {
  if (remoteMode) throw new Error("uzak defter");
  const db = read();
  const result = fn(db);
  assertDb(db);
  write(db);
  return result;
}

export function snapshot(): DB {
  return read();
}

export function parseUsername(raw: string): string | null {
  const username = raw.trim().toLowerCase();
  if (!/^[a-z0-9_]{2,24}$/.test(username)) return null;
  return username;
}

export function parseAddress(raw: string): string | null {
  const address = raw.replace(/\s+/g, " ").trim();
  if (address.length === 0) return "";
  if (address.length > 120) return null;
  if (!/^[\p{L}\p{M}\p{N} .,/'#+\-]+$/u.test(address)) return null;
  return address;
}

export function parseDisplayName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 40) return null;
  if (!/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(name)) return null;
  return name;
}

export function findUserByUsername(username: string): User | undefined {
  const needle = username.trim().toLowerCase();
  return read().users.find((user) => user.username === needle);
}

export function findUserById(id: string): User | undefined {
  return read().users.find((user) => user.id === id);
}

export function createUser(input: { username: string; password: string; name: string }): User | null {
  return mutate((db) => {
    if (db.users.some((item) => item.username === input.username)) return null;
    const user: User = {
      id: `usr_${rid()}`,
      name: input.name,
      username: input.username,
      password: input.password,
      balance: WELCOME_BONUS_KURUS,
      usdMinor: 0,
      plan: "kivilcim",
      role: "uye",
      status: "acik",
      address: "",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: user.id,
      cardId: null,
      kind: "yukleme",
      title: "Hoş geldin bakiyesi",
      note: "30 USD sabit kur karşılığı.",
      amount: WELCOME_BONUS_KURUS,
      usdMinor: WELCOME_USD_MINOR,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    pushNotice(db, {
      userId: user.id,
      title: "Hoş geldin",
      body: `${formatTL(WELCOME_BONUS_KURUS)} bakiyen hazır. İlk kartını basabilirsin.`,
    });
    return user;
  });
}

export function listCards(userId: string): Card[] {
  const rank = { hazirlaniyor: 0, aktif: 1, donduruldu: 2, kapali: 3 };
  return read()
    .cards.filter((card) => card.userId === userId)
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt),
    );
}

export function listTickets(userId?: string) {
  const rows = read().tickets;
  const mine = userId ? rows.filter((ticket) => ticket.userId === userId) : rows;
  return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listNotices(userId: string) {
  return read()
    .notices.filter((note) => note.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadNoticeCount(userId: string) {
  return read().notices.filter((note) => note.userId === userId && !note.readAt).length;
}

export function listOrders(userId: string): Order[] {
  return read()
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  input: {
    userId: string;
    type: CardTypeId;
    label: string;
    limit: number;
    fee: number;
    bin: string;
    binLabel: string;
  },
): Card {
  const user = db.users.find((item) => item.id === input.userId);
  if (!user) throw new Error("Hesap yok");
  const serial = db.nextSerial;
  db.nextSerial += 1;
  const now = new Date().toISOString();
  const card: Card = {
    id: `crd_${rid()}`,
    userId: user.id,
    type: input.type,
    label: input.label,
    limit: input.limit,
    spent: 0,
    pan: makePan(serial, input.bin),
    bin: input.bin,
    binLabel: input.binLabel,
    expiry: makeExpiry(),
    cvv: makeCvv(serial),
    holder: holderLine(input.label),
    status: "hazirlaniyor",
    readyAt: new Date(Date.now() + CARD_PREP_MS).toISOString(),
    period: 1,
    createdAt: now,
  };
  user.balance -= input.fee;
  db.cards.push(card);
  db.orders.push({
    id: `ord_${rid()}`,
    userId: user.id,
    cardId: card.id,
    type: card.type,
    label: card.label,
    limit: card.limit,
    fee: input.fee,
    status: "hazirlaniyor",
    createdAt: now,
    readyAt: card.readyAt,
  });
  db.transactions.push({
    id: `tx_${rid()}`,
    userId: user.id,
    cardId: card.id,
    kind: "basim",
    title: `Basım · ${card.label}`,
    note: `Sipariş ${card.id}. Kart hazırlanıyor.`,
    amount: -input.fee,
    status: "tamamlandi",
    createdAt: now,
  });
  return card;
}

export function ledgerSeed(): DB {
  return createSeed();
}

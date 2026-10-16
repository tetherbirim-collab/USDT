import { CARD_PREP_MS, CARD_TYPE_ORDER, CARD_TYPES, MAX_BALANCE_KURUS, MAX_USD_MINOR, MIN_USD_MINOR, SERVICE_BIN, bindFx, defaultSettings, merchantsFor, usdMinorToKurus } from "./catalog";
import { payoutNote } from "./coins";
import { formatTL, formatUsd, holderLine, istanbulKey, orderCodeFrom } from "./format";
import { luhnOk, makeCvv, makeExpiry, makePan } from "./pan";
import type { Card, CardTypeId, DB, Order, PublicUser, Tx, User } from "./types";

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
let issuerReady = false;
let bootPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const CARD_FEE_STEP_MS = 30 * 86_400_000;

export function remoteSession(): { mode: boolean; me: PublicUser | null } {
  return { mode: remoteMode, me: remoteMe };
}

export function usingRemoteLedger(): boolean {
  return remoteMode;
}

export function issuerKeyReady(): boolean {
  return issuerReady;
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
  try {
    normalize(cache);
  } catch {
    /* A bad local card must not take the open panel down. */
  }
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
    const data = JSON.parse(trimmed) as { mode?: string; me?: PublicUser | null; db?: DB; issuerReady?: boolean };
    if (data.mode !== "php" || !data.db?.settings || !Array.isArray(data.db.bins)) return false;
    cache = data.db;
    remoteMode = true;
    remoteMe = data.me ?? null;
    issuerReady = data.issuerReady === true;
    hardenRemote(cache, remoteMe);
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
): Promise<{ code: string; id?: string; once?: string; message?: string } | null> {
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
    const data = JSON.parse(text) as { mode?: string; code?: string; me?: PublicUser | null; db?: DB; id?: string; once?: string; message?: string; issuerReady?: boolean };
    if (data.mode !== "php" || !data.db?.settings) return { code: "e-defter" };
    cache = data.db;
    remoteMe = data.me ?? null;
    issuerReady = data.issuerReady === true;
    hardenRemote(cache, remoteMe);
    if (booted) emit();
    return {
      code: String(data.code ?? ""),
      id: data.id,
      once: typeof data.once === "string" ? data.once : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
    };
  } catch {
    return { code: "e-defter" };
  }
}

function hardenRemote(db: DB, me: PublicUser | null) {
  if (!Array.isArray(db.payouts)) db.payouts = [];
  if (!Array.isArray(db.cards)) db.cards = [];
  if (!Array.isArray(db.transactions)) db.transactions = [];
  if (!Array.isArray(db.notices)) db.notices = [];
  if (!Array.isArray(db.users)) db.users = [];
  const fresh = defaultSettings();
  if (!db.settings?.plans) {
    db.settings = fresh;
  } else {
    if (typeof db.settings.telegram !== "string") db.settings.telegram = "";
    const announce = db.settings.announcement;
    if (!announce || typeof announce.title !== "string" || typeof announce.body !== "string" || typeof announce.on !== "boolean") {
      db.settings.announcement = fresh.announcement;
    }
    for (const id of ["kivilcim", "atolye", "galeri"] as const) {
      const row = db.settings.plans[id];
      if (!row || typeof row.name !== "string" || typeof row.cardLimit !== "number") db.settings.plans[id] = fresh.plans[id];
    }
    if (!db.settings.copy || typeof db.settings.copy !== "object" || Array.isArray(db.settings.copy)) db.settings.copy = {};
    if ("pst" in db.settings) delete (db.settings as { pst?: unknown }).pst;
    bindFx(db.settings.fx);
  }
  if (!Array.isArray(db.tickets)) db.tickets = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!Array.isArray(db.bins)) db.bins = [];
  if (!me) return;
  if (me.plan !== "kivilcim" && me.plan !== "atolye" && me.plan !== "galeri") me.plan = "kivilcim";
  if (typeof me.name !== "string" || me.name.length === 0) me.name = typeof me.username === "string" && me.username ? me.username : "Üye";
  if (typeof me.username !== "string") me.username = "";
  if (typeof me.address !== "string") me.address = "";
  if (typeof me.balance !== "number" || !Number.isFinite(me.balance)) me.balance = 0;
  if (typeof me.planUntil !== "string" || Number.isNaN(Date.parse(me.planUntil))) {
    me.planUntil = new Date(Date.now() + 30 * 86_400_000).toISOString();
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
    cards: [reklam, alisveris, abonelik, ultima].slice(0, 0),
    transactions: transactions.slice(0, 0),
    notices: [],
    tickets: [],
    bins: CARD_TYPE_ORDER.map((type) => ({
      id: `bin_${SERVICE_BIN}_${type}`,
      type,
      label: SERVICE_BIN,
      digits: SERVICE_BIN,
    })),
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
      code: orderCodeFrom(card.id),
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
    if (card.status !== "aktif") continue;
    if (card.issuerCardId) continue;
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

function dropImported(db: DB): boolean {
  let dirty = false;
  if (db.settings && "pst" in db.settings) {
    delete (db.settings as { pst?: unknown }).pst;
    dirty = true;
  }
  if (!Array.isArray(db.cards)) db.cards = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!Array.isArray(db.transactions)) db.transactions = [];
  if (!Array.isArray(db.notices)) db.notices = [];
  const drop = new Set(
    db.cards
      .filter((card) => card.id.startsWith("crd_pst_") || /^\d{6}\*{6}\d{4}$/.test(card.pan))
      .map((card) => card.id),
  );
  if (drop.size > 0) {
    db.cards = db.cards.filter((card) => !drop.has(card.id));
    dirty = true;
  }
  const orderCount = db.orders.length;
  db.orders = db.orders.filter((order) => !order.id.startsWith("ord_pst_") && !drop.has(order.cardId));
  if (db.orders.length !== orderCount) dirty = true;
  const txCount = db.transactions.length;
  db.transactions = db.transactions.filter((entry) => {
    if (entry.cardId && drop.has(entry.cardId)) return false;
    if (typeof entry.ref === "string" && entry.ref.startsWith("pst:")) return false;
    if (entry.title.includes("PST") || entry.note.includes("PST")) return false;
    return true;
  });
  if (db.transactions.length !== txCount) dirty = true;
  const noteCount = db.notices.length;
  db.notices = db.notices.filter((note) => !note.title.includes("PST") && !(note.ref && note.ref.includes("pst")));
  if (db.notices.length !== noteCount) dirty = true;
  return dirty;
}

function walletMask(wallet: string): string {
  return wallet.length >= 8 ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : wallet;
}

function syncPayouts(db: DB): boolean {
  if (!Array.isArray(db.payouts)) {
    db.payouts = [];
    return true;
  }
  let dirty = false;
  const drop = new Set<string>();
  for (const payout of db.payouts) {
    if (!payout || typeof payout.id !== "string" || payout.id === "") continue;
    const amount = Math.abs(payout.amount);
    if (amount < 1) continue;
    const usd = Math.abs(payout.usdMinor || 0);
    const phase = payout.status === "gitti" || payout.status === "iptal" ? payout.status : "bekliyor";
    const mask = walletMask(payout.wallet || "");
    const note = payoutNote(phase, mask, payout.coin);
    const matches = db.transactions.filter((entry) => entry.ref === payout.id);
    if (matches.length === 0) {
      db.transactions.push({
        id: `tx_${rid()}`,
        userId: payout.userId,
        cardId: null,
        kind: "transfer",
        title: "Çekim talebi",
        note,
        amount: -amount,
        usdMinor: usd > 0 ? -usd : null,
        status: "tamamlandi",
        createdAt: payout.createdAt || new Date().toISOString(),
        ref: payout.id,
      });
      dirty = true;
    } else {
      const keep = matches[0];
      for (const extra of matches.slice(1)) drop.add(extra.id);
      if (keep.amount !== -amount) {
        keep.amount = -amount;
        dirty = true;
      }
      if (keep.title !== "Çekim talebi") {
        keep.title = "Çekim talebi";
        dirty = true;
      }
      if (keep.note !== note) {
        keep.note = note;
        dirty = true;
      }
      const wantUsd = usd > 0 ? -usd : null;
      if ((keep.usdMinor ?? null) !== wantUsd) {
        keep.usdMinor = wantUsd;
        dirty = true;
      }
      if (keep.kind !== "transfer") {
        keep.kind = "transfer";
        dirty = true;
      }
      if (matches.length > 1) dirty = true;
    }
    const refundRef = `${payout.id}:iptal`;
    const refunds = db.transactions.filter((entry) => entry.ref === refundRef);
    if (phase === "iptal") {
      const refundNote = "İptal. Tutar cüzdana döndü.";
      if (refunds.length === 0) {
        db.transactions.push({
          id: `tx_${rid()}`,
          userId: payout.userId,
          cardId: null,
          kind: "duzeltme",
          title: "Çekim iadesi",
          note: refundNote,
          amount,
          usdMinor: usd > 0 ? usd : null,
          status: "tamamlandi",
          createdAt: payout.settledAt || new Date().toISOString(),
          ref: refundRef,
        });
        dirty = true;
      } else {
        const keep = refunds[0];
        for (const extra of refunds.slice(1)) drop.add(extra.id);
        if (keep.amount !== amount) {
          keep.amount = amount;
          dirty = true;
        }
        if (keep.title !== "Çekim iadesi") {
          keep.title = "Çekim iadesi";
          dirty = true;
        }
        if (keep.note !== refundNote) {
          keep.note = refundNote;
          dirty = true;
        }
        const wantUsd = usd > 0 ? usd : null;
        if ((keep.usdMinor ?? null) !== wantUsd) {
          keep.usdMinor = wantUsd;
          dirty = true;
        }
        if (refunds.length > 1) dirty = true;
      }
    } else if (refunds.length > 0) {
      for (const extra of refunds) drop.add(extra.id);
      dirty = true;
    }
  }
  if (drop.size > 0) {
    db.transactions = db.transactions.filter((entry) => !drop.has(entry.id));
  }
  return dirty;
}

function normalize(db: DB): DB {
  if (!Array.isArray(db.payouts)) db.payouts = [];
  let dirty = dropImported(db);
  const rows = db.users as LegacyUser[];
  for (const user of rows) {
    const username = usernameFromLegacy(user);
    if (user.username !== username) {
      user.username = username;
      dirty = true;
    }
    const hashed =
      typeof user.passHash === "string" &&
      /^[a-f0-9]{64}$/.test(user.passHash) &&
      typeof user.passSalt === "string" &&
      /^[a-f0-9]{16,64}$/.test(user.passSalt);
    if (hashed) {
      if (user.password !== "") {
        user.password = "";
        dirty = true;
      }
    } else if (typeof user.password !== "string" || user.password.length === 0) {
      if (username === "admin" || username === "clayadmin") {
        user.password = "clayadmin";
        dirty = true;
      } else if (username === "demo") {
        user.password = "demo123";
        dirty = true;
      }
    }
    if ("email" in user || "passwordHash" in user || "seed" in user) {
      delete user.email;
      delete user.passwordHash;
      delete (user as { seed?: string }).seed;
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
    if (db.settings.issueFeeKurus === 30_000 || db.settings.issueFeeKurus === 75_000) {
      db.settings.issueFeeKurus = fresh.issueFeeKurus;
      dirty = true;
    }
    for (const id of ["kivilcim", "atolye", "galeri"] as const) {
      const row = db.settings.plans[id];
      if (row && typeof row.blurb === "string" && row.blurb.includes("750 USD")) {
        db.settings.plans[id] = { ...row, blurb: fresh.plans[id].blurb };
        dirty = true;
      }
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
  db.bins = db.bins.filter((row) => kept.has(row.type) && row.digits !== "400000" && row.digits !== "411111");
  if (db.bins.length !== binCount) dirty = true;
  for (const type of CARD_TYPE_ORDER) {
    if (!db.bins.some((row) => row.type === type && row.digits === SERVICE_BIN)) {
      db.bins.push({ id: `bin_${SERVICE_BIN}_${type}`, type, label: SERVICE_BIN, digits: SERVICE_BIN });
      dirty = true;
    }
  }
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
  if (fillOrderCodes(db)) dirty = true;
  if (sweepCardFees(db)) dirty = true;
  if (sweepAutoSpend(db)) dirty = true;
  if (syncPayouts(db)) dirty = true;
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
    if (card.issuerCardId) {
      if (card.pan !== "" && (!/^\d{16}$/.test(card.pan) || !luhnOk(card.pan))) {
        throw new Error("Kart numarası kayıtlı BIN ile uyuşmuyor");
      }
    } else if (!/^\d{16}$/.test(card.pan) || !luhnOk(card.pan) || !card.pan.startsWith(card.bin)) {
      throw new Error("Kart numarası kayıtlı BIN ile uyuşmuyor");
    }
    if (card.spent < 0 || card.spent > card.limit) {
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
      note: `${formatUsd(input.cents)} Heleket ödemesi. Ana bakiyeye aynı USD tutarı yazıldı.`,
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

/** Signup and password changes. Letters and digits, at least 6. Existing logins are not re-shaped. */
export function passwordShapeOk(password: string): boolean {
  return /^[A-Za-z0-9]{6,72}$/.test(password);
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

export function createUser(input: {
  username: string;
  password: string;
  name: string;
  securityQuestion?: string;
  securityAnswer?: string;
  passSalt?: string;
  passHash?: string;
  seedSalt?: string;
  seedHash?: string;
}): User | null {
  return mutate((db) => {
    if (db.users.some((item) => item.username === input.username)) return null;
    const seeded = Boolean(input.passHash && input.seedHash);
    const user: User = {
      id: `usr_${rid()}`,
      name: input.name,
      username: input.username,
      password: seeded ? "" : input.password,
      ...(seeded
        ? {
            passSalt: input.passSalt,
            passHash: input.passHash,
            seedSalt: input.seedSalt,
            seedHash: input.seedHash,
          }
        : {
            securityQuestion: input.securityQuestion,
            securityAnswer: input.securityAnswer,
          }),
      balance: 0,
      usdMinor: 0,
      plan: "kivilcim",
      role: "uye",
      status: "acik",
      address: "",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    pushNotice(db, {
      userId: user.id,
      title: "Hoş geldin",
      body: "Hesap açıldı. Başlangıç bakiyesi $0.00. Kart açılışı 750 TL = $15.14. Kur 1 USD = 49,527 TL, Frankfurter, 16 Eki 2026.",
    });
    return user;
  });
}

function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function stamp(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function listCards(userId: string): Card[] {
  const rank = { hazirlaniyor: 0, aktif: 1, donduruldu: 2, kapali: 3 };
  return asRows<Card>(read().cards)
    .filter((card) => card && card.userId === userId)
    .sort(
      (a, b) =>
        (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || stamp(b.createdAt).localeCompare(stamp(a.createdAt)),
    );
}

export function listTickets(userId?: string) {
  const rows = asRows<DB["tickets"][number]>(read().tickets);
  const mine = userId ? rows.filter((ticket) => ticket && ticket.userId === userId) : rows;
  return [...mine].sort((a, b) => stamp(b.createdAt).localeCompare(stamp(a.createdAt)));
}

export function listNotices(userId: string) {
  return asRows<DB["notices"][number]>(read().notices)
    .filter((note) => note && note.userId === userId)
    .sort((a, b) => stamp(b.createdAt).localeCompare(stamp(a.createdAt)));
}

export function unreadNoticeCount(userId: string) {
  return asRows<DB["notices"][number]>(read().notices).filter((note) => note && note.userId === userId && !note.readAt).length;
}

function fillOrderCodes(db: DB): boolean {
  let dirty = false;
  const seen = new Set<string>();
  for (const order of db.orders) {
    const code = order.code ?? "";
    const next = /^Clay-\d{6}$/.test(code) && !seen.has(code) ? code : orderCodeFrom(order.cardId || order.id, seen);
    if (next !== order.code) {
      order.code = next;
      dirty = true;
    }
    seen.add(next);
  }
  return dirty;
}

export function orderForCard(cardId: string): Order | undefined {
  return asRows<Order>(read().orders).find((order) => order && order.cardId === cardId);
}

export function listOrders(userId: string): Order[] {
  return asRows<Order>(read().orders)
    .filter((order) => order && order.userId === userId)
    .sort((a, b) => stamp(b.createdAt).localeCompare(stamp(a.createdAt)));
}

export function listTransactions(userId: string): Tx[] {
  return asRows<Tx>(read().transactions)
    .filter((entry) => entry && entry.userId === userId)
    .sort((a, b) => stamp(b.createdAt).localeCompare(stamp(a.createdAt)));
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
  void db;
  void input;
  throw new Error("e-kripicard-anahtar");
}

export function ledgerSeed(): DB {
  return createSeed();
}

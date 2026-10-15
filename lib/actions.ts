"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { clearSession, deskPath, getCurrentUser, setSession } from "./auth";
import {
  CARD_PREP_MS,
  CARD_TYPES,
  MAX_BALANCE_KURUS,
  MAX_LIMIT_KURUS,
  MAX_SPEND_KURUS,
  MAX_TOPUP_KURUS,
  MAX_USD_MINOR,
  MIN_LIMIT_KURUS,
  MIN_SPEND_KURUS,
  MIN_TOPUP_KURUS,
  MIN_TRANSFER_KURUS,
  MIN_USD_MINOR,
  PLANS,
  USD_RATE_AS_OF,
  USD_SELL_RATE,
  isCardType,
  isMerchantForType,
  isPlan,
  transferFee,
  usdMinorToKurus,
} from "./catalog";
import { formatRate, formatTL, formatUsd, holderLine, istanbulInputToIso, parseSignedTryToKurus, parseTryToKurus } from "./format";
import { createUser, findUserByUsername, issueCard, mutate, openCardCount, parseAddress, parseDisplayName, parseUsername } from "./store";
import type { DB, User, Card } from "./types";

export type FormState = { error: string };

function bounce(path: string, code: string): never {
  const join = path.includes("?") ? "&" : "?";
  redirect(`${path}${join}bildirim=${encodeURIComponent(code)}`);
}

async function actor() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const password = String(formData.get("parola") || "");
  const user = username ? findUserByUsername(username) : undefined;
  if (!user || user.password !== password) {
    return { error: "Kullanıcı adı veya parola hatalı." };
  }
  if (user.status === "askida") {
    return { error: "Bu simülasyon hesabı askıya alındı. Giriş kapalı." };
  }
  await setSession(user.id);
  redirect(deskPath(user.role));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const name = parseDisplayName(String(formData.get("ad") || ""));
  const password = String(formData.get("parola") || "");
  const again = String(formData.get("parola2") || "");
  if (!name) return { error: "Görünen ad 2–40 karakter olmalı ve bir harfle başlamalı." };
  if (!username) return { error: "Kullanıcı adı 2–24 karakter olmalı; yalnızca harf, rakam ve alt çizgi." };
  if (password.length < 6 || password.length > 72) return { error: "Parola 6–72 karakter olmalı." };
  if (password !== again) return { error: "Parolalar eşleşmiyor." };
  if (findUserByUsername(username)) return { error: "Bu kullanıcı adı zaten var." };
  const user = createUser({ username, password, name });
  if (!user) return { error: "Bu kullanıcı adı zaten var." };
  await setSession(user.id);
  redirect("/panel?bildirim=hosgeldin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

function refundIssueFee(db: DB, row: User, card: Card): "ok" | "tavan" | "yok" {
  const basim = db.transactions.find(
    (entry) => entry.cardId === card.id && entry.kind === "basim" && entry.status === "tamamlandi" && entry.amount < 0,
  );
  if (!basim) return "yok";
  if (db.transactions.some((entry) => entry.cardId === card.id && entry.title.startsWith("Basım iadesi"))) return "yok";
  const fee = -basim.amount;
  if (row.balance + fee > MAX_BALANCE_KURUS) return "tavan";
  row.balance += fee;
  db.transactions.push({
    id: `tx_${randomUUID()}`,
    userId: row.id,
    cardId: card.id,
    kind: "duzeltme",
    title: `Basım iadesi · ${card.label}`,
    note: "Basım ücreti simülasyon bakiyesine geri yazıldı. Tahsilat yoktur.",
    amount: fee,
    usdMinor: null,
    status: "tamamlandi",
    createdAt: new Date().toISOString(),
  });
  return "ok";
}

export async function topupAction(formData: FormData) {
  const user = await actor();
  const which = String(formData.get("tutar") || "");
  const custom = String(formData.get("ozel") || "");
  if (which === "usd") {
    const dollars = parseTryToKurus(String(formData.get("dolar") || ""));
    if (dollars === null || dollars < MIN_USD_MINOR || dollars > MAX_USD_MINOR) bounce("/panel/yukle", "e-tutar");
    const result = mutate((db) => {
      const row = db.users.find((item) => item.id === user.id);
      if (!row) return "yok" as const;
      if (row.usdMinor + dollars > MAX_USD_MINOR) return "tavan" as const;
      row.usdMinor += dollars;
      db.transactions.push({
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: null,
        kind: "yukleme",
        title: "Dolar simülasyon yüklemesi",
        note: `${formatUsd(dollars)} dolar bakiyesine yazıldı. Satış kuru ${formatRate(USD_SELL_RATE)} (${USD_RATE_AS_OF}). Harcama lira bakiyesinden düşer. Tahsilat yoktur.`,
        amount: 0,
        usdMinor: dollars,
        status: "tamamlandi",
        createdAt: new Date().toISOString(),
      });
      return "ok" as const;
    });
    const code = result === "ok" ? "dolar" : result === "tavan" ? "e-tavan" : "e-yok";
    bounce("/panel/yukle", code);
  }
  const raw = which === "ozel" || which === "" ? custom : which;
  const amount = parseTryToKurus(raw);
  if (amount === null || amount < MIN_TOPUP_KURUS || amount > MAX_TOPUP_KURUS) {
    bounce("/panel/yukle", "e-tutar");
  }
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return "yok" as const;
    if (row.balance + amount > MAX_BALANCE_KURUS) return "tavan" as const;
    row.balance += amount;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: null,
      kind: "yukleme",
      title: "Simülasyon yüklemesi",
      note: "Gerçek tahsilat yoktur.",
      amount,
      usdMinor: null,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "ok" as const;
  });
  const code = result === "ok" ? "yuklendi" : result === "tavan" ? "e-tavan" : "e-yok";
  bounce("/panel/yukle", code);
}

export async function convertUsdAction(formData: FormData) {
  const user = await actor();
  const which = String(formData.get("tutar") || "");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return "e-yok" as const;
    const dollars = which === "hepsi" ? row.usdMinor : parseTryToKurus(String(formData.get("dolar") || ""));
    if (dollars === null || dollars <= 0 || dollars > row.usdMinor) return "e-tutar" as const;
    const credit = usdMinorToKurus(dollars);
    if (credit < 1) return "e-tutar" as const;
    if (row.balance + credit > MAX_BALANCE_KURUS) return "e-tavan" as const;
    row.usdMinor -= dollars;
    row.balance += credit;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: null,
      kind: "yukleme",
      title: "Doların liraya çevrilmesi",
      note: `${formatUsd(dollars)} × ${formatRate(USD_SELL_RATE)} satış kuru = ${formatTL(credit)}. Simülasyon kuru, ${USD_RATE_AS_OF}. Canlı kur çekilmez, tahsilat yoktur.`,
      amount: credit,
      usdMinor: -dollars,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "cevrildi" as const;
  });
  bounce("/panel/yukle", result);
}

export async function issueAction(formData: FormData) {
  const user = await actor();
  const typeRaw = String(formData.get("tur") || "");
  const label = String(formData.get("etiket") || "").replace(/\s+/g, " ").trim();
  const limit = parseTryToKurus(String(formData.get("limit") || ""));
  if (!isCardType(typeRaw)) bounce("/panel/kartlar/yeni", "e-tur");
  if (label.length < 2 || label.length > 32) bounce("/panel/kartlar/yeni", "e-etiket");
  if (limit === null || limit < MIN_LIMIT_KURUS || limit > MAX_LIMIT_KURUS) {
    bounce("/panel/kartlar/yeni", "e-limit");
  }
  const type = typeRaw;
  const binId = String(formData.get("bin") || "");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return { code: "e-yok" as const };
    const chosen = db.bins.find((item) => item.id === binId && item.type === type);
    if (!chosen) return { code: "e-bin" as const };
    const fee = CARD_TYPES[type].fee;
    if (row.balance < fee) return { code: "e-bakiye" as const };
    const plan = PLANS[row.plan];
    if (openCardCount(db, row.id) >= plan.cardLimit) return { code: "e-plan" as const };
    const card = issueCard(db, {
      userId: row.id,
      type,
      label,
      limit,
      fee,
      bin: chosen.digits,
      binLabel: chosen.label,
    });
    return { code: "basildi" as const, id: card.id };
  });
  if (result.code !== "basildi") bounce("/panel/kartlar/yeni", result.code);
  bounce(`/panel/kartlar?vurgu=${result.id}`, "siparis");
}

export async function freezeAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const mode = String(formData.get("mod") || "");
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!card) return "e-yok" as const;
    if (card.status === "kapali") return "e-durum" as const;
    if (mode === "dondur") {
      if (card.status !== "aktif") return "e-durum" as const;
      card.status = "donduruldu";
      return "donduruldu" as const;
    }
    if (mode === "coz") {
      if (card.status !== "donduruldu") return "e-durum" as const;
      card.status = "aktif";
      return "cozuldu" as const;
    }
    return "e-durum" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function closeAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  if (String(formData.get("onay") || "") !== "on") bounce("/panel/kartlar", "e-onay");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status === "kapali" || card.status === "hazirlaniyor") return "e-durum" as const;
    const refund = refundIssueFee(db, row, card);
    if (refund === "tavan") return "e-tavan" as const;
    card.status = "kapali";
    return "kapatildi" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function cancelOrderAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status !== "hazirlaniyor") return "e-durum" as const;
    const refund = refundIssueFee(db, row, card);
    if (refund === "tavan") return "e-tavan" as const;
    card.status = "kapali";
    card.readyAt = null;
    const order = db.orders.find((item) => item.cardId === card.id);
    if (order) {
      order.status = "iptal";
      order.readyAt = null;
    }
    return "iptal" as const;
  });
  bounce("/panel/siparisler", result);
}

export async function planAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") redirect("/admin");
  const plan = String(formData.get("plan") || "");
  if (!isPlan(plan)) bounce("/panel/hesap", "e-plan");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    if (openCardCount(db, row.id) > PLANS[plan].cardLimit) return "e-plan-dolu" as const;
    row.plan = plan;
    return "plan" as const;
  });
  bounce("/panel/hesap", result);
}

export async function spendAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const merchant = String(formData.get("isletme") || "");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  if (amount === null || amount < MIN_SPEND_KURUS || amount > MAX_SPEND_KURUS) {
    bounce("/panel/kartlar", "e-tutar");
  }
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (!isMerchantForType(card.type, merchant)) return "e-isletme" as const;
    if (card.status !== "aktif") return "e-durum" as const;
    const now = new Date().toISOString();
    if (card.spent + amount > card.limit) {
      db.transactions.push({
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: card.id,
        kind: "harcama",
        title: merchant,
        note: "Limit aşıldı",
        amount: -amount,
        status: "reddedildi",
        createdAt: now,
      });
      return "reddedildi" as const;
    }
    if (amount > row.balance) {
      db.transactions.push({
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: card.id,
        kind: "harcama",
        title: merchant,
        note: "Yetersiz bakiye",
        amount: -amount,
        status: "reddedildi",
        createdAt: now,
      });
      return "reddedildi" as const;
    }
    row.balance -= amount;
    card.spent += amount;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: card.id,
      kind: "harcama",
      title: merchant,
      note: `${row.username} hesabından düştü`,
      amount: -amount,
      status: "tamamlandi",
      createdAt: now,
    });
    if (card.limit > 0 && card.spent / card.limit >= 0.5) {
      const ref = `tavan50:${card.id}:${card.period}`;
      if (!db.notices.some((note) => note.ref === ref)) {
        db.notices.push({
          id: `nt_${randomUUID()}`,
          userId: row.id,
          batch: randomUUID(),
          title: "Tavan yarıda",
          body: `${card.label} kartının tavanının yarısı kullanıldı.`,
          createdAt: now,
          readAt: null,
          ref,
        });
      }
    }
    return "harcama" as const;
  });
  const target = result === "harcama" || result === "reddedildi" ? "/panel/islemler" : "/panel/kartlar";
  bounce(`${target}?vurgu=${encodeURIComponent(id)}`, result);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (user.role !== "yonetici") redirect("/panel");
  return user;
}

export async function adminBalanceAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const yon = String(formData.get("yon") || "");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  if (yon !== "artir" && yon !== "azalt") bounce("/admin", "e-tutar");
  if (amount === null || amount < 100 || amount > MAX_TOPUP_KURUS) bounce("/admin", "e-tutar");
  const signed = yon === "artir" ? amount : -amount;
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row) return "e-yok" as const;
    const next = row.balance + signed;
    if (next < 0) return "e-bakiye" as const;
    if (next > MAX_BALANCE_KURUS) return "e-tavan" as const;
    row.balance = next;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: null,
      kind: "duzeltme",
      title: yon === "artir" ? "Yönetici bakiyesi artırdı" : "Yönetici bakiyesi azalttı",
      note: "Simülasyon düzeltmesi. Tahsilat yoktur.",
      amount: signed,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "bakiye" as const;
  });
  bounce(`/admin?vurgu=${encodeURIComponent(userId)}`, result);
}

export async function adminCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const mode = String(formData.get("mod") || "");
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id);
    if (!card) return { code: "e-yok" as const, userId: "" };
    if (card.status === "kapali") return { code: "e-durum" as const, userId: card.userId };
    if (mode === "dondur") {
      if (card.status !== "aktif") return { code: "e-durum" as const, userId: card.userId };
      card.status = "donduruldu";
      return { code: "donduruldu" as const, userId: card.userId };
    }
    if (mode === "coz") {
      if (card.status !== "donduruldu") return { code: "e-durum" as const, userId: card.userId };
      card.status = "aktif";
      return { code: "cozuldu" as const, userId: card.userId };
    }
    return { code: "e-durum" as const, userId: card.userId };
  });
  bounce(`/admin?vurgu=${encodeURIComponent(result.userId)}`, result.code);
}

export async function adminAccountAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const mode = String(formData.get("mod") || "");
  const back = safeAdminReturn(formData, userId);
  if (userId === admin.id) bounce(back, "e-kendin");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row) return "e-yok" as const;
    if (row.role === "yonetici") return "e-yonetici" as const;
    if (mode === "aski") {
      row.status = "askida";
      return "askida" as const;
    }
    if (mode === "ac") {
      row.status = "acik";
      return "acildi" as const;
    }
    return "e-durum" as const;
  });
  bounce(`${back}?vurgu=${encodeURIComponent(userId)}`, result);
}

function safeAdminReturn(formData: FormData, userId: string) {
  const raw = String(formData.get("donus") || "");
  if (raw === "/admin" || raw === `/admin/kullanici/${userId}`) return raw;
  return "/admin";
}

export async function adminNoticeAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("baslik") || "").trim();
  const body = String(formData.get("mesaj") || "").trim();
  const hedef = String(formData.get("hedef") || "");
  if (title.length < 2 || title.length > 80 || body.length < 2 || body.length > 400) {
    bounce("/admin", "e-mesaj");
  }
  const result = mutate((db) => {
    const members = db.users.filter((user) => user.role === "uye");
    const targets = hedef === "tumu" ? members : members.filter((user) => user.id === hedef);
    if (targets.length === 0) return "e-hedef" as const;
    const batch = randomUUID();
    const createdAt = new Date().toISOString();
    for (const user of targets) {
      db.notices.push({
        id: `nt_${randomUUID()}`,
        userId: user.id,
        batch,
        title,
        body,
        createdAt,
        readAt: null,
        ref: null,
      });
    }
    return "gonderildi" as const;
  });
  bounce("/admin", result);
}

export async function adminSetBalanceAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const next = parseTryToKurus(String(formData.get("bakiye") || ""));
  const back = safeAdminReturn(formData, userId);
  if (next === null || next > MAX_BALANCE_KURUS) bounce(back, "e-tutar");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row || row.role !== "uye") return "e-yonetici" as const;
    const delta = next - row.balance;
    row.balance = next;
    if (delta !== 0) {
      db.transactions.push({
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: null,
        kind: "duzeltme",
        title: "Yönetici bakiyeyi yazdı",
        note: "Simülasyon düzeltmesi. Tahsilat yoktur.",
        amount: delta,
        status: "tamamlandi",
        createdAt: new Date().toISOString(),
      });
    }
    return "bakiye" as const;
  });
  bounce(back, result);
}

export async function adminEditCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const label = String(formData.get("etiket") || "").trim();
  const limit = parseTryToKurus(String(formData.get("limit") || ""));
  const status = String(formData.get("durum") || "");
  const userId = String(formData.get("uye") || "");
  const back = safeAdminReturn(formData, userId);
  if (label.length < 2 || label.length > 32) bounce(back, "e-etiket");
  if (status !== "hazirlaniyor" && status !== "aktif" && status !== "donduruldu" && status !== "kapali") {
    bounce(back, "e-durum");
  }
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === userId);
    if (!card) return "e-yok" as const;
    if (limit === null || limit < MIN_LIMIT_KURUS || limit > MAX_LIMIT_KURUS || limit < card.spent) {
      return "e-limit" as const;
    }
    card.label = label;
    card.limit = limit;
    card.status = status;
    card.readyAt = status === "hazirlaniyor" ? new Date(Date.now() + CARD_PREP_MS).toISOString() : null;
    return "kart" as const;
  });
  bounce(back, result);
}

export async function adminEditTxAction(formData: FormData) {
  await requireAdmin();
  const txId = String(formData.get("islem") || "");
  const userId = String(formData.get("uye") || "");
  const amount = parseSignedTryToKurus(String(formData.get("tutar") || ""));
  const back = safeAdminReturn(formData, userId);
  if (amount === null || Math.abs(amount) > MAX_BALANCE_KURUS) bounce(back, "e-tutar");
  const result = mutate((db) => {
    const tx = db.transactions.find((item) => item.id === txId && item.userId === userId);
    const row = db.users.find((item) => item.id === userId);
    if (!tx || !row || row.role !== "uye") return "e-yok" as const;
    const delta = amount - tx.amount;
    const touchesCard = tx.status === "tamamlandi" && (tx.kind === "harcama" || tx.kind === "iade");
    const card = tx.cardId ? db.cards.find((item) => item.id === tx.cardId) : undefined;
    const nextBalance = tx.status === "tamamlandi" ? row.balance + delta : row.balance;
    const nextSpent = card && touchesCard ? card.spent - delta : card?.spent;
    if (nextBalance < 0 || nextBalance > MAX_BALANCE_KURUS) return "e-bakiye" as const;
    if (touchesCard && card && (nextSpent === undefined || nextSpent < 0 || nextSpent > card.limit)) {
      return "e-limit" as const;
    }
    if (tx.status === "tamamlandi") row.balance = nextBalance;
    if (touchesCard && card && nextSpent !== undefined) card.spent = nextSpent;
    tx.amount = amount;
    return "islem" as const;
  });
  bounce(back, result);
}

function parseBinDraft(formData: FormData) {
  const label = String(formData.get("etiket") || "").replace(/\s+/g, " ").trim();
  const digits = String(formData.get("rakam") || "").replace(/\s/g, "");
  if (label.length < 2 || label.length > 40 || !/^\d{6,8}$/.test(digits)) return null;
  return { label, digits };
}

export async function adminBinAddAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("tur") || "");
  const draft = parseBinDraft(formData);
  if (!isCardType(type) || !draft) bounce("/admin?vurgu=binler", "e-bin-kayit");
  const result = mutate((db) => {
    if (db.bins.some((item) => item.type === type && item.digits === draft.digits)) return "e-bin-kayit" as const;
    db.bins.push({
      id: `bin_${randomUUID()}`,
      type,
      label: draft.label,
      digits: draft.digits,
    });
    return "bin" as const;
  });
  bounce("/admin?vurgu=binler", result);
}

export async function adminBinSaveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const draft = parseBinDraft(formData);
  if (!draft) bounce("/admin?vurgu=binler", "e-bin-kayit");
  const result = mutate((db) => {
    const row = db.bins.find((item) => item.id === id);
    if (!row) return "e-yok" as const;
    if (db.bins.some((item) => item.id !== id && item.type === row.type && item.digits === draft.digits)) {
      return "e-bin-kayit" as const;
    }
    row.label = draft.label;
    row.digits = draft.digits;
    return "bin" as const;
  });
  bounce("/admin?vurgu=binler", result);
}

export async function adminBinRemoveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const before = db.bins.length;
    db.bins = db.bins.filter((item) => item.id !== id);
    return before === db.bins.length ? ("e-yok" as const) : ("bin" as const);
  });
  bounce("/admin?vurgu=binler", result);
}

function parsePasteLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const split = trimmed.includes("|") ? trimmed.split("|") : null;
  const digits = (split ? split.pop() : trimmed.split(/\s+/).pop())?.replace(/\s/g, "") ?? "";
  const label = (split ? split.join("|") : trimmed.slice(0, trimmed.length - digits.length))
    .replace(/\s+/g, " ")
    .trim();
  if (label.length < 2 || label.length > 40 || !/^\d{6,8}$/.test(digits)) return null;
  return { label, digits };
}

export async function adminBinPasteAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("tur") || "");
  const lines = String(formData.get("yigin") || "").split(/\r?\n/);
  if (!isCardType(type)) bounce("/admin?vurgu=binler", "e-bin-kayit");
  const drafts = lines.map(parsePasteLine).filter((row): row is { label: string; digits: string } => row !== null);
  const result = mutate((db) => {
    const seen = new Set(db.bins.filter((row) => row.type === type).map((row) => row.digits));
    let added = 0;
    for (const draft of drafts) {
      if (seen.has(draft.digits)) continue;
      seen.add(draft.digits);
      db.bins.push({
        id: `bin_${randomUUID()}`,
        type,
        label: draft.label,
        digits: draft.digits,
      });
      added += 1;
    }
    return added > 0 ? ("bin" as const) : ("e-bin-kayit" as const);
  });
  bounce("/admin?vurgu=binler", result);
}

export async function refundAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  if (amount === null || amount <= 0 || amount > MAX_SPEND_KURUS) bounce("/panel/kartlar", "e-tutar");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status !== "aktif" || card.spent <= 0) return "e-durum" as const;
    const floor = Math.min(MIN_SPEND_KURUS, card.spent);
    if (amount < floor || amount > card.spent) return "e-tutar" as const;
    if (row.balance + amount > MAX_BALANCE_KURUS) return "e-tavan" as const;
    row.balance += amount;
    card.spent -= amount;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: card.id,
      kind: "iade",
      title: "Simülasyon iadesi",
      note: `${row.username} hesabına simülasyon iadesi yazıldı. Gerçek tahsilat yoktur.`,
      amount,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "iade" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function renewAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status === "kapali" || card.status === "hazirlaniyor") return "e-durum" as const;
    if (card.spent <= 0) return "e-yenile" as const;
    card.spent = 0;
    card.period += 1;
    db.transactions.push({
      id: `tx_${randomUUID()}`,
      userId: row.id,
      cardId: card.id,
      kind: "yenileme",
      title: `Tavan yenilendi · ${card.label}`,
      note: "Harcama sayacı sıfırlandı. Önceki harcamalar cüzdandan geri gelmez.",
      amount: 0,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "yenilendi" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

function movable(card: Card) {
  return card.status === "aktif" || card.status === "donduruldu";
}

export async function transferAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const hedef = String(formData.get("hedef") || "");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  if (hedef === "" || hedef === id) bounce("/panel/kartlar", "e-transfer-kart");
  if (amount === null || amount < MIN_TRANSFER_KURUS) bounce("/panel/kartlar", "e-transfer");
  const fee = transferFee(amount);
  const credit = amount - fee;
  if (fee < 1 || credit < 1) bounce("/panel/kartlar", "e-transfer");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const source = db.cards.find((item) => item.id === id && item.userId === user.id);
    const dest = db.cards.find((item) => item.id === hedef && item.userId === user.id);
    if (!row || !source || !dest) return "e-yok" as const;
    if (!movable(source) || !movable(dest)) return "e-durum" as const;
    if (amount > source.limit - source.spent) return "e-transfer" as const;
    if (dest.limit + credit > MAX_LIMIT_KURUS) return "e-transfer-tavan" as const;
    source.limit -= amount;
    dest.limit += credit;
    const now = new Date().toISOString();
    const feeText = formatTL(fee);
    db.transactions.push(
      {
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: source.id,
        kind: "transfer",
        title: `Aktarım · ${dest.label}`,
        note: `%2 komisyon ${feeText} kesildi. Karşı karta ${formatTL(credit)} yazıldı. Cüzdan değişmedi.`,
        amount: -amount,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
      {
        id: `tx_${randomUUID()}`,
        userId: row.id,
        cardId: dest.id,
        kind: "transfer",
        title: `Gelen aktarım · ${source.label}`,
        note: `%2 komisyon sonrası ${formatTL(credit)} yazıldı. Cüzdan değişmedi.`,
        amount: credit,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
    );
    if (source.limit > 0 && source.spent / source.limit >= 0.5) {
      const ref = `tavan50:${source.id}:${source.period}`;
      if (!db.notices.some((note) => note.ref === ref)) {
        db.notices.push({
          id: `nt_${randomUUID()}`,
          userId: row.id,
          batch: randomUUID(),
          title: "Tavan yarıda",
          body: `${source.label} kartının tavanının yarısı kullanıldı.`,
          createdAt: now,
          readAt: null,
          ref,
        });
      }
    }
    return "transfer" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function addressAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") redirect("/admin");
  const address = parseAddress(String(formData.get("adres") || ""));
  if (address === null) bounce("/panel/hesap", "e-adres");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    row.address = address;
    return "adres" as const;
  });
  bounce("/panel/hesap", result);
}

export async function displayNameAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") redirect("/admin");
  const name = parseDisplayName(String(formData.get("ad") || ""));
  if (!name) bounce("/panel/hesap", "e-ad");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    row.name = name;
    const line = holderLine(name);
    for (const card of db.cards) {
      if (card.userId === row.id) card.holder = line;
    }
    return "ad" as const;
  });
  bounce("/panel/hesap", result);
}

export async function passwordChangeAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") redirect("/admin");
  const current = String(formData.get("eski") || "");
  const next = String(formData.get("yeni") || "");
  const again = String(formData.get("yeni2") || "");
  if (next.length < 6 || next.length > 72 || next !== again) bounce("/panel/hesap", "e-parola");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    if (row.password !== current) return "e-parola-eski" as const;
    row.password = next;
    return "parola" as const;
  });
  bounce("/panel/hesap", result);
}

export async function markNoticeReadAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  mutate((db) => {
    const note = db.notices.find((item) => item.id === id && item.userId === user.id);
    if (note && !note.readAt) note.readAt = new Date().toISOString();
  });
  bounce("/panel/bildirimler", "okundu");
}

export async function markAllNoticesReadAction() {
  const user = await actor();
  const now = new Date().toISOString();
  mutate((db) => {
    for (const note of db.notices) {
      if (note.userId === user.id && !note.readAt) note.readAt = now;
    }
  });
  bounce("/panel/bildirimler", "okundu");
}

export async function adminEditTopupAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const iso = istanbulInputToIso(String(formData.get("zaman") || ""));
  const back = safeAdminReturn(formData, userId);
  if (!iso) bounce(back, "e-zaman");
  const result = mutate((db) => {
    const loads = db.transactions
      .filter((item) => item.userId === userId && item.kind === "yukleme" && item.status === "tamamlandi")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latest = loads[0];
    if (!latest) return "e-yukleme-yok" as const;
    latest.createdAt = iso;
    return "zaman" as const;
  });
  bounce(back, result);
}

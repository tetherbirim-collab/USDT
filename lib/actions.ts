"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { getCurrentUser, setSession, clearSession } from "./auth";
import {
  ISSUE_FEE_KURUS,
  MAX_BALANCE_KURUS,
  MAX_LIMIT_KURUS,
  MAX_SPEND_KURUS,
  MAX_TOPUP_KURUS,
  MIN_LIMIT_KURUS,
  MIN_SPEND_KURUS,
  MIN_TOPUP_KURUS,
  PLANS,
  isCardType,
  isMerchant,
} from "./catalog";
import { parseTryToKurus } from "./format";
import { verifyPassword } from "./password";
import { createUser, findUserByEmail, issueCard, mutate, openCardCount } from "./store";

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
  const email = String(formData.get("eposta") || "");
  const password = String(formData.get("parola") || "");
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "E-posta veya parola hatalı." };
  }
  await setSession(user.id);
  redirect("/panel");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("ad") || "").replace(/\s+/g, " ").trim();
  const email = String(formData.get("eposta") || "").trim().toLowerCase();
  const password = String(formData.get("parola") || "");
  if (name.length < 2 || name.length > 48) return { error: "Ad en az 2 karakter olmalı." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { error: "Geçerli bir e-posta yazın." };
  }
  if (password.length < 6 || password.length > 72) return { error: "Parola 6–72 karakter olmalı." };
  if (findUserByEmail(email)) return { error: "Bu e-posta ile bir simülasyon hesabı zaten var." };
  const user = createUser({ name, email, password });
  await setSession(user.id);
  redirect("/panel?bildirim=hosgeldin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function topupAction(formData: FormData) {
  const user = await actor();
  const which = String(formData.get("tutar") || "");
  const custom = String(formData.get("ozel") || "");
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
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    return "ok" as const;
  });
  const code = result === "ok" ? "yuklendi" : result === "tavan" ? "e-tavan" : "e-yok";
  bounce("/panel/yukle", code);
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
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return { code: "e-yok" as const };
    if (row.balance < ISSUE_FEE_KURUS) return { code: "e-bakiye" as const };
    const plan = PLANS[row.plan];
    if (openCardCount(db, row.id) >= plan.cardLimit) return { code: "e-plan" as const };
    const card = issueCard(db, {
      userId: row.id,
      type,
      label,
      limit,
      fee: ISSUE_FEE_KURUS,
    });
    return { code: "basildi" as const, id: card.id };
  });
  if (result.code !== "basildi") bounce("/panel/kartlar/yeni", result.code);
  bounce(`/panel/kartlar?vurgu=${result.id}`, "basildi");
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
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!card) return "e-yok" as const;
    if (card.status === "kapali") return "e-durum" as const;
    card.status = "kapali";
    return "kapatildi" as const;
  });
  bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function spendAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const merchant = String(formData.get("isletme") || "");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  if (!isMerchant(merchant)) bounce("/panel/kartlar", "e-isletme");
  if (amount === null || amount < MIN_SPEND_KURUS || amount > MAX_SPEND_KURUS) {
    bounce("/panel/kartlar", "e-tutar");
  }
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
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
      note: "Simüle harcama",
      amount: -amount,
      status: "tamamlandi",
      createdAt: now,
    });
    return "harcama" as const;
  });
  const target = result === "harcama" || result === "reddedildi" ? "/panel/islemler" : "/panel/kartlar";
  bounce(`${target}?vurgu=${encodeURIComponent(id)}`, result);
}

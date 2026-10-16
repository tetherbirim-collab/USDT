import { ADMIN_PATH, clearSession, deskPath, getCurrentUser, setSession } from "./auth";
import {
  CARD_PREP_MS,
  MAX_BALANCE_KURUS,
  MAX_BALANCE_USD_MINOR,
  MAX_LIMIT_KURUS,
  MAX_LIMIT_USD_MINOR,
  MAX_SPEND_USD_MINOR,
  MAX_USD_MINOR,
  MIN_LIMIT_USD_MINOR,
  MIN_SPEND_USD_MINOR,
  MIN_TRANSFER_KURUS,
  MIN_TRANSFER_USD_MINOR,
  MIN_USD_MINOR,
  fxRate,
  isCardType,
  noticeText,
  isMerchantForType,
  isPlan,
  loadFeeAt,
  SECURITY_QUESTIONS,
  transferFeeAt,
  usdMinorToKurus,
} from "./catalog";
import { foldAnswer, formatTL, formatUsd, holderLine, istanbulInputToIso, parseSignedTryToKurus, parseTryToKurus } from "./format";
import { payoutCoin, payoutNote } from "./coins";
import { digestSecret, foldSeed, passwordOk, randomSalt, seedOk, seedPhraseOk } from "./secrets";
import { COPY, COPY_KEYS } from "./copy";
import { createUser, findUserById, findUserByUsername, issueCard, mutate, openCardCount, parseAddress, parseDisplayName, parseUsername, pushNotice, readSettings, remoteCall, usingRemoteLedger } from "./store";
import type { DB, User, Card } from "./types";

export type FormState = { error: string; legacy?: boolean };

function rid() {
  return globalThis.crypto.randomUUID();
}

function go(path: string): never {
  const queryAt = path.indexOf("?");
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt);
  const query = queryAt === -1 ? "" : path.slice(queryAt);
  const href = pathname.endsWith("/") ? `${pathname}${query}` : `${pathname}/${query}`;
  if (typeof window !== "undefined") {
    window.location.assign(href);
    return new Promise(() => {}) as never;
  }
  throw new Error("yonlendirildi");
}

function bounce(path: string, code: string): never {
  const join = path.includes("?") ? "&" : "?";
  return go(`${path}${join}bildirim=${encodeURIComponent(code)}`);
}

async function actor() {
  const user = getCurrentUser();
  if (!user) return go("/giris");
  return user;
}

function pack(formData: FormData, names: string[]) {
  const fields: Record<string, string> = {};
  for (const name of names) fields[name] = String(formData.get(name) ?? "");
  return fields;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const password = String(formData.get("parola") || "");
  const remote = await remoteCall("login", { kullanici: String(formData.get("kullanici") || ""), parola: password });
  if (remote) {
    if (remote.code === "ok") {
      const me = getCurrentUser();
      if (me) setSession(me.id);
      return go(deskPath(me?.role ?? "uye"));
    }
    if (remote.code === "e-askida") return { error: "Bu hesap askıya alındı. Giriş kapalı." };
    if (remote.code === "e-kapali") return { error: "Bu hesap kalıcı olarak kapatıldı. Giriş kapalı." };
    return { error: "Kullanıcı adı veya parola hatalı." };
  }
  const user = username ? findUserByUsername(username) : undefined;
  if (!user || !(await passwordOk(user, password))) {
    return { error: "Kullanıcı adı veya parola hatalı." };
  }
  if (user.status === "askida") {
    return { error: "Bu hesap askıya alındı. Giriş kapalı." };
  }
  if (user.status === "kapali") {
    return { error: "Bu hesap kalıcı olarak kapatıldı. Giriş kapalı." };
  }
  await setSession(user.id);
  return go(deskPath(user.role));
}

function passwordPair(password: string, again: string): string | null {
  if (password.length < 6 || password.length > 72 || password !== again) {
    return "Parola 6–72 karakter olmalı ve iki kutu aynı olmalı.";
  }
  return null;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const password = String(formData.get("parola") || "");
  const again = String(formData.get("parola2") || "");
  const seed = foldSeed(String(formData.get("tohum") || ""));
  if (!username) return { error: "Kullanıcı adı 2–24 karakter olmalı. Yalnızca harf, rakam ve alt çizgi yaz." };
  if (!/^\d{8}$/.test(password) || password !== again) return { error: "Parola 8 haneli rakam olmalı ve iki kutu aynı olmalı." };
  if (!seedPhraseOk(seed)) return { error: "Tohum 8 ile 16 kelime olmalı." };
  const remote = await remoteCall("register", { kullanici: username, parola: password, parola2: again, tohum: seed });
  if (remote) {
    if (remote.code === "ok") {
      const me = getCurrentUser();
      if (me) setSession(me.id);
      return go("/panel?bildirim=hosgeldin");
    }
    if (remote.code === "e-kullanici") return { error: "Kullanıcı adı 2–24 karakter olmalı. Yalnızca harf, rakam ve alt çizgi yaz." };
    if (remote.code === "e-parola") return { error: "Parola 8 haneli rakam olmalı ve iki kutu aynı olmalı." };
    if (remote.code === "e-tohum") return { error: "Tohum 8 ile 16 kelime olmalı." };
    if (remote.code === "e-var") return { error: "Bu kullanıcı adı zaten var. Sayfayı yenileyip yeniden dene." };
    return { error: "Kayıt yazılamadı. Sayfayı yenile." };
  }
  if (findUserByUsername(username)) return { error: "Bu kullanıcı adı zaten var. Sayfayı yenileyip yeniden dene." };
  const passSalt = randomSalt();
  const seedSalt = randomSalt();
  const user = createUser({
    username,
    password: "",
    name: username,
    passSalt,
    passHash: await digestSecret(password, passSalt),
    seedSalt,
    seedHash: await digestSecret(seed, seedSalt),
  });
  if (!user) return { error: "Bu kullanıcı adı zaten var. Sayfayı yenileyip yeniden dene." };
  await setSession(user.id);
  return go("/panel?bildirim=hosgeldin");
}

export async function seedLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const remote = await remoteCall("tohum", pack(formData, ["kullanici", "tohum"]));
  if (remote) {
    if (remote.code === "ok") {
      const me = getCurrentUser();
      if (me) setSession(me.id);
      return go(deskPath(me?.role ?? "uye"));
    }
    if (remote.code === "e-askida") return { error: "Bu hesap askıya alındı. Giriş kapalı." };
    if (remote.code === "e-kapali") return { error: "Bu hesap kalıcı olarak kapatıldı. Giriş kapalı." };
    if (remote.code === "e-kullanici") return { error: "Kullanıcı adını yaz." };
    if (remote.code === "e-tohum") return { error: "Tohum 8 ile 16 kelime olmalı." };
    if (remote.code === "e-tohum-yok") return { error: "Bu hesapta tohum yok. Eski hesap formu açıldı.", legacy: true };
    return { error: "Kullanıcı adı veya tohum hatalı." };
  }
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const phrase = String(formData.get("tohum") || "");
  if (!username) return { error: "Kullanıcı adını yaz." };
  if (!seedPhraseOk(phrase)) return { error: "Tohum 8 ile 16 kelime olmalı." };
  const user = findUserByUsername(username);
  if (!user || user.role !== "uye") return { error: "Kullanıcı adı veya tohum hatalı." };
  if (user.status === "askida") return { error: "Bu hesap askıya alındı. Giriş kapalı." };
  if (user.status === "kapali") return { error: "Bu hesap kalıcı olarak kapatıldı. Giriş kapalı." };
  if (!user.seedHash || !user.seedSalt) {
    if (user.securityQuestion && user.securityAnswer) {
      return { error: "Bu hesapta tohum yok. Eski hesap formu açıldı.", legacy: true };
    }
    return { error: "Kullanıcı adı veya tohum hatalı." };
  }
  if (!(await seedOk(user, phrase))) return { error: "Kullanıcı adı veya tohum hatalı." };
  await setSession(user.id);
  return go(deskPath(user.role));
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("parola") || "");
  const again = String(formData.get("parola2") || "");
  const pair = passwordPair(password, again);
  if (pair) return { error: pair };
  const remote = await remoteCall("unuttum", pack(formData, ["kullanici", "soru", "cevap", "parola", "parola2"]));
  if (remote) {
    if (remote.code === "sifre") {
      const me = getCurrentUser();
      if (me) setSession(me.id);
      return go("/panel?bildirim=sifre");
    }
    if (remote.code === "e-kullanici") return { error: "Kullanıcı adını yaz. 2–24 karakter, harf, rakam ve alt çizgi." };
    if (remote.code === "e-parola") return { error: pair || "Parola 6–72 karakter olmalı ve iki kutu aynı olmalı." };
    if (remote.code === "e-soru") return { error: "Güvenlik sorusunu listeden seç." };
    if (remote.code === "e-cevap") return { error: "Güvenlik yanıtını yaz." };
    if (remote.code === "e-sorusuz") return { error: "Bu hesapta güvenlik sorusu yok. Giriş yapıp Hesap sayfasından kaydet." };
    return { error: "Kullanıcı adı, soru veya yanıt hatalı." };
  }
  const username = parseUsername(String(formData.get("kullanici") || ""));
  const question = String(formData.get("soru") || "");
  const answer = foldAnswer(String(formData.get("cevap") || ""));
  if (!username) return { error: "Kullanıcı adını yaz." };
  const user = findUserByUsername(username);
  if (!user || user.role !== "uye") return { error: "Kullanıcı adı, soru veya yanıt hatalı." };
  if (!user.securityQuestion || !user.securityAnswer) return { error: "Bu hesapta güvenlik sorusu yok. Giriş yapıp Hesap sayfasından kaydet." };
  if (user.securityQuestion !== question || user.securityAnswer !== answer) return { error: "Kullanıcı adı, soru veya yanıt hatalı." };
  mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return;
    row.password = password;
    pushNotice(db, { userId: row.id, title: "Parola yenilendi", body: "Yeni parolan kaydedildi. Bu parola ile girersin." });
  });
  await setSession(user.id);
  return go("/panel?bildirim=sifre");
}

export async function securityQuestionAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/panel/hesap");
  const remote = await remoteCall("soru", pack(formData, ["eski", "soru", "cevap"]));
  if (remote) return bounce("/panel/hesap", remote.code);
  const question = String(formData.get("soru") || "");
  const answer = foldAnswer(String(formData.get("cevap") || ""));
  const current = String(formData.get("eski") || "");
  if (!SECURITY_QUESTIONS.some((item) => item.id === question)) return bounce("/panel/hesap", "e-soru");
  if (answer.length < 2 || answer.length > 40) return bounce("/panel/hesap", "e-cevap");
  const known = findUserById(user.id);
  if (!known || !(await passwordOk(known, current))) return bounce("/panel/hesap", "e-parola-eski");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return "e-parola-eski" as const;
    row.securityQuestion = question;
    row.securityAnswer = answer;
    pushNotice(db, { userId: row.id, title: "Güvenlik sorusu kaydedildi", body: "Şifreni unutursan kullanıcı adın ve bu yanıtla yeni parola belirlersin." });
    return "soru" as const;
  });
  return bounce("/panel/hesap", result);
}

export async function logoutAction() {
  if (usingRemoteLedger()) await remoteCall("logout", {});
  await clearSession();
  return go("/");
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
    id: `tx_${rid()}`,
    userId: row.id,
    cardId: card.id,
    kind: "duzeltme",
    title: `Basım iadesi · ${card.label}`,
    note: "Basım ücreti bakiyeye geri yazıldı.",
    amount: fee,
    usdMinor: null,
    status: "tamamlandi",
    createdAt: new Date().toISOString(),
  });
  return "ok";
}

export async function issueAction(formData: FormData) {
  const user = await actor();
  const typeRaw = String(formData.get("tur") || "");
  const label = String(formData.get("etiket") || "").replace(/\s+/g, " ").trim();
  if (!isCardType(typeRaw)) return bounce("/panel/kartlar/yeni", "e-tur");
  if (label.length < 2 || label.length > 32) return bounce("/panel/kartlar/yeni", "e-etiket");
  const type = typeRaw;
  const binId = String(formData.get("bin") || "");
  const hesap = String(formData.get("hesap") || "");
  if (hesap !== user.id) return bounce("/panel/kartlar/yeni", "e-hesap");
  const remote = await remoteCall("issue", pack(formData, ["tur", "etiket", "bin", "hesap"]));
  if (remote) {
    if (remote.code !== "basildi" || !remote.id) return bounce("/panel/kartlar/yeni", remote.code);
    return bounce(`/panel/kartlar?vurgu=${remote.id}`, "siparis");
  }
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row) return { code: "e-yok" as const };
    const chosen = db.bins.find((item) => item.id === binId && item.type === type);
    if (!chosen) return { code: "e-bin" as const };
    const fee = db.settings.issueFeeKurus;
    if (row.balance < fee) return { code: "e-bakiye" as const };
    const plan = db.settings.plans[row.plan];
    if (openCardCount(db, row.id) >= plan.cardLimit) return { code: "e-plan" as const };
    const card = issueCard(db, {
      userId: row.id,
      type,
      label,
      limit: 0,
      fee,
      bin: chosen.digits,
      binLabel: chosen.label,
    });
    pushNotice(db, {
      userId: row.id,
      title: "Kart bedeli düştü",
      body: `${card.label} için hesabından yalnız basım ücreti ${formatTL(fee)} düştü. Kullanılabilir bakiye 0. Kalan bakiye ${formatTL(row.balance)}.`,
    });
    return { code: "basildi" as const, id: card.id };
  });
  if (result.code !== "basildi") return bounce("/panel/kartlar/yeni", result.code);
  return bounce(`/panel/kartlar?vurgu=${result.id}`, "siparis");
}

export async function fundCardAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (cents === null || cents < MIN_USD_MINOR || cents > MAX_USD_MINOR) return bounce("/panel/kartlar", "e-tutar");
  const gross = usdMinorToKurus(cents);
  const tuned = readSettings();
  const commission = loadFeeAt(tuned.loadFeePercent, gross);
  const net = gross - commission;
  if (net < 1) return bounce("/panel/kartlar", "e-tutar");
  const remote = await remoteCall("fund", pack(formData, ["id", "tutar"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status === "kapali") return "e-durum" as const;
    if (row.balance < gross) return "e-bakiye" as const;
    if (card.limit + net > MAX_LIMIT_KURUS) return "e-limit" as const;
    row.balance -= gross;
    card.limit += net;
    const now = new Date().toISOString();
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: card.id,
      kind: "yukleme",
      title: `Karta yükleme · ${card.label}`,
      note: `Hesaptan ${formatTL(gross)} ayrıldı. %${String(db.settings.loadFeePercent).replace(".", ",")} komisyon ${formatTL(commission)}. Karta ${formatTL(net)} yazıldı.`,
      amount: -gross,
      usdMinor: -cents,
      status: "tamamlandi",
      createdAt: now,
    });
    pushNotice(db, {
      userId: row.id,
      title: "Karta yükleme düştü",
      body: `${card.label} kartına ${formatTL(net)} yazıldı. Hesaptan ${formatTL(gross)} düştü, komisyon ${formatTL(commission)}. Kalan bakiye ${formatTL(row.balance)}.`,
    });
    return "yuklendi_kart" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function freezeAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const mode = String(formData.get("mod") || "");
  const remote = await remoteCall("freeze", pack(formData, ["id", "mod"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!card) return "e-yok" as const;
    if (card.status === "kapali") return "e-durum" as const;
    if (mode === "dondur") {
      if (card.status !== "aktif") return "e-durum" as const;
      card.status = "donduruldu";
      pushNotice(db, {
        userId: user.id,
        title: "Kart donduruldu",
        body: `${card.label} donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.`,
      });
      return "donduruldu" as const;
    }
    if (mode === "coz") {
      if (card.status !== "donduruldu") return "e-durum" as const;
      card.status = "aktif";
      pushNotice(db, {
        userId: user.id,
        title: "Kart aktif",
        body: `${card.label} yeniden açık. Harcama devam edebilir.`,
      });
      return "cozuldu" as const;
    }
    return "e-durum" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function activateCardAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("activate", pack(formData, ["id"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status !== "donduruldu" && card.status !== "kapali") return "e-durum" as const;
    const fee = db.settings.issueFeeKurus;
    if (card.status === "kapali" && openCardCount(db, row.id) >= db.settings.plans[row.plan].cardLimit) {
      return "e-plan" as const;
    }
    if (row.balance < fee) return "e-bakiye" as const;
    const closed = card.status === "kapali";
    row.balance -= fee;
    card.status = "aktif";
    card.readyAt = null;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: card.id,
      kind: "basim",
      title: `Kart bedeli · ${card.label}`,
      note: closed ? "Kapanmış kart yeniden açıldı." : "Dondurulmuş kart aktif edildi.",
      amount: -fee,
      usdMinor: null,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    pushNotice(db, {
      userId: row.id,
      title: closed ? "Kart yeniden açıldı" : "Kart aktif",
      body: `${card.label} açık bölüme alındı. Kart bedeli ${formatTL(fee)} bakiyeden düştü. Kalan bakiye ${formatTL(row.balance)}.`,
    });
    return closed ? ("kart-acildi" as const) : ("cozuldu" as const);
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function closeAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  if (String(formData.get("onay") || "") !== "on") return bounce("/panel/kartlar", "e-onay");
  const remote = await remoteCall("close", pack(formData, ["id", "onay"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status === "kapali" || card.status === "hazirlaniyor") return "e-durum" as const;
    const refund = refundIssueFee(db, row, card);
    if (refund === "tavan") return "e-tavan" as const;
    card.status = "kapali";
    pushNotice(db, {
      userId: row.id,
      title: "Kart kapatıldı",
      body: `${card.label} kapatıldı. Basım ücreti bakiyeye geri yazıldı.`,
    });
    return "kapatildi" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function purgeCardAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  if (String(formData.get("onay") || "") !== "on") return bounce("/panel/kartlar", "e-onay");
  const remote = await remoteCall("purge", pack(formData, ["id", "onay"]));
  if (remote) return bounce("/panel/kartlar", remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!card) return "e-yok" as const;
    if (card.status !== "kapali") return "e-durum" as const;
    const label = card.label;
    db.cards = db.cards.filter((item) => item.id !== id);
    db.orders = db.orders.filter((item) => item.cardId !== id);
    pushNotice(db, {
      userId: user.id,
      title: "Kart silindi",
      body: `${label} kalıcı olarak silindi. Cüzdan hareketi duruyor.`,
    });
    return "silindi" as const;
  });
  return bounce("/panel/kartlar", result);
}

export async function cancelOrderAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("cancel", pack(formData, ["id"]));
  if (remote) return bounce("/panel/siparisler", remote.code);
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
    pushNotice(db, {
      userId: row.id,
      title: "Sipariş iptal edildi",
      body: `${card.label} siparişi iptal edildi. Basım ücreti bakiyeye döndü.`,
    });
    return "iptal" as const;
  });
  return bounce("/panel/siparisler", result);
}

export async function planAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/clayadm!nxx");
  const plan = String(formData.get("plan") || "");
  if (!isPlan(plan)) return bounce("/panel/yukselt", "e-plan");
  const remote = await remoteCall("plan", { plan });
  if (remote) return bounce("/panel/yukselt", remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    if (row.plan === plan) return "plan-ayni" as const;
    const priced = db.settings.plans[plan];
    if (openCardCount(db, row.id) > priced.cardLimit) return "e-plan-dolu" as const;
    const price = usdMinorToKurus(priced.priceUsdMinor);
    if (price > row.balance) return "e-bakiye" as const;
    if (price > 0) {
      row.balance -= price;
      db.transactions.push({
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: null,
        kind: "duzeltme",
        title: `Plan · ${priced.name}`,
        note: "Plan ücreti bakiyeden düştü.",
        amount: -price,
        usdMinor: -priced.priceUsdMinor,
        status: "tamamlandi",
        createdAt: new Date().toISOString(),
      });
    }
    row.plan = plan;
    row.planUntil = new Date(Date.now() + 30 * 86_400_000).toISOString();
    pushNotice(db, {
      userId: row.id,
      title: "Plan güncellendi",
      body: `Vitrin planın ${priced.name} oldu. Plan ücreti ${formatTL(price)} bakiyeden düştü. Kalan bakiye ${formatTL(row.balance)}.`,
    });
    return "plan" as const;
  });
  return bounce("/panel/yukselt", result);
}

export async function spendAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const merchant = String(formData.get("isletme") || "");
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (cents === null || cents < MIN_SPEND_USD_MINOR || cents > MAX_SPEND_USD_MINOR) {
    return bounce("/panel/kartlar", "e-tutar");
  }
  const amount = usdMinorToKurus(cents);
  const remote = await remoteCall("spend", pack(formData, ["id", "isletme", "tutar"]));
  if (remote) {
    const target = remote.code === "reddedildi" ? "/panel/islemler" : "/panel/kartlar";
    return bounce(`${target}?vurgu=${encodeURIComponent(id)}`, remote.code);
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
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: card.id,
        kind: "harcama",
        title: merchant,
        note: "Limit aşıldı",
        amount: -amount,
        usdMinor: -cents,
        status: "reddedildi",
        createdAt: now,
      });
      pushNotice(db, {
        userId: row.id,
        title: "Harcama reddedildi",
        body: `${card.label} kartında ${merchant} işlemi kullanılabilir bakiyeyi aştığı için geçmedi.`,
      });
      return "reddedildi" as const;
    }
    if (amount > row.balance) {
      db.transactions.push({
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: card.id,
        kind: "harcama",
        title: merchant,
        note: "Yetersiz bakiye",
        amount: -amount,
        usdMinor: -cents,
        status: "reddedildi",
        createdAt: now,
      });
      pushNotice(db, {
        userId: row.id,
        title: "Harcama reddedildi",
        body: `${card.label} kartında ${merchant} işlemi için bakiye yetmedi.`,
      });
      return "reddedildi" as const;
    }
    row.balance -= amount;
    card.spent += amount;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: card.id,
      kind: "harcama",
      title: merchant,
      note: `${formatUsd(cents)} karşılığı ${formatTL(amount)} düştü.`,
      amount: -amount,
      usdMinor: -cents,
      status: "tamamlandi",
      createdAt: now,
    });
    pushNotice(db, {
      userId: row.id,
      title: "Harcama işlendi",
      body: `${card.label} · ${merchant}: ${formatTL(amount)} düştü.`,
    });
    if (card.limit > 0 && card.spent / card.limit >= 0.5) {
      pushNotice(db, {
        userId: row.id,
        title: "Bakiye yarıda",
        body: `${card.label} kartının kullanılabilir bakiyesinin yarısı kullanıldı.`,
        ref: `tavan50:${card.id}:${card.period}`,
      });
    }
    return "harcama" as const;
  });
  const target = result === "reddedildi" ? "/panel/islemler" : "/panel/kartlar";
  return bounce(`${target}?vurgu=${encodeURIComponent(id)}`, result);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return go("/giris");
  if (user.role !== "yonetici") return go("/panel");
  return user;
}

export async function adminBalanceAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const yon = String(formData.get("yon") || "");
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (yon !== "artir" && yon !== "azalt") return bounce("/clayadm!nxx/uyeler", "e-tutar");
  if (cents === null || cents < MIN_USD_MINOR || cents > MAX_USD_MINOR) return bounce("/clayadm!nxx/uyeler", "e-tutar");
  const signed = usdMinorToKurus(yon === "artir" ? cents : -cents);
  const signedCents = yon === "artir" ? cents : -cents;
  const remote = await remoteCall("admin-balance", pack(formData, ["uye", "yon", "tutar"]));
  if (remote) return bounce(`/clayadm!nxx/uyeler?vurgu=${encodeURIComponent(userId)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row) return "e-yok" as const;
    const next = row.balance + signed;
    if (next < 0) return "e-bakiye" as const;
    if (next > MAX_BALANCE_KURUS) return "e-tavan" as const;
    row.balance = next;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: null,
      kind: "duzeltme",
      title: yon === "artir" ? "Yönetici bakiyesi artırdı" : "Yönetici bakiyesi azalttı",
      note: `${formatUsd(Math.abs(signedCents))} karşılığı.`,
      amount: signed,
      usdMinor: signedCents,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    pushNotice(db, {
      userId: row.id,
      title: yon === "artir" ? "Bakiye arttı" : "Bakiye düştü",
      body: `${formatTL(Math.abs(signed))} bakiyene işlendi.`,
    });
    return "bakiye" as const;
  });
  return bounce(`/clayadm!nxx/uyeler?vurgu=${encodeURIComponent(userId)}`, result);
}

export async function adminCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const mode = String(formData.get("mod") || "");
  const rawBack = String(formData.get("donus") || "");
  const dest = rawBack.startsWith("/clayadm!nxx") ? rawBack : `/clayadm!nxx/kartlar?vurgu=${encodeURIComponent(id)}`;
  const remote = await remoteCall("admin-card", pack(formData, ["id", "mod", "donus"]));
  if (remote) return bounce(dest, remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id);
    if (!card) return { code: "e-yok" as const, userId: "" };
    if (card.status === "kapali") return { code: "e-durum" as const, userId: card.userId };
    if (mode === "dondur") {
      if (card.status !== "aktif") return { code: "e-durum" as const, userId: card.userId };
      card.status = "donduruldu";
      pushNotice(db, {
        userId: card.userId,
        title: "Kart donduruldu",
        body: `${card.label} donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.`,
      });
      return { code: "donduruldu" as const, userId: card.userId };
    }
    if (mode === "coz") {
      if (card.status !== "donduruldu") return { code: "e-durum" as const, userId: card.userId };
      card.status = "aktif";
      pushNotice(db, {
        userId: card.userId,
        title: "Kart aktif",
        body: `${card.label} yeniden açık. Harcama devam edebilir.`,
      });
      return { code: "cozuldu" as const, userId: card.userId };
    }
    return { code: "e-durum" as const, userId: card.userId };
  });
  return bounce(dest, result.code);
}

export async function adminAccountAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const mode = String(formData.get("mod") || "");
  const back = safeAdminReturn(formData, userId);
  if (userId === admin.id) return bounce(back, "e-kendin");
  const remote = await remoteCall("admin-account", pack(formData, ["uye", "mod", "donus"]));
  if (remote) {
    const join = back.includes("?") ? "&" : "?";
    return bounce(`${back}${join}vurgu=${encodeURIComponent(userId)}`, remote.code);
  }
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row) return "e-yok" as const;
    if (row.role === "yonetici") return "e-yonetici" as const;
    if (mode === "aski") {
      row.status = "askida";
      pushNotice(db, {
        userId: row.id,
        title: "Hesap askıda",
        body: "Girişin kapatıldı. Hesap açılınca buradan haberin olur.",
      });
      return "askida" as const;
    }
    if (mode === "ac") {
      row.status = "acik";
      pushNotice(db, {
        userId: row.id,
        title: "Hesap açıldı",
        body: "Girişin yeniden açık.",
      });
      return "acildi" as const;
    }
    return "e-durum" as const;
  });
  const join = back.includes("?") ? "&" : "?";
  return bounce(`${back}${join}vurgu=${encodeURIComponent(userId)}`, result);
}

function safeAdminReturn(formData: FormData, userId: string) {
  const raw = String(formData.get("donus") || "");
  if (raw.startsWith("/clayadm!nxx")) return raw;
  return `/clayadm!nxx/kullanici?id=${userId}`;
}

export async function adminNoticeAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("baslik") || "").trim();
  const body = String(formData.get("mesaj") || "").trim();
  const hedef = String(formData.get("hedef") || "");
  if (title.length < 2 || title.length > 80 || body.length < 2 || body.length > 400) {
    return bounce("/clayadm!nxx/bildirimler", "e-mesaj");
  }
  const remote = await remoteCall("admin-notice", pack(formData, ["baslik", "mesaj", "hedef"]));
  if (remote) return bounce("/clayadm!nxx/bildirimler", remote.code);
  const result = mutate((db) => {
    const members = db.users.filter((user) => user.role === "uye");
    const targets = hedef === "tumu" ? members : members.filter((user) => user.id === hedef);
    if (targets.length === 0) return "e-hedef" as const;
    const batch = rid();
    const createdAt = new Date().toISOString();
    for (const user of targets) {
      db.notices.push({
        id: `nt_${rid()}`,
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
  return bounce("/clayadm!nxx/bildirimler", result);
}

export async function ticketAction(formData: FormData) {
  const user = await actor();
  const subject = String(formData.get("konu") || "").replace(/\s+/g, " ").trim();
  const body = String(formData.get("sikayet") || "").replace(/\s+/g, " ").trim();
  if (subject.length < 2 || subject.length > 80 || body.length < 4 || body.length > 800) {
    return bounce("/panel/destek", "e-talep");
  }
  const remote = await remoteCall("ticket", pack(formData, ["konu", "sikayet"]));
  if (remote) return bounce("/panel/destek", remote.code || "talep");
  mutate((db) => {
    db.tickets.push({
      id: `tkt_${rid()}`,
      userId: user.id,
      subject,
      body,
      status: "acik",
      createdAt: new Date().toISOString(),
      reply: null,
      repliedAt: null,
    });
    pushNotice(db, {
      userId: user.id,
      title: "Talebin alındı",
      body: `${subject}. Şikayet yönetim masasına düştü.`,
    });
  });
  return bounce("/panel/destek", "talep");
}

export async function adminTicketReplyAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const reply = String(formData.get("yanit") || "").replace(/\s+/g, " ").trim();
  if (reply.length < 2 || reply.length > 400) return bounce("/clayadm!nxx/destek", "e-yanit");
  const remote = await remoteCall("admin-ticket", pack(formData, ["id", "yanit"]));
  if (remote) return bounce("/clayadm!nxx/destek", remote.code);
  const result = mutate((db) => {
    const ticket = db.tickets.find((item) => item.id === id);
    if (!ticket) return "e-yok" as const;
    ticket.reply = reply;
    ticket.repliedAt = new Date().toISOString();
    ticket.status = "yanitlandi";
    pushNotice(db, {
      userId: ticket.userId,
      title: "Destek yanıtı",
      body: `${ticket.subject}: ${reply}`,
    });
    return "yanit" as const;
  });
  return bounce("/clayadm!nxx/destek", result);
}

export async function adminSetBalanceAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const cents = parseTryToKurus(String(formData.get("bakiye") || ""));
  const back = safeAdminReturn(formData, userId);
  if (cents === null || cents > MAX_BALANCE_USD_MINOR) return bounce(back, "e-tutar");
  const next = usdMinorToKurus(cents);
  const remote = await remoteCall("admin-set-balance", pack(formData, ["uye", "bakiye", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId);
    if (!row || row.role !== "uye") return "e-yonetici" as const;
    const delta = next - row.balance;
    row.balance = next;
    if (delta !== 0) {
      db.transactions.push({
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: null,
        kind: "duzeltme",
        title: "Yönetici bakiyeyi yazdı",
        note: `${formatUsd(cents)} karşılığı.`,
        amount: delta,
        usdMinor: cents,
        status: "tamamlandi",
        createdAt: new Date().toISOString(),
      });
      pushNotice(db, {
        userId: row.id,
        title: "Bakiye güncellendi",
        body: `Bakiyen ${formatTL(next)} olarak yazıldı.`,
      });
    }
    return "bakiye" as const;
  });
  return bounce(back, result);
}

export async function adminEditCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const label = String(formData.get("etiket") || "").trim();
  const limitCents = parseTryToKurus(String(formData.get("limit") || ""));
  const status = String(formData.get("durum") || "");
  const userId = String(formData.get("uye") || "");
  const back = safeAdminReturn(formData, userId);
  if (label.length < 2 || label.length > 32) return bounce(back, "e-etiket");
  if (limitCents === null || limitCents < MIN_LIMIT_USD_MINOR || limitCents > MAX_LIMIT_USD_MINOR) {
    return bounce(back, "e-limit");
  }
  if (status !== "hazirlaniyor" && status !== "aktif" && status !== "donduruldu" && status !== "kapali") {
    return bounce(back, "e-durum");
  }
  const limit = usdMinorToKurus(limitCents);
  const remote = await remoteCall("admin-edit-card", pack(formData, ["id", "etiket", "limit", "durum", "uye", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === userId);
    if (!card) return "e-yok" as const;
    if (limit < card.spent || limit > MAX_LIMIT_KURUS) return "e-limit" as const;
    const was = card.status;
    card.label = label;
    card.holder = holderLine(label);
    card.limit = limit;
    card.status = status;
    card.readyAt = status === "hazirlaniyor" ? new Date(Date.now() + CARD_PREP_MS).toISOString() : null;
    if (was !== "donduruldu" && status === "donduruldu") {
      pushNotice(db, {
        userId: card.userId,
        title: "Kart donduruldu",
        body: `${card.label} donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.`,
      });
    } else if (was === "donduruldu" && status === "aktif") {
      pushNotice(db, {
        userId: card.userId,
        title: "Kart aktif",
        body: `${card.label} yeniden açık. Harcama devam edebilir.`,
      });
    } else {
      pushNotice(db, {
        userId: card.userId,
        title: "Kart kaydı güncellendi",
        body: `${card.label} kartının kaydı yönetim masasında yenilendi.`,
      });
    }
    return "kart" as const;
  });
  return bounce(back, result);
}

export async function adminEditTxAction(formData: FormData) {
  await requireAdmin();
  const txId = String(formData.get("islem") || "");
  const userId = String(formData.get("uye") || "");
  const cents = parseSignedTryToKurus(String(formData.get("tutar") || ""));
  const back = safeAdminReturn(formData, userId);
  if (cents === null || Math.abs(cents) > MAX_BALANCE_USD_MINOR) return bounce(back, "e-tutar");
  const amount = cents < 0 ? -usdMinorToKurus(-cents) : usdMinorToKurus(cents);
  const remote = await remoteCall("admin-edit-tx", pack(formData, ["islem", "uye", "tutar", "donus"]));
  if (remote) return bounce(back, remote.code);
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
    tx.usdMinor = cents;
    pushNotice(db, {
      userId: row.id,
      title: "İşlem güncellendi",
      body: "Bir hareketinin tutarı yönetim masasında düzeltildi.",
    });
    return "islem" as const;
  });
  return bounce(back, result);
}

function parseBinDraft(formData: FormData) {
  const label = String(formData.get("etiket") || "").replace(/\s+/g, " ").trim();
  const digits = String(formData.get("rakam") || "").replace(/\s/g, "");
  if (label.length < 2 || label.length > 40 || !/^\d{4,8}$/.test(digits)) return null;
  return { label, digits };
}

export async function adminBinAddAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("tur") || "");
  const draft = parseBinDraft(formData);
  if (!isCardType(type) || !draft) return bounce("/clayadm!nxx/bin", "e-bin-kayit");
  const remote = await remoteCall("admin-bin-add", pack(formData, ["tur", "etiket", "rakam"]));
  if (remote) return bounce("/clayadm!nxx/bin", remote.code);
  const result = mutate((db) => {
    if (db.bins.some((item) => item.type === type && item.digits === draft.digits)) return "e-bin-kayit" as const;
    db.bins.push({
      id: `bin_${rid()}`,
      type,
      label: draft.label,
      digits: draft.digits,
    });
    return "bin" as const;
  });
  return bounce("/clayadm!nxx/bin", result);
}

export async function adminBinSaveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const draft = parseBinDraft(formData);
  if (!draft) return bounce("/clayadm!nxx/bin", "e-bin-kayit");
  const remote = await remoteCall("admin-bin-save", pack(formData, ["id", "etiket", "rakam"]));
  if (remote) return bounce("/clayadm!nxx/bin", remote.code);
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
  return bounce("/clayadm!nxx/bin", result);
}

export async function adminBinRemoveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("admin-bin-remove", pack(formData, ["id"]));
  if (remote) return bounce("/clayadm!nxx/bin", remote.code);
  const result = mutate((db) => {
    const before = db.bins.length;
    db.bins = db.bins.filter((item) => item.id !== id);
    return before === db.bins.length ? ("e-yok" as const) : ("bin" as const);
  });
  return bounce("/clayadm!nxx/bin", result);
}

function parsePasteLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const split = trimmed.includes("|") ? trimmed.split("|") : null;
  const digits = (split ? split.pop() : trimmed.split(/\s+/).pop())?.replace(/\s/g, "") ?? "";
  const label = (split ? split.join("|") : trimmed.slice(0, trimmed.length - digits.length))
    .replace(/\s+/g, " ")
    .trim();
  if (label.length < 2 || label.length > 40 || !/^\d{4,8}$/.test(digits)) return null;
  return { label, digits };
}

export async function adminBinPasteAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("tur") || "");
  const lines = String(formData.get("yigin") || "").split(/\r?\n/);
  if (!isCardType(type)) return bounce("/clayadm!nxx/bin", "e-bin-kayit");
  const drafts = lines.map(parsePasteLine).filter((row): row is { label: string; digits: string } => row !== null);
  const remote = await remoteCall("admin-bin-paste", pack(formData, ["tur", "yigin"]));
  if (remote) return bounce("/clayadm!nxx/bin", remote.code);
  const result = mutate((db) => {
    const seen = new Set(db.bins.filter((row) => row.type === type).map((row) => row.digits));
    let added = 0;
    for (const draft of drafts) {
      if (seen.has(draft.digits)) continue;
      seen.add(draft.digits);
      db.bins.push({
        id: `bin_${rid()}`,
        type,
        label: draft.label,
        digits: draft.digits,
      });
      added += 1;
    }
    return added > 0 ? ("bin" as const) : ("e-bin-kayit" as const);
  });
  return bounce("/clayadm!nxx/bin", result);
}

export async function refundAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (cents === null || cents < 1 || cents > MAX_SPEND_USD_MINOR) return bounce("/panel/kartlar", "e-tutar");
  const amount = usdMinorToKurus(cents);
  const remote = await remoteCall("refund", pack(formData, ["id", "tutar"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status !== "aktif" || card.spent <= 0) return "e-durum" as const;
    if (amount < 1 || amount > card.spent) return "e-tutar" as const;
    if (row.balance + amount > MAX_BALANCE_KURUS) return "e-tavan" as const;
    row.balance += amount;
    card.spent -= amount;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: card.id,
      kind: "iade",
      title: "İade",
      note: `${formatUsd(cents)} karşılığı ${formatTL(amount)} yazıldı.`,
      amount,
      usdMinor: cents,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    pushNotice(db, {
      userId: row.id,
      title: "İade yazıldı",
      body: `${card.label} kartına ${formatTL(amount)} iade edildi.`,
    });
    return "iade" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

export async function renewAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("renew", pack(formData, ["id"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!row || !card) return "e-yok" as const;
    if (card.status === "kapali" || card.status === "hazirlaniyor") return "e-durum" as const;
    if (card.spent <= 0) return "e-yenile" as const;
    card.spent = 0;
    card.period += 1;
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: card.id,
      kind: "yenileme",
      title: `Kullanılabilir bakiye yenilendi · ${card.label}`,
      note: "Harcama sayacı sıfırlandı. Önceki harcamalar cüzdandan geri gelmez.",
      amount: 0,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
    });
    pushNotice(db, {
      userId: row.id,
      title: "Kullanılabilir bakiye yenilendi",
      body: `${card.label} harcama sayacı sıfırlandı. Cüzdan tutarı aynı kaldı.`,
    });
    return "yenilendi" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}`, result);
}

function movable(card: Card) {
  return card.status === "aktif" || card.status === "donduruldu";
}

export async function transferAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const hedef = String(formData.get("hedef") || "");
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (hedef === "" || hedef === id) return bounce("/panel/kartlar", "e-transfer-kart");
  if (cents === null || cents < MIN_TRANSFER_USD_MINOR) return bounce("/panel/kartlar", "e-transfer");
  const amount = usdMinorToKurus(cents);
  const fee = transferFeeAt(readSettings().transferFeePercent, amount);
  const credit = amount - fee;
  if (fee < 1 || credit < 1) return bounce("/panel/kartlar", "e-transfer");
  const remote = await remoteCall("transfer", pack(formData, ["id", "hedef", "tutar"]));
  if (remote) return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}&karsi=${encodeURIComponent(hedef)}`, remote.code);
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
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: source.id,
        kind: "transfer",
        title: `${source.pan.slice(-4)} karttan ${dest.pan.slice(-4)} karta`,
        note: `${source.label} kartından ${dest.label} kartına. %${db.settings.transferFeePercent} komisyon ${feeText} kesildi. Karşı karta ${formatTL(credit)} yazıldı. Ana bakiye değişmedi.`,
        amount: -amount,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
      {
        id: `tx_${rid()}`,
        userId: row.id,
        cardId: dest.id,
        kind: "transfer",
        title: `${source.pan.slice(-4)} karttan ${dest.pan.slice(-4)} karta`,
        note: `${source.label} kartından ${dest.label} kartına geldi. %${db.settings.transferFeePercent} komisyon sonrası ${formatTL(credit)} yazıldı. Ana bakiye değişmedi.`,
        amount: credit,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
    );
    pushNotice(db, {
      userId: row.id,
      title: "Bakiye aktarıldı",
      body: `${source.label} kartından ${dest.label} kartına ${formatTL(credit)} yazıldı. Komisyon ${feeText}.`,
    });
    if (source.limit > 0 && source.spent / source.limit >= 0.5) {
      pushNotice(db, {
        userId: row.id,
        title: "Bakiye yarıda",
        body: `${source.label} kartının kullanılabilir bakiyesinin yarısı kullanıldı.`,
        ref: `tavan50:${source.id}:${source.period}`,
      });
    }
    return "transfer" as const;
  });
  return bounce(`/panel/kartlar?vurgu=${encodeURIComponent(id)}&karsi=${encodeURIComponent(hedef)}`, result);
}

export async function addressAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/clayadm!nxx");
  const address = parseAddress(String(formData.get("adres") || ""));
  if (address === null) return bounce("/panel/hesap", "e-adres");
  const remote = await remoteCall("address", pack(formData, ["adres"]));
  if (remote) return bounce("/panel/hesap", remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    row.address = address;
    pushNotice(db, {
      userId: row.id,
      title: "Adres güncellendi",
      body: address ? "Kart adresin kaydedildi." : "Kart adresi temizlendi.",
    });
    return "adres" as const;
  });
  return bounce("/panel/hesap", result);
}

export async function displayNameAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/clayadm!nxx");
  const name = parseDisplayName(String(formData.get("ad") || ""));
  if (!name) return bounce("/panel/hesap", "e-ad");
  const remote = await remoteCall("name", pack(formData, ["ad"]));
  if (remote) return bounce("/panel/hesap", remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    row.name = name;
    pushNotice(db, {
      userId: row.id,
      title: "Ad güncellendi",
      body: `Görünen adın ${name} olarak kaydedildi.`,
    });
    return "ad" as const;
  });
  return bounce("/panel/hesap", result);
}

export async function adminPasswordAction(formData: FormData) {
  const user = await requireAdmin();
  const current = String(formData.get("eski") || "");
  const next = String(formData.get("yeni") || "");
  const again = String(formData.get("yeni2") || "");
  if (next.length < 6 || next.length > 72 || next !== again) return bounce("/clayadm!nxx/hesap", "e-parola");
  const remote = await remoteCall("admin-password", pack(formData, ["eski", "yeni", "yeni2"]));
  if (remote) return bounce("/clayadm!nxx/hesap", remote.code);
  const known = findUserById(user.id);
  if (!known || known.role !== "yonetici" || !(await passwordOk(known, current))) return bounce("/clayadm!nxx/hesap", known ? "e-parola-eski" : "e-yok");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "yonetici");
    if (!row) return "e-yok" as const;
    row.password = next;
    return "parola-admin" as const;
  });
  return bounce("/clayadm!nxx/hesap", result);
}

function telegramName(raw: string): string | null {
  const value = raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?t\.me\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)) return null;
  return value;
}

export async function adminTelegramAction(formData: FormData) {
  await requireAdmin();
  const wipe = String(formData.get("sil") || "") === "1";
  const raw = String(formData.get("telegram") || "");
  const back = "/clayadm!nxx/telegram";
  if (wipe || raw.trim() === "") {
    const remote = await remoteCall("admin-telegram", pack(formData, ["sil", "telegram"]));
    if (remote) return bounce(back, remote.code || "telegram");
    mutate((db) => {
      db.settings.telegram = "";
    });
    return bounce(back, "telegram");
  }
  const name = telegramName(raw);
  if (!name) return bounce(back, "e-telegram");
  const remote = await remoteCall("admin-telegram", pack(formData, ["sil", "telegram"]));
  if (remote) return bounce(back, remote.code || "telegram");
  mutate((db) => {
    db.settings.telegram = name;
  });
  return bounce(back, "telegram");
}

export async function adminFeesAction(formData: FormData) {
  await requireAdmin();
  const issue = Number(String(formData.get("bedel") || "").replace(",", "."));
  const load = Number(String(formData.get("yukleme") || "").replace(",", "."));
  const transfer = Number(String(formData.get("aktarim") || "").replace(",", "."));
  const back = "/clayadm!nxx/ucretler";
  if (!Number.isFinite(issue) || issue < 0 || issue > 100_000) return bounce(back, "e-ayar");
  if (!Number.isFinite(load) || load < 0 || load > 40) return bounce(back, "e-ayar");
  if (!Number.isFinite(transfer) || transfer < 0 || transfer > 40) return bounce(back, "e-ayar");
  const remote = await remoteCall("admin-fees", pack(formData, ["bedel", "yukleme", "aktarim"]));
  if (remote) return bounce(back, remote.code || "ucret");
  mutate((db) => {
    db.settings.issueFeeKurus = Math.round(issue * 100);
    db.settings.loadFeePercent = Math.round(load * 10) / 10;
    db.settings.transferFeePercent = Math.round(transfer * 10) / 10;
  });
  return bounce(back, "ucret");
}

export async function adminPlanSaveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("plan") || "");
  const name = String(formData.get("ad") || "").replace(/\s+/g, " ").trim();
  const price = Number(String(formData.get("fiyat") || "").replace(",", "."));
  const limit = Number(String(formData.get("adet") || ""));
  const blurb = String(formData.get("yazi") || "").replace(/\s+/g, " ").trim();
  const back = "/clayadm!nxx/planlar";
  if (!isPlan(id)) return bounce(back, "e-plan");
  if (name.length < 2 || name.length > 40) return bounce(back, "e-ayar");
  if (!Number.isFinite(price) || price < 0 || price > 100_000) return bounce(back, "e-ayar");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return bounce(back, "e-ayar");
  if (blurb.length < 2 || blurb.length > 180) return bounce(back, "e-ayar");
  const remote = await remoteCall("admin-plan", pack(formData, ["plan", "ad", "fiyat", "adet", "yazi"]));
  if (remote) return bounce(back, remote.code || "planlar");
  mutate((db) => {
    db.settings.plans[id] = {
      name,
      priceUsdMinor: Math.round(price * 100),
      cardLimit: limit,
      blurb,
    };
  });
  return bounce(back, "planlar");
}

export async function passwordChangeAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/clayadm!nxx");
  const current = String(formData.get("eski") || "");
  const next = String(formData.get("yeni") || "");
  const again = String(formData.get("yeni2") || "");
  if (next.length < 6 || next.length > 72 || next !== again) return bounce("/panel/hesap", "e-parola");
  const remote = await remoteCall("password", pack(formData, ["eski", "yeni", "yeni2"]));
  if (remote) return bounce("/panel/hesap", remote.code);
  const known = findUserById(user.id);
  if (!known || known.role !== "uye") return bounce("/panel/hesap", "e-yok");
  if (!(await passwordOk(known, current))) return bounce("/panel/hesap", "e-parola-eski");
  const nextSalt = known.passHash ? randomSalt() : "";
  const nextHash = nextSalt ? await digestSecret(next, nextSalt) : "";
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id && item.role === "uye");
    if (!row) return "e-yok" as const;
    if (nextHash) {
      row.passSalt = nextSalt;
      row.passHash = nextHash;
      row.password = "";
    } else {
      row.password = next;
    }
    pushNotice(db, {
      userId: row.id,
      title: "Parola güncellendi",
      body: nextHash ? "Yeni parolan kaydedildi. Düz metin olarak durmaz." : "Yeni parolan yönetim masasında görünür.",
    });
    return "parola" as const;
  });
  return bounce("/panel/hesap", result);
}

export async function markNoticeReadAction(formData: FormData) {
  const user = await actor();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("notice-read", pack(formData, ["id"]));
  if (remote) return bounce("/panel/bildirimler", remote.code || "okundu");
  mutate((db) => {
    const note = db.notices.find((item) => item.id === id && item.userId === user.id);
    if (note && !note.readAt) note.readAt = new Date().toISOString();
  });
  return bounce("/panel/bildirimler", "okundu");
}

export async function markAllNoticesReadAction() {
  const user = await actor();
  const remote = await remoteCall("notice-read-all", {});
  if (remote) return bounce("/panel/bildirimler", remote.code || "okundu");
  const now = new Date().toISOString();
  mutate((db) => {
    for (const note of db.notices) {
      if (note.userId === user.id && !note.readAt) note.readAt = now;
    }
  });
  return bounce("/panel/bildirimler", "okundu");
}

export async function adminEditTopupAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const iso = istanbulInputToIso(String(formData.get("zaman") || ""));
  const back = safeAdminReturn(formData, userId);
  if (!iso) return bounce(back, "e-zaman");
  const remote = await remoteCall("admin-topup", pack(formData, ["uye", "zaman", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const loads = db.transactions
      .filter((item) => item.userId === userId && item.kind === "yukleme" && item.status === "tamamlandi")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latest = loads[0];
    if (!latest) return "e-yukleme-yok" as const;
    latest.createdAt = iso;
    return "zaman" as const;
  });
  return bounce(back, result);
}

function memberBack(formData: FormData, userId: string) {
  return safeAdminReturn(formData, userId);
}

export async function adminIssueAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const back = memberBack(formData, userId);
  const typeRaw = String(formData.get("tur") || "");
  const label = String(formData.get("etiket") || "").replace(/\s+/g, " ").trim();
  if (!isCardType(typeRaw)) return bounce(back, "e-tur");
  if (label.length < 2 || label.length > 32) return bounce(back, "e-etiket");
  const remote = await remoteCall("admin-issue", pack(formData, ["uye", "tur", "etiket", "bin", "donus"]));
  if (remote) {
    if (remote.code !== "basildi" || !remote.id) return bounce(back, remote.code);
    const join = back.includes("?") ? "&" : "?";
    return bounce(`${back}${join}vurgu=${encodeURIComponent(remote.id)}`, remote.code);
  }
  const binId = String(formData.get("bin") || "");
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === userId && item.role === "uye");
    const chosen = db.bins.find((item) => item.id === binId && item.type === typeRaw);
    if (!row || !chosen) return { code: row ? ("e-bin" as const) : ("e-yok" as const), id: "" };
    const fee = db.settings.issueFeeKurus;
    if (row.balance < fee) return { code: "e-bakiye" as const, id: "" };
    if (openCardCount(db, row.id) >= db.settings.plans[row.plan].cardLimit) return { code: "e-plan" as const, id: "" };
    const card = issueCard(db, { userId: row.id, type: typeRaw, label, limit: 0, fee, bin: chosen.digits, binLabel: chosen.label });
    pushNotice(db, { userId: row.id, title: "Kart hazırlanıyor", body: `${label} yönetim masasından basıldı. Kullanılabilir bakiye 0. Basım ücreti ${formatTL(fee)}.` });
    return { code: "basildi" as const, id: card.id };
  });
  if (result.code !== "basildi") return bounce(back, result.code);
  const join = back.includes("?") ? "&" : "?";
  return bounce(`${back}${join}vurgu=${encodeURIComponent(result.id)}`, "basildi");
}

export async function adminCloseCardAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const id = String(formData.get("id") || "");
  const back = memberBack(formData, userId);
  if (String(formData.get("onay") || "") !== "on") return bounce(back, "e-onay");
  const remote = await remoteCall("admin-close", pack(formData, ["id", "onay", "uye", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id);
    const row = card ? db.users.find((item) => item.id === card.userId) : undefined;
    if (!card || !row) return "e-yok" as const;
    if (card.status === "kapali" || card.status === "hazirlaniyor") return "e-durum" as const;
    const refund = refundIssueFee(db, row, card);
    if (refund === "tavan") return "e-tavan" as const;
    card.status = "kapali";
    card.readyAt = null;
    pushNotice(db, { userId: row.id, title: "Kart kapatıldı", body: `${card.label} yönetim masasında kapatıldı. Basım ücreti bakiyeye geri yazıldı.` });
    return "kapatildi" as const;
  });
  return bounce(back, result);
}

export async function adminPurgeCardAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const id = String(formData.get("id") || "");
  const back = memberBack(formData, userId);
  if (String(formData.get("onay") || "") !== "on") return bounce(back, "e-onay");
  const remote = await remoteCall("admin-purge", pack(formData, ["id", "onay", "uye", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id);
    if (!card) return "e-yok" as const;
    if (card.status !== "kapali") return "e-durum" as const;
    const label = card.label;
    const owner = card.userId;
    db.cards = db.cards.filter((item) => item.id !== id);
    db.orders = db.orders.filter((item) => item.cardId !== id);
    pushNotice(db, { userId: owner, title: "Kart silindi", body: `${label} yönetim masasında kalıcı olarak silindi. Cüzdan hareketi duruyor.` });
    return "silindi" as const;
  });
  return bounce(back, result);
}

export async function adminTransferAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("uye") || "");
  const id = String(formData.get("id") || "");
  const hedef = String(formData.get("hedef") || "");
  const back = memberBack(formData, userId);
  const cents = parseTryToKurus(String(formData.get("tutar") || ""));
  if (hedef === "" || hedef === id) return bounce(back, "e-transfer-kart");
  if (cents === null || cents < MIN_TRANSFER_USD_MINOR) return bounce(back, "e-transfer");
  const amount = usdMinorToKurus(cents);
  const fee = transferFeeAt(readSettings().transferFeePercent, amount);
  const credit = amount - fee;
  if (fee < 1 || credit < 1) return bounce(back, "e-transfer");
  const remote = await remoteCall("admin-transfer", pack(formData, ["uye", "id", "hedef", "tutar", "donus"]));
  if (remote) return bounce(back, remote.code);
  const result = mutate((db) => {
    const source = db.cards.find((item) => item.id === id && item.userId === userId);
    const dest = db.cards.find((item) => item.id === hedef && item.userId === userId);
    if (!source || !dest) return "e-yok" as const;
    const movable = (card: Card) => card.status === "aktif" || card.status === "donduruldu";
    if (!movable(source) || !movable(dest)) return "e-durum" as const;
    if (amount > source.limit - source.spent) return "e-transfer" as const;
    if (dest.limit + credit > MAX_LIMIT_KURUS) return "e-transfer-tavan" as const;
    source.limit -= amount;
    dest.limit += credit;
    const now = new Date().toISOString();
    const route = `${source.pan.slice(-4)} karttan ${dest.pan.slice(-4)} karta`;
    db.transactions.push(
      {
        id: `tx_${rid()}`,
        userId,
        cardId: source.id,
        kind: "transfer",
        title: route,
        note: `Yönetici aktardı. ${source.label} kartından ${dest.label} kartına. Komisyon ${formatTL(fee)}.`,
        amount: -amount,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
      {
        id: `tx_${rid()}`,
        userId,
        cardId: dest.id,
        kind: "transfer",
        title: route,
        note: `Yönetici aktardı. Karşı karta ${formatTL(credit)} yazıldı. Ana bakiye değişmedi.`,
        amount: credit,
        usdMinor: null,
        status: "tamamlandi",
        createdAt: now,
      },
    );
    pushNotice(db, { userId, title: "Bakiye aktarıldı", body: `${source.label} kartından ${dest.label} kartına ${formatTL(credit)} yazıldı.` });
    return "transfer" as const;
  });
  return bounce(back, result);
}

export async function adminTicketCloseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const remote = await remoteCall("admin-ticket-close", pack(formData, ["id"]));
  if (remote) return bounce("/clayadm!nxx/destek", remote.code);
  const result = mutate((db) => {
    const ticket = db.tickets.find((item) => item.id === id);
    if (!ticket) return "e-yok" as const;
    ticket.status = "kapandi";
    pushNotice(db, { userId: ticket.userId, title: "Talep kapatıldı", body: `${ticket.subject} kapatıldı.` });
    return "talep-kapandi" as const;
  });
  return bounce("/clayadm!nxx/destek", result);
}

export async function adminNoticeSaveAction(formData: FormData) {
  await requireAdmin();
  const remote = await remoteCall("admin-notice-save", pack(formData, ["batch", "baslik", "mesaj"]));
  if (remote) return bounce("/clayadm!nxx/bildirimler", remote.code);
  const batch = String(formData.get("batch") || "");
  const title = String(formData.get("baslik") || "").trim();
  const body = String(formData.get("mesaj") || "").trim();
  if (title.length < 2 || title.length > 80 || body.length < 2 || body.length > 400) return bounce("/clayadm!nxx/bildirimler", "e-mesaj");
  const result = mutate((db) => {
    const rows = db.notices.filter((item) => item.batch === batch);
    if (rows.length === 0) return "e-yok" as const;
    if (rows.some((item) => item.ref)) return "e-durum" as const;
    for (const row of rows) {
      row.title = title;
      row.body = body;
    }
    return "gonderildi" as const;
  });
  return bounce("/clayadm!nxx/bildirimler", result);
}

export async function adminNoticeRemoveAction(formData: FormData) {
  await requireAdmin();
  const remote = await remoteCall("admin-notice-remove", pack(formData, ["batch"]));
  if (remote) return bounce("/clayadm!nxx/bildirimler", remote.code);
  const batch = String(formData.get("batch") || "");
  const result = mutate((db) => {
    const rows = db.notices.filter((item) => item.batch === batch);
    if (rows.length === 0) return "e-yok" as const;
    if (rows.some((item) => item.ref)) return "e-durum" as const;
    db.notices = db.notices.filter((item) => item.batch !== batch);
    return "bildirim-sil" as const;
  });
  return bounce("/clayadm!nxx/bildirimler", result);
}

export async function adminAnnounceAction(formData: FormData) {
  await requireAdmin();
  const remote = await remoteCall("admin-announce", pack(formData, ["baslik", "mesaj", "yayin"]));
  if (remote) return bounce("/clayadm!nxx/bildirimler", remote.code);
  const title = String(formData.get("baslik") || "").replace(/\s+/g, " ").trim();
  const body = String(formData.get("mesaj") || "").replace(/\s+/g, " ").trim();
  const on = String(formData.get("yayin") || "") === "on";
  if (on && (title.length < 2 || title.length > 80)) return bounce("/clayadm!nxx/bildirimler", "e-mesaj");
  if (title.length > 80 || body.length > 240) return bounce("/clayadm!nxx/bildirimler", "e-mesaj");
  const result = mutate((db) => {
    db.settings.announcement = { title, body, on: on && title !== "" };
    return db.settings.announcement.on ? ("duyuru" as const) : ("duyuru-sil" as const);
  });
  return bounce("/clayadm!nxx/bildirimler", result);
}

export async function adminCopyAction(formData: FormData) {
  await requireAdmin();
  const next: Record<string, string> = {};
  for (const key of COPY_KEYS) {
    const value = String(formData.get(key) || "").replace(/\s+/g, " ").trim();
    if (value.length > COPY[key].max) return bounce("/clayadm!nxx/metinler", "e-mesaj");
    next[key] = value;
  }
  const remote = await remoteCall("admin-copy", pack(formData, COPY_KEYS));
  if (remote) return bounce("/clayadm!nxx/metinler", remote.code);
  const result = mutate((db) => {
    if (!db.settings.copy) db.settings.copy = {};
    for (const key of COPY_KEYS) {
      if (!next[key]) delete db.settings.copy[key];
      else db.settings.copy[key] = next[key];
    }
    return "metin" as const;
  });
  return bounce("/clayadm!nxx/metinler", result);
}

export async function starAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/panel/kartlar");
  const remote = await remoteCall("yildiz", pack(formData, ["id"]));
  if (remote) return bounce("/panel/kartlar", remote.code);
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    if (!card) return "e-yok" as const;
    card.starred = !card.starred;
    return "yildiz" as const;
  });
  return bounce("/panel/kartlar", result);
}

export async function withdrawAction(formData: FormData) {
  const user = await actor();
  if (user.role !== "uye") return go("/panel/yukle");
  const amount = parseTryToKurus(String(formData.get("tutar") || ""));
  const wallet = String(formData.get("cuzdan") || "").trim();
  const coin = payoutCoin(String(formData.get("coin") || ""));
  const floor = usdMinorToKurus(1000);
  if (amount === null || amount < floor) return bounce("/panel/yukle", "e-tutar");
  if (!coin) return bounce("/panel/yukle", "e-coin");
  if (!/^[A-Za-z0-9:._@-]{8,106}$/.test(wallet)) return bounce("/panel/yukle", "e-cuzdan");
  const remote = await remoteCall("cek", pack(formData, ["tutar", "cuzdan", "coin"]));
  if (remote) return bounce("/panel/yukle", remote.code);
  const result = mutate((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (!row || row.balance < amount) return "e-bakiye" as const;
    let usd = Math.round(amount / fxRate());
    if (usd < 1) usd = 1;
    if (row.usdMinor >= usd) row.usdMinor -= usd;
    else usd = 0;
    row.balance -= amount;
    const id = `pay_${rid()}`;
    const mask = `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
    db.payouts.push({
      id,
      userId: row.id,
      amount,
      usdMinor: usd,
      wallet,
      coin,
      status: "bekliyor",
      createdAt: new Date().toISOString(),
      settledAt: null,
    });
    db.transactions.push({
      id: `tx_${rid()}`,
      userId: row.id,
      cardId: null,
      kind: "transfer",
      title: "Çekim talebi",
      note: payoutNote("bekliyor", mask, coin),
      amount: -amount,
      usdMinor: usd > 0 ? -usd : null,
      status: "tamamlandi",
      createdAt: new Date().toISOString(),
      ref: id,
    });
    pushNotice(db, { userId: row.id, title: "Çekim talebi alındı", body: `${formatTL(amount)} beklemeye alındı.` });
    return "cekim" as const;
  });
  return bounce("/panel/yukle", result);
}

export async function settlePayoutAction(formData: FormData) {
  await requireAdmin();
  const decision = String(formData.get("karar") || "");
  if (decision !== "gitti" && decision !== "iptal") return bounce("/clayadm!nxx/canli", "e-durum");
  const remote = await remoteCall("admin-cek", pack(formData, ["id", "karar"]));
  if (remote) return bounce("/clayadm!nxx/canli", remote.code);
  if (decision === "gitti") return bounce("/clayadm!nxx/canli", "e-cek-anahtar");
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const row = db.payouts.find((item) => item.id === id && item.status === "bekliyor");
    const owner = row ? db.users.find((item) => item.id === row.userId) : undefined;
    if (!row || !owner) return "e-yok" as const;
    const held = db.transactions.find((entry) => entry.ref === id);
    const mask = row.wallet.length >= 8 ? `${row.wallet.slice(0, 4)}…${row.wallet.slice(-4)}` : row.wallet;
    if (decision === "iptal") {
      if (owner.balance + row.amount > MAX_BALANCE_KURUS) return "e-tavan" as const;
      owner.balance += row.amount;
      owner.usdMinor += row.usdMinor;
      if (held) {
        held.amount = -Math.abs(row.amount);
        held.title = "Çekim talebi";
        held.note = payoutNote("iptal", mask, row.coin);
        held.usdMinor = row.usdMinor > 0 ? -row.usdMinor : null;
      }
      const refundRef = `${id}:iptal`;
      if (!db.transactions.some((entry) => entry.ref === refundRef)) {
        db.transactions.push({
          id: `tx_${rid()}`,
          userId: row.userId,
          cardId: null,
          kind: "duzeltme",
          title: "Çekim iadesi",
          note: "İptal. Tutar cüzdana döndü.",
          amount: Math.abs(row.amount),
          usdMinor: row.usdMinor > 0 ? row.usdMinor : null,
          status: "tamamlandi",
          createdAt: new Date().toISOString(),
          ref: refundRef,
        });
      }
      row.status = "iptal";
      pushNotice(db, { userId: row.userId, title: "Çekim iptal", body: `${formatTL(row.amount)} cüzdanına geri yazıldı.` });
      row.settledAt = new Date().toISOString();
      return "cekim-iptal" as const;
    }
    return "e-cek-anahtar" as const;
  });
  return bounce("/clayadm!nxx/canli", result);
}

function deskBack(formData: FormData, fallback: string) {
  const back = String(formData.get("donus") || "");
  return back.startsWith(ADMIN_PATH) ? back : fallback;
}

export async function clearNoticesAction() {
  const user = await actor();
  const remote = await remoteCall("notice-clear", {});
  if (remote) return bounce("/panel/bildirimler", remote.code);
  mutate((db) => {
    db.notices = db.notices.filter((note) => note.userId !== user.id);
  });
  return bounce("/panel/bildirimler", "bildirim-sil");
}

export async function purgeClosedCardsAction(formData: FormData) {
  const user = await actor();
  if (String(formData.get("onay") || "") !== "on") return bounce("/panel/kartlar", "e-onay");
  const remote = await remoteCall("purge-kapali", pack(formData, ["onay"]));
  if (remote) return bounce("/panel/kartlar", remote.code);
  const result = mutate((db) => {
    const ids = db.cards.filter((card) => card.userId === user.id && card.status === "kapali").map((card) => card.id);
    if (ids.length === 0) return "e-yok" as const;
    db.cards = db.cards.filter((card) => !ids.includes(card.id));
    db.orders = db.orders.filter((order) => !ids.includes(order.cardId));
    return "silindi" as const;
  });
  return bounce("/panel/kartlar", result);
}

export async function clearCancelledOrderAction(formData: FormData) {
  const user = await actor();
  if (String(formData.get("onay") || "") !== "on") return bounce("/panel/siparisler", "e-onay");
  const remote = await remoteCall("order-clear", pack(formData, ["id", "onay"]));
  if (remote) return bounce("/panel/siparisler", remote.code);
  const id = String(formData.get("id") || "");
  const result = mutate((db) => {
    const card = db.cards.find((item) => item.id === id && item.userId === user.id);
    const order = db.orders.find((item) => item.cardId === id && item.userId === user.id);
    if (!card || card.status !== "kapali" || !order || order.status !== "iptal") return "e-durum" as const;
    db.cards = db.cards.filter((item) => item.id !== id);
    db.orders = db.orders.filter((item) => item.cardId !== id);
    return "silindi" as const;
  });
  return bounce("/panel/siparisler", result);
}

async function desk(action: string, formData: FormData, names: string[], fallback: string) {
  await requireAdmin();
  const remote = await remoteCall(action, pack(formData, names));
  return bounce(deskBack(formData, fallback), remote?.code || "e-defter");
}

export async function adminCloseAccountAction(formData: FormData) {
  return desk("admin-kapat", formData, ["uye", "mod", "onay", "donus"], `${ADMIN_PATH}/uyeler`);
}

export async function adminBulkSuspendAction(formData: FormData) {
  return desk("admin-toplu-aski", formData, ["idler", "donus"], `${ADMIN_PATH}/uyeler`);
}

export async function adminMemberPasswordAction(
  _prev: { error: string; once: string },
  formData: FormData,
): Promise<{ error: string; once: string }> {
  await requireAdmin();
  const remote = await remoteCall("admin-uye-sifre", pack(formData, ["uye", "parola", "parola2"]));
  if (!remote) return { error: "Defter yazılamadı.", once: "" };
  if (remote.code === "sifre-yaz") return { error: "", once: remote.once || "" };
  return { error: noticeText(remote.code) || "Parola yazılamadı.", once: "" };
}

export async function adminAssignPlanAction(formData: FormData) {
  return desk("admin-uye-plan", formData, ["uye", "plan", "donus"], `${ADMIN_PATH}/uyeler`);
}

export async function adminMemberProfileAction(formData: FormData) {
  return desk("admin-uye-profil", formData, ["uye", "ad", "adres", "soru", "cevap", "donus"], `${ADMIN_PATH}/uyeler`);
}

export async function adminCloseMemberCardsAction(formData: FormData) {
  return desk("admin-kartlari-kapat", formData, ["uye", "onay", "donus"], `${ADMIN_PATH}/uyeler`);
}

export async function adminBulkCardsAction(formData: FormData) {
  return desk("admin-kart-toplu", formData, ["mod", "idler", "onay", "donus"], `${ADMIN_PATH}/kartlar`);
}

export async function adminCancelOrderAction(formData: FormData) {
  return desk("admin-siparis-iptal", formData, ["id", "donus"], `${ADMIN_PATH}/islemler`);
}

export async function adminDeleteOrderAction(formData: FormData) {
  return desk("admin-siparis-sil", formData, ["id", "onay", "donus"], `${ADMIN_PATH}/islemler`);
}

export async function adminDeleteTxAction(formData: FormData) {
  return desk("admin-tx-sil", formData, ["islem", "onay", "donus"], `${ADMIN_PATH}/islemler`);
}

export async function adminClearTxAction(formData: FormData) {
  return desk("admin-tx-temizle", formData, ["onay", "donus"], `${ADMIN_PATH}/islemler`);
}

export async function adminDeleteTicketAction(formData: FormData) {
  return desk("admin-ticket-sil", formData, ["id", "donus"], `${ADMIN_PATH}/destek`);
}

export async function adminClearTicketsAction(formData: FormData) {
  return desk("admin-ticket-temizle", formData, ["donus"], `${ADMIN_PATH}/destek`);
}

export async function adminDeleteNoticeAction(formData: FormData) {
  return desk("admin-notice-sil", formData, ["id", "donus"], `${ADMIN_PATH}/bildirimler`);
}

export async function adminClearMemberNoticesAction(formData: FormData) {
  return desk("admin-notice-temizle", formData, ["uye", "donus"], `${ADMIN_PATH}/bildirimler`);
}

export async function hidePayoutAction(formData: FormData) {
  return desk("admin-cek-gizle", formData, ["id", "donus"], `${ADMIN_PATH}/canli`);
}

export async function adminResetAction(formData: FormData) {
  return desk("admin-sifirla", formData, ["alan", "donus"], `${ADMIN_PATH}/planlar`);
}

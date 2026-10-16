import type { CardTypeId, PlanId, SiteSettings, TxKind } from "./types";

export const TEST_BIN = "400000";
/** How long a new card stays on the order slip before it becomes active. */
export const CARD_PREP_MS = 15_000;
/**
 * Fixed selling rate, 15 Eki 2026. Not a live feed.
 * One US dollar converts to this many lira. Amounts are entered in dollars.
 * The screen shows only that conversion.
 */
export const USD_SELL_RATE = 49.3929;
export const USD_RATE_AS_OF = "15 Eki 2026";
export const WELCOME_USD_MINOR = 3_000;
export const MIN_USD_MINOR = 100;
export const MAX_USD_MINOR = 500_000;
export const MAX_BALANCE_USD_MINOR = 2_000_000;
export const MIN_SPEND_USD_MINOR = 100;
export const MAX_SPEND_USD_MINOR = 200_000;
export const MIN_LIMIT_USD_MINOR = 1_000;
export const MAX_LIMIT_USD_MINOR = 1_000_000;
export const MIN_TRANSFER_USD_MINOR = 100;
export const TRANSFER_FEE_PERCENT = 4;
/** Card price, exactly 300₺. Not converted from dollars. */
export const ISSUE_FEE_KURUS = 30_000;
/** Cut when money moves from the main balance onto a card. */
export const LOAD_FEE_PERCENT = 7.3;

export function loadFeeAt(percent: number, amount: number): number {
  return Math.round((amount * Math.round(percent * 100)) / 10_000);
}

export function transferFeeAt(percent: number, amount: number): number {
  return Math.round((amount * percent) / 100);
}

export function transferFee(amount: number): number {
  return transferFeeAt(TRANSFER_FEE_PERCENT, amount);
}

/** Largest dollar entry that still fits the card ceiling after the transfer cut. */
export function allTransferInput(kalanKurus: number, percent: number): string {
  let cents = kurusToUsdMinor(kalanKurus);
  let guard = 0;
  while (cents >= MIN_TRANSFER_USD_MINOR && guard < 40) {
    guard += 1;
    const amount = usdMinorToKurus(cents);
    const fee = transferFeeAt(percent, amount);
    if (amount <= kalanKurus && fee >= 1 && amount - fee >= 1) {
      const whole = Math.floor(cents / 100);
      const frac = String(cents % 100).padStart(2, "0");
      return `${whole},${frac}`;
    }
    cents -= 1;
  }
  return "";
}

export function loadFee(amount: number): number {
  return loadFeeAt(LOAD_FEE_PERCENT, amount);
}

export function usdMinorToKurus(minor: number): number {
  return Math.round(minor * USD_SELL_RATE);
}

export function kurusToUsdMinor(kurus: number): number {
  return Math.round(kurus / USD_SELL_RATE);
}

export const WELCOME_BONUS_KURUS = usdMinorToKurus(WELCOME_USD_MINOR);
export const MIN_TOPUP_KURUS = usdMinorToKurus(MIN_USD_MINOR);
export const MAX_TOPUP_KURUS = usdMinorToKurus(MAX_USD_MINOR);
export const MAX_BALANCE_KURUS = usdMinorToKurus(MAX_BALANCE_USD_MINOR);
export const MIN_SPEND_KURUS = usdMinorToKurus(MIN_SPEND_USD_MINOR);
export const MAX_SPEND_KURUS = usdMinorToKurus(MAX_SPEND_USD_MINOR);
export const MIN_LIMIT_KURUS = usdMinorToKurus(MIN_LIMIT_USD_MINOR);
export const MAX_LIMIT_KURUS = usdMinorToKurus(MAX_LIMIT_USD_MINOR);
export const MIN_TRANSFER_KURUS = usdMinorToKurus(MIN_TRANSFER_USD_MINOR);
export const CARD_TYPE_ORDER: CardTypeId[] = ["facebook_ads", "tiktok", "google_ads", "ultima"];

export const CARD_TYPES: Record<
  CardTypeId,
  { name: string; pitch: string; scene: string; fee: number }
> = {
  facebook_ads: {
    name: "Facebook Ads",
    pitch: "Akış bütçesi",
    scene: "Akış bütçesi için ayrı kullanılabilir bakiye.",
    fee: ISSUE_FEE_KURUS,
  },
  tiktok: {
    name: "TikTok",
    pitch: "Kısa video bütçesi",
    scene: "Kısa video bütçesini kendi bakiyesinde tut.",
    fee: ISSUE_FEE_KURUS,
  },
  google_ads: {
    name: "Google Ads",
    pitch: "Arama bütçesi",
    scene: "Arama kampanyasının bakiyesi ayrı durur.",
    fee: ISSUE_FEE_KURUS,
  },
  ultima: {
    name: "Ultima",
    pitch: "Geniş bakiye",
    scene: "Geniş kullanılabilir bakiyeli metal kart.",
    fee: ISSUE_FEE_KURUS,
  },
};

export function isPlan(value: string): value is PlanId {
  return value === "kivilcim" || value === "atolye" || value === "galeri";
}

export function isCardType(value: string): value is CardTypeId {
  return CARD_TYPE_ORDER.includes(value as CardTypeId);
}

export const PLANS: Record<
  PlanId,
  { name: string; metal: "bronze" | "silver" | "gold"; priceUsdMinor: number; period: string; cardLimit: number; blurb: string }
> = {
  kivilcim: {
    name: "Clay Bronze",
    metal: "bronze",
    priceUsdMinor: 1_000,
    period: "ay",
    cardLimit: 2,
    blurb: "En fazla 2 kart. Her kart 300₺. İkisinden fazlası için plan yükselir.",
  },
  atolye: {
    name: "Clay Silver",
    metal: "silver",
    priceUsdMinor: 2_500,
    period: "ay",
    cardLimit: 8,
    blurb: "En fazla 8 kart. Her kart 300₺. Bronze dolunca buraya geçilir.",
  },
  galeri: {
    name: "Clay Gold",
    metal: "gold",
    priceUsdMinor: 5_000,
    period: "ay",
    cardLimit: 25,
    blurb: "En fazla 25 kart. Her kart 300₺. Bu sayının üstü açılmaz.",
  },
};

export function defaultSettings(): SiteSettings {
  const plan = (id: PlanId) => ({
    name: PLANS[id].name,
    priceUsdMinor: PLANS[id].priceUsdMinor,
    cardLimit: PLANS[id].cardLimit,
    blurb: PLANS[id].blurb,
  });
  return {
    issueFeeKurus: ISSUE_FEE_KURUS,
    loadFeePercent: LOAD_FEE_PERCENT,
    transferFeePercent: TRANSFER_FEE_PERCENT,
    plans: {
      kivilcim: plan("kivilcim"),
      atolye: plan("atolye"),
      galeri: plan("galeri"),
    },
    telegram: "",
    announcement: { title: "", body: "", on: false },
    copy: {},
  };
}

export const MERCHANTS_BY_TYPE: Record<CardTypeId, readonly string[]> = {
  facebook_ads: ["Vitrin Akış", "Mavi Sayfa", "Sahne Reklam"],
  tiktok: ["Kısa Sahne", "Nota Akış", "Gece Klip"],
  google_ads: ["Arama Vitrini", "Kelime Tezgahı", "Harita Vitrin"],
  ultima: ["Ultima Salon", "Metal Gece", "Kule Rezerv"],
};

export function merchantsFor(type: CardTypeId): readonly string[] {
  return MERCHANTS_BY_TYPE[type];
}

export function isMerchantForType(type: CardTypeId, value: string): boolean {
  return MERCHANTS_BY_TYPE[type].includes(value);
}

export const SECURITY_QUESTIONS = [
  { id: "hayvan", label: "İlk evcil hayvanının adı neydi?" },
  { id: "okul", label: "İlk okulunun adı nedir?" },
  { id: "sehir", label: "Doğduğun şehir neresi?" },
  { id: "anne", label: "Annenin kızlık soyadı nedir?" },
] as const;

export function securityQuestionLabel(id: string): string {
  return SECURITY_QUESTIONS.find((item) => item.id === id)?.label ?? "";
}

export const KIND_LABEL: Record<TxKind, string> = {
  yukleme: "Yükleme",
  harcama: "Harcama",
  iade: "İade",
  basim: "Basım",
  duzeltme: "Düzeltme",
  yenileme: "Bakiye yenileme",
  transfer: "Aktarım",
};

export const NOTICES: Record<string, string> = {
  hosgeldin: "Hoş geldin bakiyesi yazıldı. Tutar, doların sabit kur karşılığıdır.",
  yuklendi: "Bakiyeniz yüklendi.",
  "e-heleket": "Heleket ödeme sayfası açılmadı.",
  "e-anahtar": "Heleket anahtarı sunucuda boş. heleket.config.php doldurulmalı.",
  "e-odeme": "Heleket ödemesi henüz tamamlanmadı.",
  basildi: "Kart oluşturuldu.",
  siparis: "Kart oluşturuldu. Kullanılabilir bakiye 0 ile başlar. Hesaptan yalnız basım ücreti düştü.",
  hazir: "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.",
  yenilendi: "Kullanılabilir bakiye yenilendi. Harcama sayacı sıfırlandı. Cüzdan tutarı değişmedi.",
  transfer: "Kullanılabilir bakiye aktarıldı. Karşı karta %4 komisyon kesildi. Ana bakiye değişmedi.",
  yuklendi_kart: "Hesaptan karta yükleme yazıldı. %7,3 komisyon kesildi. Ana bakiyeye bu kesinti uygulanmaz.",
  iade: "İade cüzdana ve kullanılabilir bakiyeye işlendi.",
  ad: "Görünen ad güncellendi.",
  adres: "Kart adresi güncellendi. Yalnızca bu hesabın kart detaylarında görünür.",
  donduruldu: "Kart donduruldu. Harcama kapalı. Bildirim kutuna da yazıldı.",
  cozuldu: "Kart aktif edildi ve açık bölüme alındı. Kart bedeli bakiyeden düştü.",
  "kart-acildi": "Kapanmış kart yeniden açıldı. Kart bedeli bakiyeden düştü.",
  kapatildi: "Kart kapanmış bölüme alındı. Basım ücreti bakiyeye geri yazıldı. Yeniden açmak kart bedeli kadar tutar.",
  silindi: "Kart kalıcı olarak silindi. Cüzdandaki hareket duruyor.",
  iptal: "Sipariş iptal edildi. Basım ücreti bakiyeye geri yazıldı.",
  cekim: "Çekim talebi alındı. Tutar beklemeye yazıldı.",
  "cekim-gitti": "Çekim gönderildi.",
  "cekim-iptal": "Çekim iptal edildi. Tutar cüzdana döndü.",
  yildiz: "Kart yıldızı güncellendi.",
  "e-cuzdan": "Cüzdan adresi 8–80 karakter olmalı. Boşluk kullanma.",
  dolar: "Bakiye yazıldı. Ekranda doların sabit kur karşılığı durur.",
  cevrildi: "Bakiye, doların sabit kur karşılığı olarak duruyor.",
  plan: "Plan güncellendi. Plan ücreti bakiyeden düştü.",
  "plan-ayni": "Plan aynı kaldı. Ücret alınmadı.",
  harcama: "Harcama ana bakiyeye ve kullanılabilir bakiyeye işlendi.",
  reddedildi: "Harcama reddedildi. Kayıt işlem listesinde.",
  "e-tutar": "Tutar izin verilen aralığın dışında.",
  "e-tavan": "Bakiye üst sınıra ulaştı.",
  "e-bakiye": "Bakiye bu işlem için yetersiz.",
  "e-defter": "Defter yazılamadı. Sayfayı yenile.",
  "e-limit": "Kullanılabilir bakiye 10 ile 10.000 USD arasında olmalı.",
  "e-etiket": "Kart adı 2–32 karakter olmalı.",
  "e-tur": "Kart türü seç.",
  "e-plan": "Bu plandaki kart hakkı doldu. Daha fazla kart için planı yükselt.",
  "e-plan-dolu": "Açık kart adedi bu plana sığmıyor. Önce bir kart kapat ya da daha yüksek plana geç.",
  "e-durum": "Kart bu işlem için uygun durumda değil.",
  "e-onay": "Kapatmak için onay kutusu gerekli.",
  "e-yok": "Kayıt bulunamadı.",
  "e-isletme": "Bu kart türünün listesinden bir işletme seç.",
  bakiye: "Bakiye güncellendi.",
  askida: "Hesap askıya alındı. Bu kullanıcı giriş yapamaz.",
  acildi: "Hesap yeniden açıldı.",
  "e-askida": "Bu hesap askıya alındı. Giriş kapalı.",
  "e-kendin": "Yönetici kendi hesabını askıya alamaz.",
  "e-yonetici": "Yönetici hesabı bu işlem için kapalı.",
  gonderildi: "Bildirim üye paneline yazıldı.",
  talep: "Talebin alındı. Yönetim masasına düştü. Yanıt zilde görünür.",
  yanit: "Yanıt üyeye yazıldı. Zilde de görünür.",
  "e-talep": "Konu 2–80, şikayet 4–800 karakter olmalı.",
  "e-yanit": "Yanıt 2–400 karakter olmalı.",
  kart: "Kart kaydı güncellendi.",
  islem: "İşlem tutarı güncellendi.",
  zaman: "Son yükleme zamanı güncellendi.",
  "e-mesaj": "Başlık 2–80, mesaj 2–400 karakter olmalı.",
  "e-hedef": "Bir üye seç veya tüm üyeleri işaretle.",
  "e-zaman": "Zaman İstanbul saatiyle seçilmeli.",
  "e-yukleme-yok": "Bu hesapta düzenlenecek bir yükleme yok.",
  bin: "BIN satırı bu türün listesine yazıldı.",
  "e-hesap": "Ödemenin düşeceği hesabı seç.",
  "e-bin": "Kart oluşturmak için bu türe ait bir BIN seç. Liste boşsa basım kapalı.",
  "e-bin-kayit": "Etiket 2–40 karakter, BIN ise 4–8 rakam olmalı. Aynı türde aynı rakam iki kez durmaz.",
  parola: "Parola güncellendi. Yönetim masasında yeni parola görünür.",
  "parola-admin": "Yönetici parolası güncellendi.",
  ucret: "Ücretler kaydedildi. Yeni kart, yükleme ve aktarım bu oranları kullanır.",
  planlar: "Planlar kaydedildi. Kart hakkı ve fiyat bu kayda göre durur.",
  telegram: "Telegram kaydı güncellendi. Sağ alttaki düğme bu hesaba gider.",
  "e-telegram": "Telegram adı 5–32 karakter olmalı ve bir harfle başlamalı.",
  "e-ayar": "Bu ayar izin verilen aralığın dışında.",
  "e-parola": "Parola 6–72 karakter olmalı ve iki kutu aynı olmalı.",
  "e-soru": "Güvenlik sorusunu listeden seç.",
  "e-cevap": "Güvenlik yanıtı en az 2 karakter olmalı.",
  "e-eslesmedi": "Kullanıcı adı, soru veya yanıt hatalı.",
  "e-sorusuz": "Bu hesapta güvenlik sorusu yok. Giriş yapıp Hesap sayfasından kaydet.",
  sifre: "Yeni parolan kaydedildi. Bu parola ile girersin.",
  soru: "Güvenlik sorun kaydedildi. Şifreni unutursan bununla yenilersin.",
  "e-parola-eski": "Mevcut parola hatalı.",
  "e-ad": "Görünen ad 2–40 karakter olmalı ve bir harfle başlamalı.",
  "e-adres": "Adres en fazla 120 karakter olabilir. Harf, rakam ve temel noktalama yeter.",
  "e-yenile": "Yenilenecek harcama yok. Kullanılabilir bakiye zaten tam.",
  "e-transfer": "Aktarım en az 1 USD olmalı ve kartın kullanılabilir bakiyesini aşmamalı.",
  "e-transfer-kart": "Aktarılacak başka bir açık kart seç.",
  "e-transfer-tavan": "Karşı kartın kullanılabilir bakiyesi bu aktarımı almıyor.",
  okundu: "Bildirim okundu sayıldı.",
  duyuru: "Duyuru kaydedildi. Açıksa ana sayfada ve panelde durur.",
  "duyuru-sil": "Duyuru kapatıldı.",
  metin: "Yazılar kaydedildi. Boş bırakılan satır varsayılan metne döner.",
  "talep-kapandi": "Talep kapatıldı.",
  "bildirim-sil": "Bildirim silindi.",
};

export function noticeText(code?: string): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

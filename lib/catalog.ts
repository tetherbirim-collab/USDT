import type { CardTypeId, PlanId, TxKind } from "./types";

export const TEST_BIN = "400000";
export const WELCOME_BONUS_KURUS = 150_000;
export const MIN_TOPUP_KURUS = 5_000;
export const MAX_TOPUP_KURUS = 2_000_000;
export const MAX_BALANCE_KURUS = 25_000_000;
export const MIN_SPEND_KURUS = 1_000;
export const MAX_SPEND_KURUS = 2_000_000;
export const MIN_LIMIT_KURUS = 10_000;
export const MAX_LIMIT_KURUS = 10_000_000;

export const CARD_TYPE_ORDER: CardTypeId[] = ["facebook_ads", "tiktok", "google_ads", "ultima"];

export const CARD_TYPES: Record<
  CardTypeId,
  { name: string; pitch: string; scene: string; fee: number }
> = {
  facebook_ads: {
    name: "Facebook Ads",
    pitch: "Akış bütçesi",
    scene: "Akış reklamı provası için ayrı limit. Platforma bağlanmaz, tahsilat yapılmaz.",
    fee: 4500,
  },
  tiktok: {
    name: "TikTok",
    pitch: "Kısa video provası",
    scene: "Kısa video kampanyasını kendi tavanında izle. Uygulama hesabına bağlanmaz.",
    fee: 3900,
  },
  google_ads: {
    name: "Google Ads",
    pitch: "Arama provası",
    scene: "Arama kampanyası bütçesini ayrı tavanda dene. Resmi hesap bağlantısı ve iş ortaklığı yoktur.",
    fee: 4500,
  },
  ultima: {
    name: "Ultima",
    pitch: "Geniş prova tavanı",
    scene: "Koyu metal bir prova kartı. Bir ağa bağlı değildir; basım ücreti simülasyondur.",
    fee: 7900,
  },
};

export function isCardType(value: string): value is CardTypeId {
  return CARD_TYPE_ORDER.includes(value as CardTypeId);
}

export const PLANS: Record<
  PlanId,
  { name: string; price: string; period: string; cardLimit: number; blurb: string }
> = {
  kivilcim: {
    name: "Kıvılcım",
    price: "0 ₺",
    period: "vitrin",
    cardLimit: 2,
    blurb: "İki açık kart, hoş geldin bakiyesi, tüm türler. Yeni hesaplar burada başlar.",
  },
  atolye: {
    name: "Atölye",
    price: "149 ₺",
    period: "ay · tahsil edilmez",
    cardLimit: 8,
    blurb: "Sekiz açık kart ve daha geniş prova alanı. Demo hesap bu vitrindedir.",
  },
  galeri: {
    name: "Galeri",
    price: "399 ₺",
    period: "ay · tahsil edilmez",
    cardLimit: 25,
    blurb: "Kalabalık ekip provası için yüksek kart adedi. Yine de gerçek ihrac yok.",
  },
};

export const MERCHANTS_BY_TYPE: Record<CardTypeId, readonly string[]> = {
  facebook_ads: ["Vitrin Akış", "Mavi Sayfa Prova", "Sahne Reklam"],
  tiktok: ["Kısa Sahne", "Nota Akış", "Gece Klip"],
  google_ads: ["Arama Vitrini", "Kelime Tezgahı", "Harita Prova"],
  ultima: ["Ultima Salon", "Metal Gece", "Kule Rezerv"],
};

export function merchantsFor(type: CardTypeId): readonly string[] {
  return MERCHANTS_BY_TYPE[type];
}

export function isMerchantForType(type: CardTypeId, value: string): boolean {
  return MERCHANTS_BY_TYPE[type].includes(value);
}

export const KIND_LABEL: Record<TxKind, string> = {
  yukleme: "Yükleme",
  harcama: "Harcama",
  iade: "İade",
  basim: "Basım",
  duzeltme: "Düzeltme",
};

export const NOTICES: Record<string, string> = {
  hosgeldin:
    "Hoş geldin bakiyesi simülasyondur. Gerçek tahsilat yapılmadı.",
  yuklendi: "Simülasyon bakiyesi eklendi. Gerçek tahsilat yapılmadı.",
  basildi:
    "Simülasyon kartı basıldı. Numara test verisidir, gerçek üye işyerinde kullanılamaz.",
  donduruldu: "Kart donduruldu. Harcama provası kapalı.",
  cozuldu: "Kart yeniden aktif. Bu hâlâ bir simülasyon.",
  kapatildi: "Kart kapatıldı. Kapanış geri alınmaz; ortada gerçek bir kart yoktur.",
  harcama: "Simüle harcama bakiyeye ve limite işlendi.",
  reddedildi: "Harcama reddedildi. Kayıt işlem listesinde.",
  "e-tutar": "Tutar izin verilen aralığın dışında.",
  "e-tavan": "Simülasyon bakiyesi üst sınıra ulaştı.",
  "e-bakiye": "Simülasyon bakiyesi bu işlem için yetersiz.",
  "e-limit": "Kart tavanı 100 ₺ ile 100.000 ₺ arasında olmalı.",
  "e-etiket": "Etiket 2–32 karakter olmalı.",
  "e-tur": "Kart türü seç.",
  "e-plan": "Bu vitrin planındaki açık kart adedine ulaşıldı.",
  "e-durum": "Kart bu işlem için uygun durumda değil.",
  "e-onay": "Kapatmak için onay kutusu gerekli.",
  "e-yok": "Kayıt bu simülasyonda bulunamadı.",
  "e-isletme": "Bu kart türünün prova listesinden bir işletme seç.",
  bakiye: "Simülasyon bakiyesi güncellendi. Gerçek tahsilat yoktur.",
  askida: "Hesap askıya alındı. Bu kullanıcı giriş yapamaz.",
  acildi: "Hesap yeniden açıldı. Simülasyon girişi yine mümkün.",
  "e-askida": "Bu simülasyon hesabı askıya alındı. Giriş kapalı.",
  "e-kendin": "Yönetici kendi hesabını askıya alamaz.",
  "e-yonetici": "Yönetici hesabı bu işlem için kapalı.",
  gonderildi: "Bildirim üye paneline yazıldı. Bu bir simülasyon mesajıdır.",
  kart: "Kart kaydı güncellendi. Numara değişmedi; hâlâ test verisidir.",
  islem: "İşlem tutarı güncellendi. Tahsilat yoktur.",
  zaman: "Son yükleme zamanı güncellendi.",
  "e-mesaj": "Başlık 2–80, mesaj 2–400 karakter olmalı.",
  "e-hedef": "Bir üye seç veya tüm üyeleri işaretle.",
  "e-zaman": "Zaman İstanbul saatiyle seçilmeli.",
  "e-yukleme-yok": "Bu hesapta düzenlenecek bir yükleme yok.",
  bin: "BIN satırı bu türün listesine yazıldı. Numara sorgulama yoktur.",
  "e-bin": "Kart oluşturmak için bu türe ait bir BIN seç. Liste boşsa basım kapalı.",
  "e-bin-kayit": "Etiket 2–40 karakter, BIN ise 6–8 rakam olmalı. Aynı türde aynı rakam iki kez durmaz.",
  parola: "Parola güncellendi. Yönetim masasında yeni parola görünür.",
  "e-parola": "Yeni parola 6–72 karakter olmalı ve tekrar ile aynı olmalı.",
  "e-parola-eski": "Mevcut parola hatalı.",
  okundu: "Bildirim okundu sayıldı.",
};

export function noticeText(code?: string): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

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
/** How long a new card stays on the order slip before it becomes active. */
export const CARD_PREP_MS = 15_000;
/**
 * Fixed simulation selling rate, 15 Eki 2026. Not a live feed and not a payment.
 * One US dollar converts to this many lira.
 */
export const USD_SELL_RATE = 49.3929;
export const USD_RATE_AS_OF = "15 Eki 2026";
export const MIN_USD_MINOR = 100;
export const MAX_USD_MINOR = 500_000;
/** Smallest ceiling move. Two percent of this is still a whole kuruş. */
export const MIN_TRANSFER_KURUS = 100;
export const TRANSFER_FEE_PERCENT = 2;

export function transferFee(amount: number): number {
  return Math.round((amount * TRANSFER_FEE_PERCENT) / 100);
}

export function usdMinorToKurus(minor: number): number {
  return Math.round(minor * USD_SELL_RATE);
}

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

export function isPlan(value: string): value is PlanId {
  return value === "kivilcim" || value === "atolye" || value === "galeri";
}

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
  yenileme: "Tavan yenileme",
  transfer: "Aktarım",
};

export const NOTICES: Record<string, string> = {
  hosgeldin:
    "Hoş geldin bakiyesi simülasyondur. Gerçek tahsilat yapılmadı.",
  yuklendi: "Simülasyon bakiyesi eklendi. Gerçek tahsilat yapılmadı.",
  basildi:
    "Simülasyon kartı basıldı. Numara test verisidir, gerçek üye işyerinde kullanılamaz.",
  siparis:
    "Sipariş alındı. Kart kısa süre hazırlanır. Basım ücreti simülasyondur, numara test verisidir.",
  hazir: "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz. Numara test verisidir ve gerçek üye işyerinde kullanılamaz.",
  yenilendi: "Tavan yenilendi. Harcama sayacı sıfırlandı. Cüzdan tutarı değişmedi.",
  transfer: "Kalan tavan aktarıldı. %2 komisyon kesildi. Cüzdan tutarı değişmedi.",
  iade: "Simülasyon iadesi cüzdana ve tavana işlendi. Gerçek tahsilat yoktur.",
  ad: "Görünen ad güncellendi. Kartlardaki ad satırı buna çekildi.",
  adres: "Kart adresi güncellendi. Yalnızca bu hesabın kart detaylarında görünür.",
  donduruldu: "Kart donduruldu. Harcama provası kapalı.",
  cozuldu: "Kart yeniden aktif. Bu hâlâ bir simülasyon.",
  kapatildi: "Kart kapatıldı. Basım ücreti bakiyeye geri yazıldı. Kapanış geri alınmaz.",
  iptal: "Sipariş iptal edildi. Basım ücreti simülasyon bakiyesine geri yazıldı.",
  dolar: "Dolar bakiyesine yazıldı. Harcama lira bakiyesinden düşer. Tahsilat yoktur.",
  cevrildi: "Dolar bakiyesi sabit kurla liraya çevrildi. Tahsilat yoktur.",
  plan: "Vitrin planı güncellendi. Tahsilat yoktur.",
  harcama: "Simüle harcama bakiyeye ve limite işlendi.",
  reddedildi: "Harcama reddedildi. Kayıt işlem listesinde.",
  "e-tutar": "Tutar izin verilen aralığın dışında.",
  "e-tavan": "Simülasyon bakiyesi üst sınıra ulaştı.",
  "e-bakiye": "Simülasyon bakiyesi bu işlem için yetersiz.",
  "e-limit": "Kart tavanı 100 ₺ ile 100.000 ₺ arasında olmalı.",
  "e-etiket": "Etiket 2–32 karakter olmalı.",
  "e-tur": "Kart türü seç.",
  "e-plan": "Bu vitrin planındaki açık kart adedine ulaşıldı.",
  "e-plan-dolu": "Açık kart adedi bu plana sığmıyor. Önce bir kart kapat.",
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
  "e-bin-kayit": "Etiket 2–40 karakter, BIN ise 4–8 rakam olmalı. Aynı türde aynı rakam iki kez durmaz.",
  parola: "Parola güncellendi. Yönetim masasında yeni parola görünür.",
  "e-parola": "Yeni parola 6–72 karakter olmalı ve tekrar ile aynı olmalı.",
  "e-parola-eski": "Mevcut parola hatalı.",
  "e-ad": "Görünen ad 2–40 karakter olmalı ve bir harfle başlamalı.",
  "e-adres": "Adres en fazla 120 karakter olabilir. Harf, rakam ve temel noktalama yeter.",
  "e-yenile": "Yenilenecek harcama yok. Tavan zaten boş.",
  "e-transfer": "Aktarım en az 1 ₺ olmalı ve kartın kalan tavanını aşmamalı.",
  "e-transfer-kart": "Aktarılacak başka bir açık kart seç.",
  "e-transfer-tavan": "Karşı kartın tavanı bu aktarımı almıyor.",
  okundu: "Bildirim okundu sayıldı.",
};

export function noticeText(code?: string): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

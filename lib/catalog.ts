import type { CardTypeId, PlanId, TxKind } from "./types";

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
export const TRANSFER_FEE_PERCENT = 2;

export function transferFee(amount: number): number {
  return Math.round((amount * TRANSFER_FEE_PERCENT) / 100);
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
const FEE_USD_MINOR: Record<CardTypeId, number> = {
  facebook_ads: 100,
  tiktok: 100,
  google_ads: 100,
  ultima: 200,
};

export const CARD_TYPE_ORDER: CardTypeId[] = ["facebook_ads", "tiktok", "google_ads", "ultima"];

export const CARD_TYPES: Record<
  CardTypeId,
  { name: string; pitch: string; scene: string; fee: number }
> = {
  facebook_ads: {
    name: "Facebook Ads",
    pitch: "Akış bütçesi",
    scene: "Akış bütçesi için ayrı tavan.",
    fee: usdMinorToKurus(FEE_USD_MINOR.facebook_ads),
  },
  tiktok: {
    name: "TikTok",
    pitch: "Kısa video bütçesi",
    scene: "Kısa video bütçesini kendi tavanında tut.",
    fee: usdMinorToKurus(FEE_USD_MINOR.tiktok),
  },
  google_ads: {
    name: "Google Ads",
    pitch: "Arama bütçesi",
    scene: "Arama kampanyasının tavanı ayrı durur.",
    fee: usdMinorToKurus(FEE_USD_MINOR.google_ads),
  },
  ultima: {
    name: "Ultima",
    pitch: "Geniş tavan",
    scene: "Geniş tavanlı metal kart.",
    fee: usdMinorToKurus(FEE_USD_MINOR.ultima),
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
    price: "0 USD",
    period: "vitrin",
    cardLimit: 2,
    blurb: "İki açık kart, hoş geldin bakiyesi, tüm türler. Yeni hesaplar burada başlar.",
  },
  atolye: {
    name: "Atölye",
    price: "3 USD",
    period: "ay",
    cardLimit: 8,
    blurb: "Sekiz açık kart ve daha geniş alan.",
  },
  galeri: {
    name: "Galeri",
    price: "8 USD",
    period: "ay",
    cardLimit: 25,
    blurb: "Kalabalık ekip için yüksek kart adedi.",
  },
};

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
  hosgeldin: "Hoş geldin bakiyesi yazıldı. Tutar, doların sabit kur karşılığıdır.",
  yuklendi: "Bakiye yazıldı. Tutar, doların sabit kur karşılığıdır.",
  basildi: "Kart oluşturuldu.",
  siparis: "Sipariş alındı. Kart kısa süre hazırlanır.",
  hazir: "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.",
  yenilendi: "Tavan yenilendi. Harcama sayacı sıfırlandı. Cüzdan tutarı değişmedi.",
  transfer: "Kalan tavan aktarıldı. %2 komisyon kesildi. Cüzdan tutarı değişmedi.",
  iade: "İade cüzdana ve tavana işlendi.",
  ad: "Görünen ad güncellendi.",
  adres: "Kart adresi güncellendi. Yalnızca bu hesabın kart detaylarında görünür.",
  donduruldu: "Kart donduruldu. Harcama kapalı.",
  cozuldu: "Kart yeniden aktif.",
  kapatildi: "Kart kapatıldı. Basım ücreti bakiyeye geri yazıldı. Kapanış geri alınmaz.",
  iptal: "Sipariş iptal edildi. Basım ücreti bakiyeye geri yazıldı.",
  dolar: "Bakiye yazıldı. Ekranda doların sabit kur karşılığı durur.",
  cevrildi: "Bakiye, doların sabit kur karşılığı olarak duruyor.",
  plan: "Plan güncellendi.",
  harcama: "Harcama bakiyeye ve limite işlendi.",
  reddedildi: "Harcama reddedildi. Kayıt işlem listesinde.",
  "e-tutar": "Tutar izin verilen aralığın dışında.",
  "e-tavan": "Bakiye üst sınıra ulaştı.",
  "e-bakiye": "Bakiye bu işlem için yetersiz.",
  "e-limit": "Kart tavanı 10 ile 10.000 USD arasında olmalı.",
  "e-etiket": "Kart adı 2–32 karakter olmalı.",
  "e-tur": "Kart türü seç.",
  "e-plan": "Bu vitrin planındaki açık kart adedine ulaşıldı.",
  "e-plan-dolu": "Açık kart adedi bu plana sığmıyor. Önce bir kart kapat.",
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
  kart: "Kart kaydı güncellendi.",
  islem: "İşlem tutarı güncellendi.",
  zaman: "Son yükleme zamanı güncellendi.",
  "e-mesaj": "Başlık 2–80, mesaj 2–400 karakter olmalı.",
  "e-hedef": "Bir üye seç veya tüm üyeleri işaretle.",
  "e-zaman": "Zaman İstanbul saatiyle seçilmeli.",
  "e-yukleme-yok": "Bu hesapta düzenlenecek bir yükleme yok.",
  bin: "BIN satırı bu türün listesine yazıldı.",
  "e-bin": "Kart oluşturmak için bu türe ait bir BIN seç. Liste boşsa basım kapalı.",
  "e-bin-kayit": "Etiket 2–40 karakter, BIN ise 4–8 rakam olmalı. Aynı türde aynı rakam iki kez durmaz.",
  parola: "Parola güncellendi. Yönetim masasında yeni parola görünür.",
  "e-parola": "Yeni parola 6–72 karakter olmalı ve tekrar ile aynı olmalı.",
  "e-parola-eski": "Mevcut parola hatalı.",
  "e-ad": "Görünen ad 2–40 karakter olmalı ve bir harfle başlamalı.",
  "e-adres": "Adres en fazla 120 karakter olabilir. Harf, rakam ve temel noktalama yeter.",
  "e-yenile": "Yenilenecek harcama yok. Tavan zaten boş.",
  "e-transfer": "Aktarım en az 1 USD olmalı ve kartın kalan tavanını aşmamalı.",
  "e-transfer-kart": "Aktarılacak başka bir açık kart seç.",
  "e-transfer-tavan": "Karşı kartın tavanı bu aktarımı almıyor.",
  okundu: "Bildirim okundu sayıldı.",
};

export function noticeText(code?: string): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

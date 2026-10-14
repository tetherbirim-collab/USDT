import type { CardTypeId, PlanId, TxKind } from "./types";

export const TEST_BIN = "400000";
export const ISSUE_FEE_KURUS = 2900;
export const WELCOME_BONUS_KURUS = 150_000;
export const MIN_TOPUP_KURUS = 5_000;
export const MAX_TOPUP_KURUS = 2_000_000;
export const MAX_BALANCE_KURUS = 25_000_000;
export const MIN_SPEND_KURUS = 1_000;
export const MAX_SPEND_KURUS = 2_000_000;
export const MIN_LIMIT_KURUS = 10_000;
export const MAX_LIMIT_KURUS = 10_000_000;

export const CARD_TYPE_ORDER: CardTypeId[] = [
  "reklam",
  "alisveris",
  "abonelik",
  "seyahat",
];

export const CARD_TYPES: Record<
  CardTypeId,
  { name: string; pitch: string; scene: string }
> = {
  reklam: {
    name: "Reklam",
    pitch: "Kampanya tavanı",
    scene:
      "Medya denemelerini ayrı limitte tut. Hiçbir reklam hesabına bağlanmaz.",
  },
  alisveris: {
    name: "Alışveriş",
    pitch: "Sepet provası",
    scene: "Pazar yeri senaryolarını tek kartta izole et. Tahsilat yoktur.",
  },
  abonelik: {
    name: "Abonelik",
    pitch: "Araç tavanı",
    scene: "Tekrarlayan servis provasını sabit bir tavana yaz.",
  },
  seyahat: {
    name: "Seyahat",
    pitch: "Rezervasyon provası",
    scene: "Bilet ve konaklama akışını gerçek kart kullanmadan dene.",
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

export const MERCHANTS = [
  "Kuzey Ajans Medya",
  "Vitrin Reklam Ağı",
  "Sahne Reklam",
  "Tezgah Pazaryeri",
  "Ada Kargo Sim",
  "Bulut Kalem",
  "Nota Stüdyo",
  "Mavi Otel Prova",
] as const;

export function isMerchant(value: string): value is (typeof MERCHANTS)[number] {
  return (MERCHANTS as readonly string[]).includes(value);
}

export const KIND_LABEL: Record<TxKind, string> = {
  yukleme: "Yükleme",
  harcama: "Harcama",
  iade: "İade",
  basim: "Basım",
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
  "e-yok": "Kart bu hesapta bulunamadı.",
  "e-isletme": "Listeden bir prova işletmesi seç.",
};

export function noticeText(code?: string): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

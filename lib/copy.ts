import type { SiteSettings } from "./types";

/** Built-in trust line. Pieces stay editable; this exact line is the default. */
export const TRUST_SLOGAN = "KYC YOK · LOG YOK · TAMAMEN GÜVENLİ VE ANONİM";

export type CopyKey =
  | "sloganKyc"
  | "sloganLog"
  | "sloganSafe"
  | "phraseFacebook"
  | "phraseTiktok"
  | "phraseGoogle"
  | "phraseUltima"
  | "heroKicker"
  | "heroTitle"
  | "heroLede"
  | "navTypes"
  | "navHow"
  | "navPlans"
  | "navFaq"
  | "typesKicker"
  | "typesTitle"
  | "typesLede"
  | "stepsTitle"
  | "step1Title"
  | "step1Text"
  | "step2Title"
  | "step2Text"
  | "step3Title"
  | "step3Text"
  | "step4Title"
  | "step4Text"
  | "plansKicker"
  | "plansTitle"
  | "faqTitle"
  | "faq1q"
  | "faq1a"
  | "faq2q"
  | "faq2a"
  | "faq3q"
  | "faq3a"
  | "footerLine"
  | "loginTitle"
  | "loginLede"
  | "signupTitle"
  | "signupLede"
  | "panelOzet"
  | "panelKart"
  | "panelSiparis"
  | "panelOdeme"
  | "panelCuzdan"
  | "panelDestek"
  | "panelHesap"
  | "supportTitle"
  | "supportLede";

export const COPY: Record<CopyKey, { group: string; label: string; fallback: string; max: number }> = {
  sloganKyc: { group: "Güven", label: "KYC satırı", fallback: "KYC YOK", max: 40 },
  sloganLog: { group: "Güven", label: "LOG satırı", fallback: "LOG YOK", max: 40 },
  sloganSafe: { group: "Güven", label: "Güven satırı", fallback: "TAMAMEN GÜVENLİ VE ANONİM", max: 80 },
  phraseFacebook: { group: "Ana sayfa", label: "Kayan yazı · Facebook", fallback: "KYC GEREKMEZ", max: 40 },
  phraseTiktok: { group: "Ana sayfa", label: "Kayan yazı · TikTok", fallback: "ANONİM SANAL KART", max: 40 },
  phraseGoogle: { group: "Ana sayfa", label: "Kayan yazı · Google", fallback: "OLUŞTUR VE HEMEN HARCA", max: 48 },
  phraseUltima: { group: "Ana sayfa", label: "Kayan yazı · Ultima", fallback: "CLAY SANAL KART", max: 40 },
  heroKicker: { group: "Ana sayfa", label: "Üst etiket", fallback: "CLAY VIRTUAL CARD", max: 48 },
  heroTitle: { group: "Ana sayfa", label: "Ana başlık", fallback: "SANAL KART HİZMETİ", max: 80 },
  heroLede: {
    group: "Ana sayfa",
    label: "Ana paragraf",
    fallback:
      "Facebook Ads, TikTok, Google Ads ve Ultima kartlarını aynı cüzdanda tut. CLAY kartı basar, kullanılabilir bakiyeyi yazar, dondurur ve işlem dökümünü tutar. Bakiye, doların sabit kur karşılığıdır.",
    max: 400,
  },
  navTypes: { group: "Ana sayfa", label: "Menü · türler", fallback: "Türler", max: 24 },
  navHow: { group: "Ana sayfa", label: "Menü · nasıl", fallback: "Nasıl işler", max: 24 },
  navPlans: { group: "Ana sayfa", label: "Menü · vitrin", fallback: "Vitrin", max: 24 },
  navFaq: { group: "Ana sayfa", label: "Menü · sorular", fallback: "Sorular", max: 24 },
  typesKicker: { group: "Ana sayfa", label: "Türler etiketi", fallback: "TÜRLER", max: 24 },
  typesTitle: { group: "Ana sayfa", label: "Türler başlığı", fallback: "Ayrı sahneler", max: 60 },
  typesLede: {
    group: "Ana sayfa",
    label: "Türler paragrafı",
    fallback: "Her kart 300₺. Karta ayırdığın tutardan %7,3 kesilir. Tutar dolar cinsindendir, ekranda TL karşılığı durur.",
    max: 240,
  },
  stepsTitle: { group: "Ana sayfa", label: "Adımlar başlığı", fallback: "Dört adım", max: 40 },
  step1Title: { group: "Ana sayfa", label: "Adım 1 başlık", fallback: "Hesap aç", max: 40 },
  step1Text: {
    group: "Ana sayfa",
    label: "Adım 1 yazı",
    fallback: "Kullanıcı adı, parola ve bir güvenlik sorusu yeter. Kimlik belgesi istenmez.",
    max: 180,
  },
  step2Title: { group: "Ana sayfa", label: "Adım 2 başlık", fallback: "Bakiye yükle", max: 40 },
  step2Text: {
    group: "Ana sayfa",
    label: "Adım 2 yazı",
    fallback: "Tutarı dolar olarak girersin. Heleket ödemesi onaylanınca bakiyede sabit kurun TL karşılığı durur.",
    max: 220,
  },
  step3Title: { group: "Ana sayfa", label: "Adım 3 başlık", fallback: "Kart bas", max: 40 },
  step3Text: {
    group: "Ana sayfa",
    label: "Adım 3 yazı",
    fallback: "Karta isim ver, kullanılabilir bakiyeyi seç, sonra o türün BIN listesinden bir satır işaretle.",
    max: 220,
  },
  step4Title: { group: "Ana sayfa", label: "Adım 4 başlık", fallback: "İzle ve dondur", max: 40 },
  step4Text: { group: "Ana sayfa", label: "Adım 4 yazı", fallback: "Harcama limite işlenir. İstediğin an dondur veya kapat.", max: 180 },
  plansKicker: { group: "Ana sayfa", label: "Vitrin etiketi", fallback: "VİTRİN", max: 24 },
  plansTitle: { group: "Ana sayfa", label: "Vitrin başlığı", fallback: "Planlar", max: 40 },
  faqTitle: { group: "Ana sayfa", label: "Sorular başlığı", fallback: "Merak edilenler", max: 40 },
  faq1q: { group: "Ana sayfa", label: "Soru 1", fallback: "Kart nasıl oluşur?", max: 80 },
  faq1a: { group: "Ana sayfa", label: "Yanıt 1", fallback: "Türü, adı ve kullanılabilir bakiyeyi seçersin. Üzerindeki ad, verdiğin addır.", max: 240 },
  faq2q: { group: "Ana sayfa", label: "Soru 2", fallback: "Bakiye nasıl durur?", max: 80 },
  faq2a: { group: "Ana sayfa", label: "Yanıt 2", fallback: "Tutar dolar olarak girilir. Ekranda yalnız sabit kurun TL karşılığı görünür.", max: 240 },
  faq3q: { group: "Ana sayfa", label: "Soru 3", fallback: "Numara ne zaman görünür?", max: 80 },
  faq3a: {
    group: "Ana sayfa",
    label: "Yanıt 3",
    fallback: "Satın almadan önce BIN kalır, kalan haneler X olur. Kart oluşunca 16 hane yazılır. CVV’yi sen açarsın.",
    max: 240,
  },
  footerLine: {
    group: "Ana sayfa",
    label: "Alt yazı",
    fallback: "CLAY Sanal Kart Hizmetleri. Bakiye, doların sabit kur karşılığıdır.",
    max: 180,
  },
  loginTitle: { group: "Giriş", label: "Giriş başlığı", fallback: "Hoş geldin", max: 40 },
  loginLede: {
    group: "Giriş",
    label: "Giriş yazısı",
    fallback: "Kullanıcı adın ve parolanla gir. Unuttuysan güvenlik yanıtınla yeni parola belirlersin.",
    max: 180,
  },
  signupTitle: { group: "Giriş", label: "Kayıt başlığı", fallback: "Kayıt ol", max: 40 },
  signupLede: {
    group: "Giriş",
    label: "Kayıt yazısı",
    fallback: "Kullanıcı adı, parola ve güvenlik sorusu yaz. Şifreni unutursan bu yanıtla yenilersin.",
    max: 180,
  },
  panelOzet: { group: "Panel", label: "Menü · özet", fallback: "Özet", max: 24 },
  panelKart: { group: "Panel", label: "Menü · kartlar", fallback: "Kartlarım", max: 24 },
  panelSiparis: { group: "Panel", label: "Menü · siparişler", fallback: "Siparişler", max: 24 },
  panelOdeme: { group: "Panel", label: "Menü · ödemeler", fallback: "Ödemeler", max: 24 },
  panelCuzdan: { group: "Panel", label: "Menü · cüzdan", fallback: "Cüzdan", max: 24 },
  panelDestek: { group: "Panel", label: "Menü · destek", fallback: "Destek", max: 24 },
  panelHesap: { group: "Panel", label: "Menü · hesap", fallback: "Hesap", max: 24 },
  supportTitle: { group: "Panel", label: "Destek başlığı", fallback: "Yeni talep", max: 40 },
  supportLede: {
    group: "Panel",
    label: "Destek yazısı",
    fallback: "Şikayetini yaz. Talep yönetim masasına düşer. Yanıt zilde ve bu listede görünür.",
    max: 200,
  },
};

export const COPY_KEYS = Object.keys(COPY) as CopyKey[];

export function siteText(settings: SiteSettings | null | undefined, key: CopyKey): string {
  const raw = settings?.copy?.[key];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return COPY[key].fallback;
}

if (`${COPY.sloganKyc.fallback} · ${COPY.sloganLog.fallback} · ${COPY.sloganSafe.fallback}` !== TRUST_SLOGAN) {
  throw new Error("Güven satırı varsayılanı bozuldu");
}

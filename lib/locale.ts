export type Lang = "tr" | "en" | "de" | "fr" | "es" | "pt" | "it" | "nl" | "pl" | "ru" | "ar";

export type CardCopy = {
  service: string;
  lines: readonly string[];
  dir: "ltr" | "rtl";
};

const COPY: Record<Lang, CardCopy> = {
  tr: {
    service: "SANAL KART HİZMETLERİ",
    lines: [
      "KYC KİMLİK BİLGİSİ GEREKMEZ",
      "ANONİM SANAL KART",
      "OLUŞTUR, HEMEN REKLAMINA BAŞLA",
      "KİMLİK BELGESİ İSTENMEZ",
    ],
    dir: "ltr",
  },
  en: {
    service: "VIRTUAL CARD SERVICES",
    lines: [
      "NO IDENTITY CHECK REQUIRED",
      "ANONYMOUS VIRTUAL CARD",
      "CREATE IT AND START YOUR ADS",
      "NO ID DOCUMENT ASKED",
    ],
    dir: "ltr",
  },
  de: {
    service: "VIRTUELLE KARTENDIENSTE",
    lines: [
      "KEINE IDENTITÄTSPRÜFUNG",
      "ANONYME VIRTUELLE KARTE",
      "ERSTELLEN UND WERBUNG STARTEN",
      "KEIN AUSWEIS NÖTIG",
    ],
    dir: "ltr",
  },
  fr: {
    service: "SERVICES DE CARTE VIRTUELLE",
    lines: [
      "AUCUN CONTRÔLE D'IDENTITÉ",
      "CARTE VIRTUELLE ANONYME",
      "CRÉEZ-LA ET LANCEZ VOTRE PUB",
      "AUCUNE PIÈCE DEMANDÉE",
    ],
    dir: "ltr",
  },
  es: {
    service: "SERVICIOS DE TARJETA VIRTUAL",
    lines: [
      "SIN VERIFICACIÓN DE IDENTIDAD",
      "TARJETA VIRTUAL ANÓNIMA",
      "CRÉALA Y EMPIEZA TU ANUNCIO",
      "NO SE PIDE DOCUMENTO",
    ],
    dir: "ltr",
  },
  pt: {
    service: "SERVIÇOS DE CARTÃO VIRTUAL",
    lines: [
      "SEM VERIFICAÇÃO DE IDENTIDADE",
      "CARTÃO VIRTUAL ANÓNIMO",
      "CRIE E COMECE O ANÚNCIO",
      "NENHUM DOCUMENTO PEDIDO",
    ],
    dir: "ltr",
  },
  it: {
    service: "SERVIZI DI CARTA VIRTUALE",
    lines: [
      "NESSUN CONTROLLO D'IDENTITÀ",
      "CARTA VIRTUALE ANONIMA",
      "CREALA E AVVIA LA PUBBLICITÀ",
      "NESSUN DOCUMENTO RICHIESTO",
    ],
    dir: "ltr",
  },
  nl: {
    service: "VIRTUELE KAARTDIENSTEN",
    lines: [
      "GEEN IDENTITEITSCONTROLE",
      "ANONIEME VIRTUELE KAART",
      "MAAK HEM EN START JE ADVERTENTIE",
      "GEEN IDENTITEITSBEWIJS",
    ],
    dir: "ltr",
  },
  pl: {
    service: "USŁUGI KARTY WIRTUALNEJ",
    lines: [
      "BEZ WERYFIKACJI TOŻSAMOŚCI",
      "ANONIMOWA KARTA WIRTUALNA",
      "UTWÓRZ I ZACZNIJ REKLAMĘ",
      "BEZ DOKUMENTU TOŻSAMOŚCI",
    ],
    dir: "ltr",
  },
  ru: {
    service: "СЕРВИС ВИРТУАЛЬНЫХ КАРТ",
    lines: [
      "ПРОВЕРКА ЛИЧНОСТИ НЕ НУЖНА",
      "АНОНИМНАЯ ВИРТУАЛЬНАЯ КАРТА",
      "СОЗДАЙТЕ И ЗАПУСТИТЕ РЕКЛАМУ",
      "ДОКУМЕНТ НЕ СПРАШИВАЕМ",
    ],
    dir: "ltr",
  },
  ar: {
    service: "خدمات البطاقة الافتراضية",
    lines: [
      "لا حاجة لبيانات الهوية",
      "بطاقة افتراضية مجهولة",
      "أنشئها وابدأ إعلانك",
      "لا نطلب وثيقة هوية",
    ],
    dir: "rtl",
  },
};

const COUNTRY: Record<string, Lang> = {
  TR: "tr",
  AZ: "tr",
  CY: "tr",
  US: "en",
  GB: "en",
  IE: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  IN: "en",
  SG: "en",
  ZA: "en",
  NG: "en",
  PH: "en",
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  UY: "es",
  PT: "pt",
  BR: "pt",
  IT: "it",
  SM: "it",
  NL: "nl",
  PL: "pl",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  EG: "ar",
  JO: "ar",
  IQ: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  LB: "ar",
};

export function copyFor(lang: Lang): CardCopy {
  return COPY[lang];
}

export function langFromCountry(code: string): Lang {
  return COUNTRY[code.trim().toUpperCase()] ?? "en";
}

export function langFromTag(tag: string): Lang {
  const base = tag.toLowerCase().slice(0, 2);
  if (base in COPY) return base as Lang;
  return "tr";
}

export async function detectLang(): Promise<Lang> {
  try {
    const response = await fetch("https://get.geojs.io/v1/ip/country", { cache: "no-store" });
    if (response.ok) {
      const code = (await response.text()).trim();
      if (/^[A-Za-z]{2}$/.test(code)) return langFromCountry(code);
    }
  } catch {
    /* The country lookup is optional. The browser language is the fallback. */
  }
  if (typeof navigator !== "undefined" && navigator.language) return langFromTag(navigator.language);
  return "tr";
}

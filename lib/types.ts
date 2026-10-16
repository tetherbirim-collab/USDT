export type PlanId = "kivilcim" | "atolye" | "galeri";

export type CardTypeId = "facebook_ads" | "tiktok" | "google_ads" | "ultima";

export type CardStatus = "hazirlaniyor" | "aktif" | "donduruldu" | "kapali";

export type TxKind = "yukleme" | "harcama" | "iade" | "basim" | "duzeltme" | "yenileme" | "transfer";

export type TxStatus = "tamamlandi" | "reddedildi";

export type UserRole = "uye" | "yonetici";

export type AccountStatus = "acik" | "askida";

export type User = {
  id: string;
  name: string;
  username: string;
  /**
   * Plain text only for accounts opened before seeded signup (demo, clayadmin, security-question members).
   * New accounts keep this empty and store passHash instead.
   */
  password: string;
  /** Salted SHA-256 of the password. Present on accounts opened with an 8-digit password. */
  passSalt?: string;
  passHash?: string;
  /** Salted SHA-256 of the recovery seed. The phrase itself is never stored. */
  seedSalt?: string;
  seedHash?: string;
  /** Set on the desk view when the seed hash exists but was stripped from the payload. */
  hasSeed?: boolean;
  /** Question id chosen at signup. The answer stays off the public profile. */
  securityQuestion?: string;
  securityAnswer?: string;
  balance: number;
  /** Dollar pocket in US cents. Spending still uses the lira balance. */
  usdMinor: number;
  plan: PlanId;
  role: UserRole;
  status: AccountStatus;
  /** Billing line the member writes. Empty until they set it. Shown only on their cards. */
  address: string;
  createdAt: string;
  /** Set when the plan changes. Empty uses a 30-day window from the account date. */
  planUntil?: string | null;
};

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  balance: number;
  usdMinor: number;
  plan: PlanId;
  role: UserRole;
  status: AccountStatus;
  address: string;
  /** When the current package window ends. */
  planUntil: string;
  /** Question id only. The answer is not sent to the browser. */
  securityQuestion?: string;
  /** True when a recovery seed hash exists. The phrase is not sent to the browser. */
  hasSeed?: boolean;
};

export type Card = {
  id: string;
  userId: string;
  type: CardTypeId;
  label: string;
  limit: number;
  spent: number;
  pan: string;
  /** BIN digits chosen at issue. Not a lookup of an outside catalog. */
  bin: string;
  binLabel: string;
  expiry: string;
  cvv: string;
  holder: string;
  status: CardStatus;
  /** When status is hazirlaniyor, the card becomes active at this instant. */
  readyAt: string | null;
  /** Ceiling period. A halfway warning is sent once per period. */
  period: number;
  createdAt: string;
  /** Next card-fee slot, or the unpaid one when the wallet was short. */
  feeDueAt?: string | null;
  /** Member pin. */
  starred?: boolean;
};

export type BinRow = {
  id: string;
  type: CardTypeId;
  label: string;
  digits: string;
};

export type CardFace = {
  type: CardTypeId;
  label: string;
  holder: string;
  pan: string;
  expiry: string;
  cvv: string;
  status: CardStatus;
  /** Chosen BIN. The network mark follows these digits, not the card scene. */
  bin?: string;
  /** Purchase preview. BIN digits plus X for the unknown part of the 16. */
  panLine?: string;
  masked?: boolean;
  /** Undefined hides the CVV until the member asks to see it. */
  hideCvv?: boolean;
};

export type Tx = {
  id: string;
  userId: string;
  cardId: string | null;
  kind: TxKind;
  title: string;
  note: string;
  amount: number;
  status: TxStatus;
  createdAt: string;
  /** Dollar movement in US cents. Positive enters the pocket, negative leaves it. */
  usdMinor?: number | null;
  /** Heleket invoice key. A paid order is written once. */
  ref?: string | null;
};

export type OrderStatus = "hazirlaniyor" | "hazir" | "iptal";

export type Order = {
  id: string;
  /** Public number, Clay-444885. The long id stays internal. */
  code?: string;
  userId: string;
  cardId: string;
  type: CardTypeId;
  label: string;
  limit: number;
  fee: number;
  status: OrderStatus;
  createdAt: string;
  readyAt: string | null;
};

export type TicketStatus = "acik" | "yanitlandi" | "kapandi";

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: TicketStatus;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
};

export type PlanSetting = {
  name: string;
  priceUsdMinor: number;
  cardLimit: number;
  blurb: string;
};

export type Announcement = {
  title: string;
  body: string;
  on: boolean;
};

export type PayoutStatus = "bekliyor" | "gitti" | "iptal";

export type PayoutCoin = "btc" | "usdt" | "xmr";

export type Payout = {
  id: string;
  userId: string;
  amount: number;
  usdMinor: number;
  wallet: string;
  /** Coin the wallet address belongs to. Older rows may omit it. */
  coin?: PayoutCoin;
  status: PayoutStatus;
  createdAt: string;
  settledAt: string | null;
};

export type SiteSettings = {
  issueFeeKurus: number;
  loadFeePercent: number;
  transferFeePercent: number;
  plans: Record<PlanId, PlanSetting>;
  /** Telegram username without @. Empty hides the corner button. */
  telegram: string;
  /** Public strip on the launchpad and the member panel. */
  announcement: Announcement;
  /** Admin overrides. Empty or missing keys keep the built-in Turkish line. */
  copy: Record<string, string>;
};

export type InboxNote = {
  id: string;
  userId: string;
  batch: string;
  title: string;
  body: string;
  createdAt: string;
  /** Null until the member marks the note read. Opening the page does not set this. */
  readAt: string | null;
  /** Stable key so a limit warning is sent once per card. */
  ref: string | null;
};

export type DB = {
  users: User[];
  cards: Card[];
  transactions: Tx[];
  notices: InboxNote[];
  tickets: Ticket[];
  bins: BinRow[];
  orders: Order[];
  payouts: Payout[];
  settings: SiteSettings;
  nextSerial: number;
};

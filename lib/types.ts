export type PlanId = "kivilcim" | "atolye" | "galeri";

export type CardTypeId = "facebook_ads" | "tiktok" | "google_ads" | "ultima";

export type CardStatus = "aktif" | "donduruldu" | "kapali";

export type TxKind = "yukleme" | "harcama" | "iade" | "basim" | "duzeltme";

export type TxStatus = "tamamlandi" | "reddedildi";

export type UserRole = "uye" | "yonetici";

export type AccountStatus = "acik" | "askida";

export type User = {
  id: string;
  name: string;
  username: string;
  /** Plain text so the simulation admin desk can show the current password. */
  password: string;
  balance: number;
  plan: PlanId;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  balance: number;
  plan: PlanId;
  role: UserRole;
  status: AccountStatus;
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
  createdAt: string;
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
  masked?: boolean;
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
  bins: BinRow[];
  nextSerial: number;
};

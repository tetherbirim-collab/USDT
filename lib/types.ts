export type PlanId = "kivilcim" | "atolye" | "galeri";

export type CardTypeId = "reklam" | "alisveris" | "abonelik" | "seyahat";

export type CardStatus = "aktif" | "donduruldu" | "kapali";

export type TxKind = "yukleme" | "harcama" | "iade" | "basim";

export type TxStatus = "tamamlandi" | "reddedildi";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  balance: number;
  plan: PlanId;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  balance: number;
  plan: PlanId;
};

export type Card = {
  id: string;
  userId: string;
  type: CardTypeId;
  label: string;
  limit: number;
  spent: number;
  pan: string;
  expiry: string;
  cvv: string;
  holder: string;
  status: CardStatus;
  createdAt: string;
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

export type DB = {
  users: User[];
  cards: Card[];
  transactions: Tx[];
  nextSerial: number;
};

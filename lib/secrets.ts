/** Signup secrets. The ledger keeps salted hashes, never the password or the seed phrase. */

const SEED_WORDS = [
  "ada",
  "akasya",
  "armut",
  "ayna",
  "badem",
  "bahar",
  "bakir",
  "balon",
  "bambu",
  "belge",
  "bere",
  "bez",
  "boru",
  "bulut",
  "cam",
  "cami",
  "ceviz",
  "cicek",
  "corap",
  "damla",
  "defter",
  "deniz",
  "depo",
  "duvar",
  "ekmek",
  "elma",
  "fener",
  "gece",
  "gol",
  "gumus",
  "halat",
  "harita",
  "kabak",
  "kagit",
  "kalem",
  "kapi",
  "kar",
  "kase",
  "kaya",
  "kazak",
  "kedi",
  "keman",
  "kiremit",
  "kitap",
  "kuyu",
  "lamba",
  "limon",
  "masa",
  "mavi",
  "mercan",
  "nar",
  "nehir",
  "oda",
  "orman",
  "otel",
  "perde",
  "pilav",
  "pinar",
  "ruzgar",
  "sabah",
  "saat",
  "sandal",
  "sepet",
  "simit",
  "soba",
  "su",
  "sut",
  "tabla",
  "tavan",
  "tel",
  "tepe",
  "toprak",
  "tuz",
  "vazo",
  "yelek",
  "yildiz",
  "yol",
  "yun",
  "zeytin",
  "zincir",
] as const;

export type SecretUser = {
  password?: string;
  passSalt?: string;
  passHash?: string;
  seedSalt?: string;
  seedHash?: string;
};

function pickIndex(length: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % length;
}

export function foldSeed(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function seedPhraseOk(raw: string): boolean {
  return /^[a-z]{2,16}(?: [a-z]{2,16}){7,15}$/.test(foldSeed(raw));
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function digestSecret(secret: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}\n${secret}`);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function passwordOk(user: SecretUser, password: string): Promise<boolean> {
  if (user.passHash && user.passSalt) {
    const digest = await digestSecret(password, user.passSalt);
    return digest === user.passHash;
  }
  return typeof user.password === "string" && user.password.length > 0 && user.password === password;
}

export async function seedOk(user: SecretUser, phrase: string): Promise<boolean> {
  if (!user.seedHash || !user.seedSalt) return false;
  const folded = foldSeed(phrase);
  if (!seedPhraseOk(folded)) return false;
  const digest = await digestSecret(folded, user.seedSalt);
  return digest === user.seedHash;
}

export function makePassword(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 100_000_000).padStart(8, "0");
}

export function makeSeedWords(count = 12): string[] {
  const pool = [...SEED_WORDS];
  const words: string[] = [];
  while (words.length < count && pool.length > 0) {
    const index = pickIndex(pool.length);
    words.push(pool.splice(index, 1)[0]);
  }
  return words;
}

export function makeUsername(): string {
  const first = SEED_WORDS[pickIndex(SEED_WORDS.length)];
  let second = SEED_WORDS[pickIndex(SEED_WORDS.length)];
  let guard = 0;
  while (second === first && guard < 8) {
    second = SEED_WORDS[pickIndex(SEED_WORDS.length)];
    guard += 1;
  }
  const suffix = String(pickIndex(100)).padStart(2, "0");
  const name = `${first}_${second}${suffix}`;
  if (name === "demo" || name === "clayadmin" || name === "admin") return makeUsername();
  return name;
}

export type SignupSlip = {
  username: string;
  password: string;
  words: string[];
};

export function makeSignup(): SignupSlip {
  return {
    username: makeUsername(),
    password: makePassword(),
    words: makeSeedWords(12),
  };
}

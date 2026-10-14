import Link from "next/link";
import { CARD_TYPE_ORDER, CARD_TYPES, PLANS } from "@/lib/catalog";
import { makeCvv, makePan } from "@/lib/pan";
import { Mark } from "./mark";
import { TiltCard } from "./tilt-card";
import { VirtualCard } from "./virtual-card";

const TICKER =
  "SİMÜLASYON  ·  GERÇEK TAHSİLAT YOK  ·  TEST BIN 400000  ·  ÜYE İŞYERİNDE GEÇMEZ  ·  KİMLİK BELGESİ YOK  ·  ";

const STEPS = [
  {
    n: "01",
    title: "Hesap aç",
    text: "Ad, e-posta ve parola yeter. Kimlik belgesi istenmez; çünkü gerçek bir doğrulama yapılmaz.",
  },
  {
    n: "02",
    title: "Bakiye yükle",
    text: "Tutar anında simülasyon bakiyesine yazılır. Banka, kart veya kripto çekilmez.",
  },
  {
    n: "03",
    title: "Kart bas",
    text: "Tür, etiket ve tavan seç. Numara 400000 test aralığındandır ve SİMÜLASYON rozeti taşır.",
  },
  {
    n: "04",
    title: "İzle ve dondur",
    text: "Harcama provası limite işlenir. İstediğin an dondur veya kapat. Hepsi bu stüdyoda kalır.",
  },
];

const FAQ = [
  {
    q: "Bu gerçek bir kart mı?",
    a: "Hayır. SanalKart kart basmaz, banka değildir ve bir ödeme kuruluşu değildir. Gördüğün numaralar ayrılmış test BIN’i ile üretilmiş sahte demo verisidir.",
  },
  {
    q: "Param çekilir mi?",
    a: "Hayır. Bakiye yükleme, basım ücreti ve harcama yalnızca yerel simülasyon defterine yazılır. Ödeme sağlayıcısı yoktur.",
  },
  {
    q: "Numarayı bir sitede dener miyim?",
    a: "Hayır. Kartın üzerinde de yazdığı gibi bu bilgiler gerçek üye işyerinde geçmez. Dışa aktarma veya “çalışan kart” paketi yoktur.",
  },
];

export function Marketing({ loggedIn }: { loggedIn: boolean }) {
  const sample = {
    type: "reklam" as const,
    label: "Örnek görünüm",
    holder: "SANALKART",
    pan: makePan(100_000_042),
    expiry: "12/29",
    cvv: makeCvv(100_000_042),
    status: "aktif" as const,
  };

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07060bcc] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Mark />
            SanalKart
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-white/75 md:flex">
            <a href="#turler">Türler</a>
            <a href="#nasil">Nasıl işler</a>
            <a href="#fiyat">Vitrin</a>
            <a href="#sorular">Sorular</a>
          </nav>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link href="/panel" className="btn btn-gold">
                Panele git
              </Link>
            ) : (
              <>
                <Link href="/giris" className="btn btn-ghost px-3 py-2 text-sm">
                  Giriş
                </Link>
                <Link href="/kayit" className="btn btn-gold px-3 py-2 text-sm">
                  Hesap aç
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="marquee">
        <div className="marquee-track text-xs tracking-[0.22em] text-gold">
          <span>{TICKER.repeat(4)}</span>
          <span>{TICKER.repeat(4)}</span>
        </div>
      </div>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-gold">SİMÜLASYON STÜDYOSU</p>
            <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Her iş için ayrı bir sanal kart.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Kampanya, pazar yeri, abonelik ve seyahat provasını aynı cüzdanda tut. SanalKart
              kart basar, tavan koyar, dondurur ve işlem dökümü tutar — tamamen simülasyon olarak.
              Kasaya gerçek para girmez.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={loggedIn ? "/panel" : "/kayit"} className="btn btn-gold">
                {loggedIn ? "Panele dön" : "Ücretsiz prova aç"}
              </Link>
              <Link href="/giris" className="btn btn-ghost">
                Demo ile bak
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-3 text-sm">
              {[
                ["400000", "test BIN"],
                ["4", "kart türü"],
                ["0 ₺", "gerçek tahsilat"],
              ].map(([value, label]) => (
                <div key={label} className="glass rounded-2xl px-3 py-3">
                  <dt className="font-display text-xl font-bold text-gold">{value}</dt>
                  <dd className="text-white/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mx-auto w-full max-w-[460px]">
            <TiltCard>
              <VirtualCard card={sample} />
            </TiltCard>
            <p className="mt-4 text-center text-sm text-white/60">
              Örnek görünüm. Numara demo verisidir ve gerçek üye işyerinde geçmez.
            </p>
          </div>
        </section>

        <section id="turler" className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-mint">TÜRLER</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Dört ayrı sahne</h2>
            <p className="mt-3 text-white/70">
              Her türün kendi tavanı vardır. Hiçbiri canlı bir ağa bağlanmaz; panelde birbirinden
              ayrı dururlar ki prova karışmasın.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {CARD_TYPE_ORDER.map((id) => (
              <article key={id} className="glass rounded-[24px] p-5">
                <p className="font-display text-2xl font-bold">{CARD_TYPES[id].name}</p>
                <p className="mt-1 text-sm text-gold">{CARD_TYPES[id].pitch}</p>
                <p className="mt-3 text-white/75">{CARD_TYPES[id].scene}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Dört adımda prova</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="glass rounded-[24px] p-5">
                <p className="font-display text-3xl font-extrabold text-gold">{step.n}</p>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="fiyat" className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-gold">VİTRİN</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Fiyatlar örnektir</h2>
            <p className="mt-3 text-white/70">
              Rakamlar paneldeki plan adını anlatır. Bu sürümde tahsilat yapılmaz, kart
              gönderilmez, fatura kesilmez.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((id) => {
              const plan = PLANS[id];
              const featured = id === "atolye";
              return (
                <article
                  key={id}
                  className={`rounded-[24px] p-5 ${featured ? "bg-gradient-to-b from-[#3a2a14] to-[#14110c] ring-1 ring-gold" : "glass"}`}
                >
                  <p className="text-sm text-white/60">{featured ? "Demo hesap bu planda" : "Simülasyon planı"}</p>
                  <h3 className="font-display mt-2 text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-3 font-display text-4xl font-extrabold text-gold">{plan.price}</p>
                  <p className="text-sm text-white/55">{plan.period}</p>
                  <p className="mt-4 text-sm text-white/75">{plan.blurb}</p>
                  <p className="mt-3 text-sm">En fazla {plan.cardLimit} açık kart</p>
                  <Link href="/kayit" className="btn btn-gold mt-6 w-full">
                    Simülasyon hesabı aç
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section id="sorular" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Merak edilenler</h2>
          <div className="mt-6 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="glass rounded-2xl p-4">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-3 text-sm text-white/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-display font-bold">
            <Mark className="h-7 w-7" />
            SanalKart
          </div>
          <p className="max-w-xl text-sm text-white/55">
            Banka değil. Kart kuruluşu değil. Simülasyon. Basılan numaralar 400000 test
            aralığındadır, SİMÜLASYON rozeti taşır ve gerçek üye işyerinde kullanılamaz.
          </p>
        </div>
      </footer>
    </div>
  );
}

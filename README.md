# CLAY Sanal Kart Hizmetleri

CLAY, Facebook Ads, TikTok, Google Ads ve Ultima senaryoları için **simülasyon** sanal kart panelidir. Tam ad **CLAY Sanal Kart Hizmetleri**. Gerçek kart basılmaz, gerçek ödeme alınmaz, hiçbir kart gerçek üye işyerinde kullanılamaz.

Bu bir banka veya kart kuruluşu değildir. Kimlik doğrulama, 3-D Secure ve ödeme sağlayıcısı yoktur.

## Çalıştırma

Node.js 20 veya üstü gerekir.

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

Veriler sunucuda `data/sanalkart.json` dosyasına yazılır. Dosyayı silmek demo hesabı ve tüm simülasyon defterini sıfırlar.

## Demo giriş

- Kullanıcı adı: `demo`
- Parola: `demo123`

Demo hesapta bakiye, birkaç kart ve işlem dökümü hazır gelir. Yeni hesaplar kullanıcı adı, parola ve parola tekrar ile açılır. Kıvılcım planında 1.500 ₺ hoş geldin bakiyesi yazılır. Bu tutar da simülasyondur. Demo kullanıcı yönetim masasına giremez.

İki hazır giriş vardır: üye `demo` / `demo123` ve yönetici `admin` / `admin123`.

## Yönetici girişi

Yönetim masası da simülasyondur. Bakiye düzeltmesi, kart dondurma ve hesap askıya alma yalnızca yerel deftere yazılır. Kimlik belgesi, gerçek kart veya tahsilat yoktur.

- Adres: [http://localhost:3000/admin](http://localhost:3000/admin)
- Kullanıcı adı: `admin`
- Parola: `admin123`

Askıya alınan hesap giriş yapamaz. Yönetici kendi hesabını askıya alamaz. Yönetici hesabı üye paneline girmez.

Üye listesindeki kullanıcı adı, o hesabın kartlarını, harcama ve limit tutarlarını, işlem dökümünü ve son yükleme zamanını açar. Listede ve detayda hesap numarası ile güncel parola düz metin görünür. Üye parolasını Hesap sayfasından değiştirince yönetim masasında yeni değer görünür. Yönetici bakiye, kart etiketi, limit, kart durumu, işlem tutarı ve son yükleme zamanını düzenleyebilir. Bildirimler bölümünden bir üyeye veya tüm üyelere başlık ve mesaj yazılır. Üye panelinde okunmamış sayısı görünür; okundu saymak ayrıca bir düğmedir. Yönetici kimin aldığını ve kaçının okuduğunu görür.

Her kart türünün listesinde etiket «Test öneki» ve rakam `400000` hazırdır. Yönetici satır ekler, düzeltir, siler veya etiket ile rakamı satır satır yapıştırır. Aynı türde aynı rakam iki kez durmaz. Üye kart basarken yalnızca seçtiği türün listesini görür ve bir satır seçmeden kart oluşmaz. Gelişigüzel numara sorgulama yoktur. Harcama provası yalnızca o kart türünün işletme listesinden yazılır.

## Kartlar hakkında

Türler: Facebook Ads, TikTok, Google Ads ve Ultima. Bunlar senaryo etiketidir; Google, Meta, TikTok veya başka bir kuruluşla iş ortaklığı yoktur. Her türün kendi simülasyon basım ücreti vardır.

Basılan demo numaraları ayrılmış test öneki (`400000`) ile üretilir. Kartın ad yerinde Clay yazar. Bu numaralar gerçek ödeme aracı değildir; üye işyerinde kullanılamaz. Çalışan kart dışa aktarma yoktur.

Vitrindeki fiyatlar örnektir, tahsilat yapılmaz.

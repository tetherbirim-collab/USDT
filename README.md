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

## cPanel

`clay-sanal-kart.zip` dosyasını cPanel Dosya Yöneticisinde `public_html` içine yükle ve Extract de. Zip’in kökünde `index.php` vardır; site alan adında açılır. `node_modules` kurmak gerekmez.

Defter tarayıcıda durur. İlk açılışta hazır hesap vardır: `demo` / `demo123`, yönetici `admin` / `admin123`.

## Hazır giriş

- Kullanıcı adı: `demo`
- Parola: `demo123`

Hazır hesapta bakiye, birkaç kart ve işlem dökümü hazır gelir. Yeni hesaplar görünen ad, kullanıcı adı, parola ve parola tekrar ile açılır. Görünen ad kartın üzerine yazılır; Hesap sayfasından değiştirilebilir. Kıvılcım planında 1.500 ₺ hoş geldin bakiyesi yazılır. Bu tutar da simülasyondur. Üye hesabı yönetim masasına giremez.

İki hazır giriş vardır: üye `demo` / `demo123` ve yönetici `admin` / `admin123`.

## Yönetici girişi

Yönetim masası da simülasyondur. Bakiye düzeltmesi, kart dondurma ve hesap askıya alma yalnızca yerel deftere yazılır. Kimlik belgesi, gerçek kart veya tahsilat yoktur.

- Adres: [http://localhost:3000/admin](http://localhost:3000/admin)
- Kullanıcı adı: `admin`
- Parola: `admin123`

Askıya alınan hesap giriş yapamaz. Yönetici kendi hesabını askıya alamaz. Yönetici hesabı üye paneline girmez.

Üye listesindeki kullanıcı adı, o hesabın kartlarını, harcama ve limit tutarlarını, işlem dökümünü ve son yükleme zamanını açar. Listede ve detayda hesap numarası ile güncel parola düz metin görünür. Üye parolasını Hesap sayfasından değiştirince yönetim masasında yeni değer görünür. Yönetici bakiye, kart etiketi, limit, kart durumu, işlem tutarı ve son yükleme zamanını düzenleyebilir. Bildirimler bölümünden bir üyeye veya tüm üyelere başlık ve mesaj yazılır. Üye panelinde okunmamış sayısı görünür; okundu saymak ayrıca bir düğmedir. Yönetici kimin aldığını ve kaçının okuduğunu görür.

Her kart türünün listesinde etiket «Test öneki» ve rakam `400000` hazırdır. Tür boş kalırsa bu satır kendiliğinden geri gelir. Yönetici satır ekler, düzeltir, siler veya etiket ile rakamı satır satır yapıştırır. Aynı türde aynı rakam iki kez durmaz. Üye kart basarken yalnızca seçtiği türün listesini görür ve bir satır seçmeden kart oluşmaz. Satın alma önizlemesinde BIN kalır, kalan haneler X olur. Örnek: 42330 seçilirse önizleme 4233 0XXX XXXX XXXX görünür. Kart oluşunca 16 hane yazılır. Visa veya Mastercard işareti BIN’in ilk rakamına göre değişir. Yönetici 4–8 rakamlık satır ekler. Gelişigüzel numara sorgulama yoktur. Harcama provası yalnızca o kart türünün işletme listesinden yazılır. Üye kendi kartına simülasyon iadesi yazabilir ve dolan tavanı yenileyebilir. Yüzde 80 uyarısındaki düğme de tavanı yeniler; cüzdanı geri yüklemez. Dolar tutarı ayrı bir bakiyede durur, sabit satış kuruyla liraya çevrilince fişte ikisi de görünür. Yeni kart kısa süre «hazırlanıyor» siparişinde kalır. Siparişler sayfasından iptal edilebilir; kapanışta basım ücreti bakiyeye döner. Üye Hesap sayfasından vitrin planını değiştirir. Ödemeler ekranı her harcamanın gittiği yeri kart, miktar ve durumla gösterir. Aynı süzgeç CSV ve XLSX olarak iner. Kartın altında kendi hareketi durur. Kart detayında numara, son kullanma, CVV ve o hesabın adresi kopyalanır; Gizle hepsini kapatır. Adres Hesap sayfasından yazılır ve başka hesapta görünmez. Sonraki kart ödemesi, basım tarihinden otuz gün sonrası olarak yazılan bir simülasyon tarihidir. Açık kartlar arasında kalan tavan aktarılır. Her aktarımda %2 komisyon kesilir ve cüzdan tutarı değişmez.

## Kartlar hakkında

Türler: Facebook Ads, TikTok, Google Ads ve Ultima. Bunlar senaryo etiketidir; Google, Meta, TikTok veya başka bir kuruluşla iş ortaklığı yoktur. Her türün kendi simülasyon basım ücreti vardır.

Basılan numaralar ayrılmış test öneki (`400000`) ile üretilir. Kartın ad yerinde o hesabın adı yazar. Harcama, basım ve yükleme yalnızca işlemi yapan kullanıcının bakiyesinden düşer. Bu numaralar gerçek ödeme aracı değildir; üye işyerinde kullanılamaz. Çalışan kart dışa aktarma yoktur.

Vitrindeki fiyatlar örnektir, tahsilat yapılmaz.

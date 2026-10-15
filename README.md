# CLAY Sanal Kart Hizmetleri

CLAY, Facebook Ads, TikTok, Google Ads ve Ultima kartları için sanal kart panelidir. Tam ad **CLAY Sanal Kart Hizmetleri**.

Tutar dolar olarak girilir. Bakiye yükleme Heleket faturası açar. Ödeme onaylanınca bakiyede yalnız sabit kurun TL karşılığı durur. Kur 15 Eki 2026 için 1 USD = 49,3929 TL olarak sabittir. Bu bakiye kart harcamasında kullanılır.

Heleket anahtarları `heleket.config.php` içine yazılır. `merchant` Heleket ayarlarındaki UUID, `payment_key` ödeme API anahtarıdır. Ödeme anahtarı tarayıcıya gitmez. Dosya web’den kapalıdır. Anahtarlar boşsa yükleme sayfası fatura açmaz.

## Çalıştırma

Node.js 20 veya üstü gerekir.

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## cPanel

`clay-sanal-kart.zip` dosyasını cPanel Dosya Yöneticisinde `public_html` içine yükle ve Extract de. Zip’in kökünde `index.php` vardır; site alan adında açılır. `node_modules` kurmak gerekmez. Extract’ten sonra `heleket.config.php` içine merchant UUID ve ödeme anahtarını yaz. Heleket geri bildirimi `https://alanadin/api/heleket.php` adresine düşer.

Defter sunucuda `api/clay-ledger.json` dosyasındadır. Her tarayıcı aynı bakiyeyi görür. Dosya web’den kapalıdır. Heleket ödemesi onaylanınca bakiye bu deftere bir kez yazılır. PHP çalışmazsa o tarayıcı kendi kaydına döner. İlk açılışta hazır hesap vardır: `demo` / `demo123`. Yönetici girişi `clayadmin` / `clayadmin` ve adresi `/bunugizliyapki` olur. Bu adres üye menüsünde yoktur.

## Hazır giriş

- Kullanıcı adı: `demo`
- Parola: `demo123`

Hazır hesapta bakiye, birkaç kart ve işlem dökümü hazır gelir. Yeni hesaplar kullanıcı adı ve parola ile açılır. Kartın üzerindeki ad, kart oluşturulurken verilir. Kıvılcım planında 30 USD karşılığı hoş geldin bakiyesi yazılır. Üye hesabı yönetim masasına giremez.

İki hazır giriş vardır: üye `demo` / `demo123` ve yönetici `clayadmin` / `clayadmin`.

## Yönetici girişi

Bakiye düzeltmesi, kart dondurma ve hesap askıya alma yerel deftere yazılır. Yönetici tutarı dolar olarak girer; ekranda TL karşılığı durur.

- Adres: `/bunugizliyapki` (üye menüsünde yok; `/admin` bu masayı açmaz)
- Kullanıcı adı: `clayadmin`
- Parola: `clayadmin` (Hesap sekmesinden değişir)

Askıya alınan hesap giriş yapamaz. Yönetici kendi hesabını askıya alamaz. Yönetici hesabı üye paneline girmez.

Üye listesindeki kullanıcı adı, o hesabın kartlarını, harcama ve kullanılabilir bakiye tutarlarını, işlem dökümünü ve son yükleme zamanını açar. Listede ve detayda hesap numarası ile güncel parola düz metin görünür. Üye parolasını Hesap sayfasından değiştirince yönetim masasında yeni değer görünür. Yönetici bakiye, kart adı, kullanılabilir bakiye, kart durumu, işlem tutarı ve son yükleme zamanını düzenleyebilir. Bildirimler bölümünden bir üyeye veya tüm üyelere başlık ve mesaj yazılır. Üye panelinde okunmamış sayısı görünür; okundu saymak ayrıca bir düğmedir. Yönetici kimin aldığını ve kaçının okuduğunu görür.

Her kart türünün listesinde etiket «Standart» ve rakam `400000` hazırdır. Tür boş kalırsa bu satır kendiliğinden geri gelir. Yönetici satır ekler, düzeltir, siler veya etiket ile rakamı satır satır yapıştırır. Aynı türde aynı rakam iki kez durmaz. Üye kart basarken yalnızca seçtiği türün listesini görür ve bir satır seçmeden kart oluşmaz. Satın alma önizlemesinde BIN kalır, kalan haneler X olur. Örnek: 42330 seçilirse önizleme 4233 0XXX XXXX XXXX görünür. Kart oluşunca 16 hane yazılır. Visa veya Mastercard işareti BIN’in ilk rakamına göre değişir. Yönetici 4–8 rakamlık satır ekler. Harcama o kart türünün işletme listesinden yazılır. Üye kendi kartına iade yazabilir ve dolan kullanılabilir bakiyeyi yenileyebilir. Yenilemek cüzdan tutarını değiştirmez. Yeni kart kısa süre «hazırlanıyor» siparişinde kalır. Siparişler sayfasından iptal edilebilir; kapanışta basım ücreti bakiyeye döner. Üye Hesap sayfasından vitrin planını değiştirir. Plan gerçekten değişince o planın dolar fiyatı bakiyeden düşer. Aynı planı kaydetmek ve yeni hesap açmak ücret kesmez. Ödemeler ekranı her harcamanın gittiği yeri kart, tutar ve durumla gösterir. Aynı süzgeç CSV ve XLSX olarak iner. Kartın altında kendi hareketi durur. Kart detayında numara, son kullanma, CVV ve o hesabın adresi kopyalanır; Gizle hepsini kapatır. Adres Hesap sayfasından yazılır ve başka hesapta görünmez. Sonraki kart ödemesi her 30 günde bir kart bedeli kadar bakiyeden düşer. Bakiye yetmezse kart kapanmaz, ödeme tarihi görünür kalır. Açık kartlar arasında kullanılabilir bakiye aktarılır. Her aktarımda %4 komisyon kesilir ve cüzdan tutarı değişmez.

## Kartlar

Türler: Facebook Ads, TikTok, Google Ads ve Ultima. Kart bedeli 300₺. Karta ayrılan tutardan %7,3 komisyon kesilir. Kartlar arası aktarımda karşı karta %4 yazılır. Ana bakiyeye Heleket yüklemesinde bu komisyonlar yoktur.

Numaralar `400000` öneki ile üretilir. Kartın ad yerinde, oluşturulurken verilen ad yazar. Harcama, basım ve yükleme yalnızca işlemi yapan kullanıcının bakiyesinden düşer.

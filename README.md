# CLAY Sanal Kart Hizmetleri

CLAY, reklam ve çevrimiçi alışveriş senaryoları için **simülasyon** sanal kart panelidir. Tam ad **CLAY Sanal Kart Hizmetleri**. Gerçek kart basılmaz, gerçek ödeme alınmaz, hiçbir kart gerçek üye işyerinde kullanılamaz.

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

Üye listesindeki kullanıcı adı, o hesabın kartlarını, harcama ve limit tutarlarını, işlem dökümünü ve son yükleme zamanını açar. Listede ve detayda hesap numarası ile güncel parola düz metin görünür. Yönetici bakiye, kart etiketi, limit, kart durumu, işlem tutarı ve son yükleme zamanını düzenleyebilir. Bildirimler bölümünden bir üyeye veya tüm üyelere başlık ve mesaj yazılır; mesaj üye panelindeki Bildirimler sayfasında görünür.

Her kart türünün BIN listesi boş başlar. Yönetici etiket ve 6–8 rakamlık BIN satırı ekler, düzeltir veya siler. Üye kart basarken yalnızca seçtiği türün listesini görür ve bir satır seçmeden kart oluşmaz. Gelişigüzel numara sorgulama yoktur.

## Kartlar hakkında

Türler: Reklam, Alışveriş kartı, Abonelik, Seyahat, Ultima, Google Ads, Facebook Ads, Facebook ve TikTok. Bunlar senaryo etiketidir; Google, Meta, TikTok veya başka bir kuruluşla iş ortaklığı yoktur. Her türün kendi simülasyon basım ücreti vardır.

Basılan numaralar ayrılmış test BIN (`400000`) ile üretilen sahte demo verileridir. Kartın üzerinde ve panelde **SİMÜLASYON** ibaresi bulunur. Bu numaralar gerçek ödeme aracı değildir; üye işyerinde kullanılamaz. Çalışan kart dışa aktarma yoktur.

Vitrindeki fiyatlar örnektir, tahsilat yapılmaz.

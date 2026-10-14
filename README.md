# SanalKart

SanalKart, reklam ve çevrimiçi alışveriş senaryoları için **simülasyon** sanal kart panelidir. Gerçek kart basılmaz, gerçek ödeme alınmaz, hiçbir kart gerçek üye işyerinde kullanılamaz.

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

- E-posta: `demo@sanalkart.local`
- Parola: `demo123`

Demo hesapta bakiye, birkaç kart ve işlem dökümü hazır gelir. Yeni hesaplar Kıvılcım planında açılır ve 1.500 ₺ hoş geldin bakiyesi alır. Bu tutar da simülasyondur.

## Kartlar hakkında

Basılan numaralar ayrılmış test BIN (`400000`) ile üretilen sahte demo verileridir. Kartın üzerinde ve panelde **SİMÜLASYON** ibaresi bulunur. Bu numaralar gerçek ödeme aracı değildir; üye işyerinde kullanılamaz. Çalışan kart dışa aktarma yoktur.

Vitrindeki fiyatlar örnektir, tahsilat yapılmaz.

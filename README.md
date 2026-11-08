# TYRO AI — demo

**https://tyroai.github.io**

TYRO AI kurumsal çalışma alanının, **tamamen kurgusal veriyle** çalışan ve hiçbir kurum sistemine
bağlanmayan demosu. Anasayfa, Keşfet, Takvim, To-Do, Sohbet (asistanlar), Self Servis ve Ticket
sayfaları çalışır; posta, takvim, görev, dosya ve İK verilerinin hepsi tarayıcıda üretilir.

**Canlı olan tek şey, herkese açık ve anahtarsız kaynaklardır:** header'daki Tyrofy radyosu
([Radio Browser](https://www.radio-browser.info) istasyon dizini + istasyonların kendi akışları) ve
Piyasa widget'ı (kurlar ve altın: [Truncgil](https://finans.truncgil.com), TCMB/AB kurları:
[Frankfurter](https://frankfurter.dev), CFTC pozisyon raporu). Bu kaynaklara ulaşılamazsa Piyasa
kurgusal rakamlara döner. Hava durumu kurgusaldır.

> **Tüm kişi, firma, rakam ve içerik uydurmadır.** Gerçek bir şirket, kişi ya da sistemle ilgisi yoktur.
> Kullanıcı: Ömer Gümüş, Satış Yöneticisi, TYRO Tech (kurgusal).

## Veri setleri

Başlıktaki veritabanı simgesinden veri seti değiştirilir. Ad, unvan ve şirket her sette aynı kalır;
müşteriler, ürünler, takvim, posta, görevler, dosyalar ve asistan yanıtları sektöre göre değişir.

| Veri seti | Adres parametresi |
|---|---|
| Ana (karma B2B) | `?set=ana` |
| Beyaz Eşya | `?set=beyaz-esya` |
| Teknoloji | `?set=teknoloji` |
| Tarım | `?set=tarim` |
| Otomotiv | `?set=otomotiv` |
| Gıda & İçecek | `?set=gida-icecek` |
| Sağlık & İlaç | `?set=saglik` |

Örnek: `https://tyroai.github.io/?set=tarim`

## Nasıl çalışır

- Giriş (Entra ID/MSAL) sahte bir oturumla değişir; kullanıcı her zaman açık.
- Microsoft Graph, Dataverse ve Copilot çağrıları tarayıcıda yakalanır ve `demo/` altındaki veri
  setlerinden yanıtlanır (`demo/mock/`). Uygulama kodu bunu fark etmez.
- Tarih ve saatler "bugüne" göre üretilir; demo hangi gün açılırsa açılsın güncel görünür.
- Hava, kur ve piyasa verileri de kurgusaldır.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

```bash
npm run build   # dist/ üretir
npm run scan    # sızıntı denetimi (gerçek kurum verisi var mı)
```

## Depo yapısı

| Yol | İçerik |
|---|---|
| `src/`, `public/`, `index.html` | Uygulama. **Üretilmiştir**; elle düzenlenmez, `npm run sync` ile yenilenir |
| `demo/` | Elle yazılan her şey: sahte giriş (`shims/`), sahte backend (`mock/`), veri setleri (`datasets/`), kurgusal içerik (`overlay/`) |
| `scripts/` | `sync` (kaynaktan uyarlama), `leak-scan` (sızıntı denetimi), `check-dataset` (veri seti doğrulayıcı) |
| `.github/workflows/` | GitHub Pages dağıtımı |

Veri seti eklemek ya da düzenlemek için `demo/datasets/sets/ana.js` örnek alınır;
`node scripts/check-dataset.mjs <kimlik>` şemayı denetler.

## Görseller

- **Keşfet gönderi görselleri** (`demo/overlay/public/images/posts/`) telifsiz
  [Unsplash](https://unsplash.com/license) fotoğraflarıdır; kaynak kimlikleri
  `CREDITS.md` içindedir. Hangi gönderiye hangi fotoğrafın geleceği başlığa göre
  `demo/state.js` içindeki `COVER_RULES` ile seçilir; tek bir gönderiyi sabitlemek için
  veri setinde `image: "<anahtar>"` (ya da `image: false`) verilir.
- **Kişi fotoğrafları:** yalnız Ömer'in fotoğrafı vardır. Kadrodan birine gerçek yüz koymak için
  `demo/overlay/public/images/people/<ad-soyad>.jpg` (örn. `selin-aydin.jpg`) eklenir; yoksa baş harfler çizilir.

## Lisans

MIT, bkz. [LICENSE](LICENSE).

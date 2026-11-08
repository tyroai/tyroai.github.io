/**
 * Tyrofy'ın istasyon düzeltmeleri — anahtar `brandKey` (aynı istasyonun kopyaları birlikte).
 */

/** Listede (ve favorilerde) gösterilmeyen istasyonlar (ürün sahibinin kararı). */
export const RADIO_HIDDEN = new Set([
  "ahaber",
  "turkuvaz",
  "1021arabeskinmerkezi",
  "arabeskinmerkezi",
  "kalp",
  "govend",
  "azadi",
  "kurd1",
  "akra",
])

/**
 * Kaynakta yanlış ya da dağınık adla duran istasyonlar: ham adın anahtarı → doğru ad.
 * "KRAL POP ALTERNATİF 2" Kral Pop'un kendi akışı (`smil:kralpop`); kaynaktaki "KRAL POP" kaydı
 * ise Kral FM'in akışını çalıyor, aynı akış olarak elenir (`playableStations`).
 */
export const RADIO_NAMES = {
  kralpopalternatif2: "Kral Pop",
  max958maximummusic: "Max FM",
}

/**
 * Kaynağın (Radio Browser) görseli olmayan, bozuk ya da çok küçük olan istasyonların
 * logoları — `public/radio-logos/<anahtar>.png`, 192×192, hazır kare (kapak tam kaplar).
 * Anahtar `brandKey`: aynı istasyonun kopyaları aynı logoyu alır. Her logo resmî kaynağından
 * alındı ve ayrı bir denetimle istasyonla eşleştirildi; kaynaklar
 * docs/features/widgetlar-radyo.md › Logolar.
 */
export const RADIO_LOGOS = new Set([
  "45likyeni",
  "90larpop",
  "baba",
  "cnnturk",
  "damarturk",
  "diyanet",
  "fenomen",
  "fenomenturk",
  "houseland",
  "joy",
  "joyturk",
  "kafa",
  "kralpop",
  "kralturk",
  "max",
  "metro",
  "number1",
  "palnostalji",
  "palstation",
  "powerturk",
  "powerturkdans",
  "seymen",
  "siran",
  "slowturk",
  "super",
  "super2",
  "trtkurdi",
  "trtnagme",
  "trtturku",
  "turkiyem",
  "virgin",
])

/**
 * Öne çıkan istasyonlar — ürün sahibinin seçtiği büyük markalar, listenin başında bu sırayla
 * (`withFeatured`). Kaynakta (Radio Browser) aynı anahtarla varsa o kayıt kullanılır, yalnız adı
 * buradaki gibi yazılır; yoksa (ya da kaynakta yalnız HTTP yayını varsa) buradaki resmî HTTPS
 * adres. Adresler istasyonun kendi oynatıcısından; Chromium ve WebKit'te çaldığı ölçüldü.
 */
export const RADIO_EXTRA = {
  TR: [
    {
      name: "Joy FM",
      // Triton'un JOY_FM'e bağladığı yüksek kalite (HE-AAC 128k); kaynakta yalnız HTTP vardı.
      url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM128AAC.aac",
      codec: "AAC+",
      bitrate: 128,
      tags: ["pop"],
    },
    {
      name: "Number1 FM",
      // numberone.com.tr'nin kendi oynatıcısı; kaynakta yalnız alt kanallar vardı.
      url: "https://ssldyg2.radyotvonline.com/live/numberonefm.stream/playlist.m3u8",
      hls: true,
      codec: "AAC",
      bitrate: 128,
      tags: ["pop"],
    },
    // Kaynakta var ("Metro fm turkey", StreamTheWorld): yukarı taşınır, adı düzelir.
    { name: "Metro FM" },
    {
      name: "Virgin Radio",
      // Karnaval'ın resmî oynatıcısının çaldığı mount (HE-AAC 128k); kaynaktaki "VİRGİN RADYO"
      // başka bir mount'u (ITUNES) çalıyordu, ana kaydı da yalnız HTTP.
      url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO128AAC.aac",
      codec: "AAC+",
      bitrate: 128,
      tags: ["hip-hop"],
    },
    {
      name: "Pal Nostalji",
      // Pal Digital'in ana sunucusu (edge adresi Chromium'da parçaları başka sunucudan alıyor).
      url: "https://moondigitalmaster.radyotvonline.net/palnostalji/playlist.m3u8",
      hls: true,
      codec: "AAC+",
      bitrate: 128,
      tags: ["nostalji"],
    },
    {
      name: "Pal Station",
      url: "https://moondigitalmaster.radyotvonline.net/palstation/playlist.m3u8",
      hls: true,
      codec: "AAC+",
      bitrate: 128,
      tags: ["hits"],
    },
  ],
}

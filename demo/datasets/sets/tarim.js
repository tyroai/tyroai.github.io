// TARIM veri seti — sertifikalı tohum, gübre, bitki koruma ve toptan emtia (buğday, mısır, ayçiçeği,
// baklagil, fındık) satan bir tarım işletmesinin satış yöneticisi haftası. Kasım: kışlık ekim, gübre ön
// siparişleri, hasat sonu tahsilatlar ve depolama dönemi.
// Tüm kişi, firma ve rakamlar KURGUSALDIR.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quotaTon: "15.600", // Q4 hedefi (ton)
  achievedTon: "9.980", // gerçekleşen (ton)
  quota: "218", // Q4 hedefi (milyon TL)
  achieved: "139,5", // gerçekleşen (milyon TL)
  achievedPct: 64,
  pipeline: "168,0", // açık pipeline (milyon TL)
  openDeals: 27,
  winRate: 34,
  closedWeek: "12,4", // bu hafta kapanan (Yeşilırmak 5,6 + Karasu ilk parti 6,8)
  tahsilatTarget: "120", // Q4 tahsilat hedefi
  tahsilat: "78,0",
  tahsilatPct: 65,
  overdue: "6,9", // vadesi geçmiş alacak
  siloTon: "34.080",
  siloCap: "48.000",
  siloPct: 71,
}

const KB = "Kızılvadi Tarım Kooperatifleri Birliği"
const CB = "Çukurova Bölge Bayi Ağı A.Ş."
const OU = "Ovasan Un Sanayi A.Ş."
const AY = "Altınbaşak Yağ Sanayi A.Ş."
const YC = "Yeşilırmak Çiftçi Birliği"
const KY = "Karasu Yem ve Mısır Sanayi A.Ş."
const FI = "Kuzey Anadolu Fındık İhracat Ltd."
const BT = "Başoba Tahıl ve Baklagil İhracat A.Ş."

export default defineDataset({
  id: "tarim",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Ton ve ciro hedefi, ön sipariş, bayi tahsilatı ve emtia fiyatı sorularını yanıtlar; haftalık sezon özeti hazırlar.",
  agents: [
    {
      name: "tyroTrader",
      type: "agent",
      description: "Emtia ve döviz piyasasını izler; fiyat ve parite sorularını yanıtlar.",
      agentId: "crfc1_tyroTrader",
      icon: "ChartHistogramIcon",
    },
  ],
  apps: [
    { name: "tyroForecast", type: "ai", description: "Bölge bazlı talep ve verim tahmini.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Ön sipariş, bayi ve alım sözleşmeleri için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Tohum, gübre ve emtia fiyatı ile iskonto simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Bayi, birlik ve çiftçi içgörüleri; hesap özetleri.", icon: "Telescope02Icon" },
    { name: "tyroSilo", type: "ai", description: "Silo doluluğu, parti kalitesi ve sevkiyat önceliği önerileri.", icon: "Package01Icon" },
    { name: "Bayi Portalı", type: "business", description: "Bayi sipariş, kredi limiti ve tahsilat takibi", url: "#", icon: "Target02Icon" },
  ],

  weather: {
    now: "fair",
    base: 13,
    amp: 6,
    moods: ["fair", "partlycloudy", "cloudy", "lightrain", "rain", "cloudy", "fair", "lightrain", "partlycloudy", "rain"],
  },
  market: { rates: { USD: 44.2, EUR: 51.3, GBP: 58.1, CHF: 54.7 }, bist: 11340 },

  // ───────────── takvim ─────────────
  meetings: [
    {
      title: "Haftalık satış ve sezon toplantısı",
      recur: "weekly",
      weekday: 1,
      time: "09:30",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Geçen haftanın ton ve ciro gerçekleşmesi, ön sipariş durumu, tahsilat takibi ve bu haftanın saha öncelikleri.",
    },
    {
      title: "Saha günlük 15 dk",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Kısa durum turu: dünkü sevkiyat ve kantar kayıtları, bugünkü bayi görüşmeleri, engeller.",
    },
    {
      title: "Bayi kredisi ve tahsilat toplantısı",
      recur: "weekly",
      weekday: 3,
      time: "11:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 2",
      organizer: "Can Yıldız",
      with: ["Ömer Gümüş", "Derya Çelik", "Onur Polat"],
      body: "Vadesi gelen çek ve senetler, bayi kredi limitleri ve gecikmiş alacaklar için aksiyon listesi.",
    },
    {
      title: "Emtia fiyat ve parite değerlendirmesi",
      recur: "weekly",
      weekday: 2,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Can Yıldız",
      with: ["Ömer Gümüş", "Mert Aksoy", "Elif Kaya"],
      body: "Buğday, mısır ve ayçiçeği borsa fiyatları, gübre fiyat endeksi ve EUR/USD paritesinin haftalık yorumu.",
    },
    {
      title: "Pipeline ve ön sipariş gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık fırsatların aşama, olasılık ve teslim tarihi kontrolü. Tohum ve gübre ön siparişleri ayrıca izlenir.",
    },
    { title: `${OU} — buğday alım teklifi sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Necati Karaca (${OU})`, "Zeynep Acar", "Mert Aksoy"], body: "1.800 ton ekmeklik buğday teklifinin son sunumu. Protein ve hektolitre şartnamesi, fiyat primi ve teslim takvimi konuşulacak." },
    { title: `${CB} — gübre ön sipariş müzakeresi`, day: 1, time: "10:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Fatma Güleç (${CB})`, "Zeynep Acar", "Can Yıldız"], body: "620 ton DAP ve üre ön siparişinin vade, kredi limiti ve ilkbahar teslim takvimi maddeleri." },
    { title: "Q4 hedef ve sezon değerlendirmesi", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Çeyrek sonu ton ve ciro gerçekleşmesi, tahsilat durumu ve kalan altı haftanın aksiyon planı." },
    { title: "2027 ekim sezonu strateji çalıştayı (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "2027 ekim sezonu ürün, fiyat ve bayi stratejisi çalıştayı. Katılımınızı bekliyoruz." },
    { title: `${AY} — ayçiçeği sözleşmeli üretim görüşmesi`, day: 3, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Sevgi Aral (${AY})`, "Deniz Arslan", "Elif Kaya"], body: "1.000 ton yağlık ayçiçeği için ham yağ endeksine bağlı fiyat formülü ve yağ oranı şartı." },
    { title: `${FI} — ihracat sevkiyatı ve parite görüşmesi`, day: 4, time: "09:45", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Emine Taşkın (${FI})`, "Can Yıldız"], body: "85 ton fındık sevkiyatı için EUR fiyatı, kur varsayımı ve konteyner yükleme tarihi." },
    { title: "Tarım teknolojileri eğitimi: hassas gübreleme", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat"], body: "TYRO Eğitim: değişken oranlı gübreleme, toprak analizi okuma ve bayilere teknik anlatım." },
    { title: `${BT} — nohut sevkiyat planı`, day: 6, time: "16:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Burak Eryılmaz (${BT})`, "Mert Aksoy"], body: "420 ton nohut için kalibre ve nem şartı, numune analizi ve yükleme tarihi." },
    { title: "Bölge çiftçi toplantısı — Konya Ovası", day: 8, allDay: true, where: "Konya", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir", "Gizem Tunç"], body: "Üç ilçeden yaklaşık 180 çiftçiyle kışlık ekim, tohum çeşitleri ve ilkbahar gübre ön siparişi buluşması." },
    // geçmiş
    { title: `${YC} — sözleşme imza toplantısı`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Cemal Yurdakul (${YC})`, "Zeynep Acar"], body: "Tohum, gübre ve bitki koruma paketi (5,6 M₺) sözleşmesinin imzası ve teslim programı." },
    { title: `${KY} — mısır fiyat müzakeresi`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Gülay Sezer (${KY})`, "Mert Aksoy"], body: "İlk parti 570 ton mısırın teslim takvimi ve nem toleransı." },
    { title: "Ekip 1:1 — Onur Polat", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Bayi hedefi, vadesi geçmiş alacaklar ve kanal gelişim planı." },
    { title: "Silo kalite denetimi", day: -4, time: "10:00", minutes: 90, where: "Lisanslı depo · Silo A", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Mert Aksoy", "Deniz Arslan"], body: "Silo partilerinde nem, protein ve hektolitre kontrolü; kalite sınıfına göre ayrım." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Necati Karaca (${OU})`,
      subject: "Re: Ekmeklik buğday alım teklifi",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Teklifinizi alım komitesiyle değerlendirdik. Şartnamede uzlaştık: protein en az %12,5, hektolitre 78 kg üzeri, nem en çok %13. Fiyatta TMO fiyat açıklamasına göre belirlenen primi %2 aşağı çekebilir miyiz?",
        "1.800 tonluk partiyi Aralık sonuna kadar iki teslimatta almayı planlıyoruz. Bugünkü sunumda 45 günlük çek vadesini de netleştirelim.",
        "İyi çalışmalar.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Q4 hedef değerlendirme sunumu",
      at: { hoursAgo: 4 },
      unread: true,
      body: [
        "Ömer merhaba,",
        `Yönetim sunumu için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'indeyiz (${KPI.achievedTon} / ${KPI.quotaTon} ton; ${KPI.achieved} / ${KPI.quota} M₺). Açık pipeline ${KPI.pipeline} M₺, tahsilat hedefin %${KPI.tahsilatPct}'inde.`,
        "Riskli üç fırsatı (bence Başoba, Kuzey Anadolu Fındık ve Çukurova Bayi) ve benden istediğin desteği not düş lütfen.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: `${CB} gübre ön sipariş — karşı teklif`,
      at: { days: 1, time: "17:40" },
      unread: true,
      body: ["Ömer Bey merhaba,", "Fatma Hanım'ın ekibinden karşı teklif geldi: 620 ton DAP ve üre için vadeyi 90 güne uzatmak ve %3 ek iskonto istiyorlar. Bayinin kredi limitinin %86'sı dolu; Can Bey'in teyidi olmadan cevap vermek istemedim. Yarınki müzakereden önce on dakika görüşebilir miyiz?"],
    },
    {
      from: "Can Yıldız",
      subject: "Çukurova Bayi — kredi limiti ve çek teyidi",
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: ["Merhaba Ömer,", "Çukurova Bölge Bayi Ağı'nın 25 M₺'lik limitinde 21,4 M₺ kullanılmış durumda; 3,2 M₺'lik çek 12 gündür vadesini geçti. Yeni 17,4 M₺'lik ön sipariş için ek teminat ya da %20 avans olmadan onay veremem. Müzakereden önce konuşalım."],
    },
    {
      from: `Fatma Güleç (${CB})`,
      subject: "Gübre ön sipariş görüşmesi gündemi",
      at: { days: 1, time: "14:20" },
      body: ["Merhaba,", "Yarınki toplantı için önerimiz: (1) DAP ve üre fiyat endeksi, (2) vade ve çek yapısı, (3) ilkbahar teslim takvimi. Bayilerimizden gelen talep toplamı 620 tonu geçti; eklemek istediğiniz başlık varsa bildirin."],
    },
    {
      from: `Hasan Tuncer (${KB})`,
      subject: "Kışlık ekim tohum ön siparişi",
      at: { days: 2, time: "16:05" },
      unread: true,
      body: ["Ömer Bey,", "Birliğimize bağlı 14 kooperatiften toplanan kışlık ekim talebi 950 tona ulaştı (yaklaşık 56.000 dekar). Sertifikalı tohumun Kasım sonuna kadar depolarımıza teslim edilmesi gerekiyor. Üç ayrı depo noktasını belirledik; liste ekte."],
    },
    {
      from: "Deniz Arslan",
      subject: "Yeni çeşit tescil bilgisi ve satış sunumu",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "Portföye giren iki yeni sertifikalı çeşidin (ekmeklik buğday ve arpa) verim denemesi sonuçlarını sunuma ekledim: dekar başına ortalama %9 daha yüksek verim, kuraklığa dayanım puanı 8/10. Bayi ve birlik toplantılarında kullanabilirsin."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 44. hafta",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: [
        "Merhaba Ömer Bey,",
        `Bu hafta ${KPI.closedWeek} M₺ kapanış gerçekleşti (Yeşilırmak paketi ve Karasu ilk parti mısır); kazanma oranı %${KPI.winRate}. Rapor ekte ve paylaşılan klasörde.`,
        `Tahsilat tarafında vadesi geçmiş alacak ${KPI.overdue} M₺; ayrıntı raporun üçüncü sekmesinde.`,
      ],
    },
    {
      from: `Sevgi Aral (${AY})`,
      subject: "Ayçiçeği sözleşmeli üretim şartları",
      at: { days: 3, time: "09:40" },
      body: ["Merhaba Ömer Bey,", "1.000 tonluk yağlık ayçiçeği alımında fiyatı ham yağ endeksine bağlamak istiyoruz; taban fiyat belirleyelim. Yağ oranı en az %42 ve nem en çok %9 şartımız aynı kalıyor. Görüşmemizden önce formül önerinizi paylaşabilir misiniz?"],
    },
    {
      from: `Gülay Sezer (${KY})`,
      subject: "Mısır nem değerleri ve ikinci parti teklifi",
      at: { days: 4, time: "11:20" },
      body: ["Ömer Bey merhaba,", "İlk parti 570 ton mısırın ortalama nemi %14,2 çıktı; sözleşmede en çok %14 yazıyordu. Fark için makul bir mutabakat önerebilirseniz 2.200 tonluk ikinci parti teklifini hızlıca değerlendiririz."],
    },
    {
      from: `Emine Taşkın (${FI})`,
      subject: "Fındık ihracatı — parite ve sevkiyat tarihi",
      at: { days: 4, time: "09:50" },
      important: true,
      body: ["Merhaba Ömer Bey,", "85 tonluk fındık sevkiyatı için alıcımız EUR cinsinden fiyat bekliyor. Paritedeki son hafta oynaklığı nedeniyle fiyatı sabitlemeden önce güncel kur varsayımınızı paylaşırsanız seviniriz. Konteyner yükleme tarihi 24 Kasım."],
    },
    {
      from: "Mert Aksoy",
      subject: "Silo doluluk ve Aralık sevkiyat planı",
      at: { days: 5, time: "13:25" },
      body: ["Ömer,", `Silo doluluğu %${KPI.siloPct} (${KPI.siloTon} / ${KPI.siloCap} ton). Aralık'ta Ovasan ve Karasu sevkiyatları aynı haftaya denk geliyor; kantar ve araç planını yapabilmem için öncelik sırasını satış tarafından netleştirebilir misin?`],
    },
    {
      from: `Burak Eryılmaz (${BT})`,
      subject: "Nohut ihracatı — kalite şartnamesi",
      at: { days: 6, time: "15:40" },
      body: ["Merhaba Ömer Bey,", "420 tonluk nohut partisi için alıcı 9 mm kalibre ve en çok %12 nem istiyor. Numune analiz raporunu hafta içinde iletirseniz yükleme öncesi onay sürecini hızlandırabiliriz."],
    },
    {
      from: `Cemal Yurdakul (${YC})`,
      subject: "Sözleşme sonrası teslim programı",
      at: { days: 6, time: "10:15" },
      body: ["Ömer Bey,", "Sözleşmenin imzalanmasından memnun kaldık. Tohumun Kasım sonunda, gübre ve bitki koruma ürünlerinin Şubat başında teslim edilmesi bizim için en uygun plan; yazılı olarak teyit edebilir misiniz?"],
    },
    { from: "Kaan Özdemir", subject: "Bölge çiftçi toplantısı planı", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, Konya Ovası'ndaki çiftçi toplantısını üç ilçe için tek güne topladım; yaklaşık 180 çiftçi bekliyoruz. Program ve ikram bütçesi ekte, onayınızla salonu kesinleştireceğim."] },
    { from: "Emre Şahin", subject: "Kışlık ekim kampanya broşürü onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, kampanya broşürünün son hali ekte. Erken sipariş iskonto oranı ve tarihleri satış tarafı görsün istedik; özellikle tohum fiyat tablosunu bir kez daha kontrol eder misin?"] },
    { from: "Elif Kaya", subject: "Verim tahmin modeli güncellendi", at: { days: 9, time: "16:30" }, body: ["Ömer Bey, dekar başına verim tahmin modelini son üç sezonun verisiyle yeniledik; il bazında hata payı %7'den %5'e indi. Bayi toplantılarında kullanabileceğiniz özet ekranı demo ortamına ekledim."] },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "2026 hasat sezonu alımları 41.200 tonla tamamlandı", at: { days: 1, time: "09:05" }, body: ["Hasat sezonu alımlarımız 41.200 ton ile tamamlandı; geçen yılın aynı dönemine göre artış %12. Ortalama protein %12,8, nem %12,4 ve hektolitre 78,6 kg ile kalite hedeflerimizin üzerinde kaldık.", "Saha ve depo ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "Silo kapasitemiz 48 bin tona çıktı", at: { days: 3, time: "10:20" }, body: ["Lisanslı depo tesisimizde dört yeni hücre devreye alındı; toplam kapasite 42.000 tondan 48.000 tona yükseldi.", "Yeni hücreler hububat için, mevcut siloların bir bölümü baklagil ve tohumluk için ayrıldı."] },
    { feed: "haberler", subject: "Yeşilırmak Çiftçi Birliği ile tohum ve gübre paketi anlaşması imzalandı", at: { days: 1, time: "15:30" }, body: ["Yeşilırmak Çiftçi Birliği ile 5,6 M₺'lik tohum, gübre ve bitki koruma paketi sözleşmesi imzalandı.", "Tohum teslimatı Kasım sonunda, gübre ve ilaç teslimatı Şubat başında yapılacak."] },
    { feed: "haberler", subject: "İki yeni sertifikalı çeşit portföyümüze katıldı", at: { days: 8, time: "11:00" }, body: ["Ekmeklik buğday ve arpa için iki yeni sertifikalı çeşit tescil edildi. Verim denemelerinde dekar başına %9 artış ve kuraklığa daha yüksek dayanım görüldü.", "Çeşit bilgi föyleri ve saha sunumu Akademi'de."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: kantar ve laboratuvar sistemleri cumartesi 02:00–05:00 arası kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–05:00 arasında kantar, laboratuvar ve stok sistemlerinde bakım yapılacak. Bu sürede araç kabul ve analiz kaydı açılamayacak."] },
    { feed: "duyuru", subject: "Kışlık ekim ve ön sipariş kampanyası başladı", at: { days: 6, time: "09:00" }, important: true, body: ["Kampanya bugün başladı: sertifikalı tohumda 15 Aralık'a kadar %6 erken sipariş iskontosu, ilkbahar gübre ön siparişinde peşin ödemeye %4 iskonto. Ayrıntılar ekteki broşürde."] },
    { feed: "duyuru", subject: "Hasat sonu dönemi kantar ve laboratuvar çalışma saatleri", at: { days: 10, time: "14:30" }, body: ["Yoğunluk nedeniyle kantar ve laboratuvar 30 Kasım'a kadar hafta içi 07:00–20:00, cumartesi 08:00–14:00 arası hizmet verecek."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Ece Yalçın", at: { days: 3, time: "09:30" }, body: ["Ürün ekibimize Agronomi Uzmanı olarak katılan Ece Yalçın'a hoş geldin diyoruz. Ziraat mühendisi olan Ece, Konya ve Eskişehir bölgelerinde dört yıl tohum deneme ve bayi eğitimi deneyimine sahip.", "Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan Kaan Özdemir ve Derya Çelik başta olmak üzere tüm arkadaşlarımıza iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "2027 yıllık izin planlama dönemi başladı", at: { days: 9, time: "10:00" }, body: ["2027 yıllık izin planlarınızı 30 Kasım'a kadar yöneticinizle birlikte girmenizi rica ederiz.", "Ekim ve Mayıs aylarındaki yoğun sezon haftaları için ekip planlaması ayrıca yapılacaktır."] },
    { feed: "egitim", subject: "Tarım teknolojileri eğitimi: hassas gübreleme ve uzaktan algılama", at: { days: 5, time: "11:15" }, body: ["Hassas gübreleme eğitimi 10:00'da Maslak Eğitim Salonu'nda başlıyor. Toprak analizi okuma ve uydu görüntüsünden bitki sağlığı takibi uygulamalı anlatılacak. Kontenjan 24 kişi."] },
    { feed: "egitim", subject: "Gıda güvenliği ve ilaç kalıntı mevzuatı eğitimi tamamlandı mı?", at: { days: 12, time: "09:20" }, body: ["Zorunlu gıda güvenliği ve bitki koruma ürünü kalıntı mevzuatı eğitimini bu ay sonuna kadar tamamlamanız gerekiyor. Süre yaklaşık 40 dakikadır."] },
    { feed: "akademi", subject: "Yeni modül: Uydu verisiyle verim tahmini", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: uydu ve hava verisiyle dekar başına verim tahmini nasıl yapılır, bayiye nasıl anlatılır? 30 dakikalık video ve örnek il verileri.", "Modülü tamamlayanlar tyroForecast'te bölge raporu oluşturabilecek."] },
    { feed: "akademi", subject: "Gübre fiyat endeksi nasıl okunur?", at: { days: 11, time: "13:30" }, body: ["Gübre fiyat endeksinin üre, DAP ve CAN bileşenleri, doğalgaz ve parite etkisi bu 20 dakikalık derste anlatılıyor. Ön sipariş görüşmelerinde fiyat gerekçesini sunmak için faydalı."] },
    { feed: "kulup", subject: "Cumartesi doğa yürüyüşü: Belgrad Ormanı", at: { days: 3, time: "12:30" }, body: ["Doğa yürüyüşü kulübü cumartesi sabahı 09:00'da Belgrad Ormanı'nda buluşuyor. Yaklaşık 8 km, orta tempolu rota. Katılmak isteyen herkes davetlidir."] },
    { feed: "kulup", subject: "Fide ve tohum takas günü", at: { days: 10, time: "13:00" }, body: ["Bahçe kulübü Kasım ayı takas gününü ofis bahçesinde yapıyor. Evinizde artan fide ve tohumları getirin, yenileriyle değiştirin. Kayıt için kulüp sayfasındaki forma bakabilirsiniz."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: "Ovasan Un buğday teklifini güncelle ve gönder", due: 0, importance: "high", steps: ["Protein ve hektolitre şartnamesini doğrula", "Fiyatı TMO açıklamasına göre güncelle", "Teklifi PDF olarak gönder"], note: "Prim talebi %2; vade 45 gün çek. Teslimat iki parti." },
          { title: "Çukurova Bayi gübre karşı teklifini yanıtla", due: 1, importance: "high", steps: ["Can'dan kredi limiti teyidi al", "Vade ve avans (%20) seçenekleri", "Gübre fiyat endeksine göre fiyatı güncelle"] },
          { title: "Q4 hedef sunumunu hazırla", due: 2, steps: ["Ton ve ciro rakamlarını Derya'dan al", "Riskli fırsatlar slaytı", "Selin ile prova yap"] },
          { title: "Vadesi geçmiş bayi alacaklarının listesini Can ile çıkar", due: -2, importance: "high", status: "inProgress" },
          { title: "Haftalık pipeline raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: "Kızılvadi Birliği tohum ön sipariş sözleşmesini hukuka gönder", due: 3, importance: "high" },
          { title: "Fındık ihracatı için kur varsayımını Can'dan al", due: 1 },
          { title: "Altınbaşak ayçiçeği fiyat formülü önerisini hazırla", due: 3, steps: ["Ham yağ endeksi serisini çek", "Taban ve tavan fiyat senaryoları"] },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: "Kışlık ekim kampanya broşürünü bayilerle paylaş", due: 1, steps: ["Tohum fiyat tablosunu son kez kontrol et", "Bayi e-postasını yaz"] },
          { title: "Konya çiftçi toplantısı hazırlıklarını onayla", due: 6, steps: ["Salon ve ikram bütçesi", "Deneme tarlası ziyaret programı"] },
          { title: "Başoba nohut numune analiz raporunu iste", due: 4, importance: "low" },
          { title: "Karasu Yem ilk parti mısır teslim takvimini onayla", completedDaysAgo: 1 },
          { title: "Yeşilırmak Çiftçi Birliği sözleşme imzasını tamamla", completedDaysAgo: 2 },
          { title: "Kasım tohum fiyat listesini onayla", completedDaysAgo: 4 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Q4 hedef toplantısı", due: 3 },
          { title: "Onur için bayi kredisi ve tahsilat eğitim planı hazırla", due: 8 },
          { title: "Gizem'in çiftçi memnuniyet anketi sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın bölge ziyaret raporunu gözden geçir", due: 5 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Araç kış lastiği değişimi için randevu al", due: 4, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Ton ve Ciro Hedefleri — Gerçekleşme.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: "Ovasan Un — Buğday Teklif v3.pptx", folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: "Kızılvadi Birliği Tohum Ön Sipariş Sözleşmesi.docx", folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Bayi Kredi ve Tahsilat Takibi — Kasım.xlsx", folder: "Finans", by: "Can Yıldız", daysAgo: 2 },
    { name: "Silo Doluluk ve Kalite Raporu.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 2 },
    { name: "Sertifikalı Tohum Fiyat Listesi 2026-27.xlsx", folder: "Teklifler", by: "Emre Şahin", daysAgo: 3 },
    { name: "Gübre Fiyat Endeksi — Haftalık.csv", folder: "Piyasa", by: "Elif Kaya", daysAgo: 3 },
    { name: "Bölge Çiftçi Toplantısı Programı.pdf", folder: "Satış", by: "Kaan Özdemir", daysAgo: 5 },
    { name: "Hasat Sonu Verim Analizi.pptx", folder: "Raporlar", by: "Deniz Arslan", daysAgo: 6 },
    { name: "Fındık İhracatı Parite Hesabı.xlsx", folder: "Finans", by: "Can Yıldız", daysAgo: 6 },
    { name: "Kışlık Ekim Ürün Kataloğu.pdf", folder: "Teklifler", by: "Emre Şahin", daysAgo: 8 },
    { name: "Ekip Performans Özeti.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 9 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: "Ovasan Un toplantı notları", notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma müdürü ve değirmen kalite sorumlusu.", "İstekler: protein en az %12,5, hektolitre 78 kg üzeri, nem en çok %13; fiyatta TMO açıklamasına göre prim indirimi.", "Teslimat Aralık sonuna kadar iki parti; ödeme 45 gün vadeli çek.", "Sonraki adım: güncellenmiş teklif ve silo kalite raporu."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Riskli üç fırsat için aksiyon sahipleri belirlendi: Başoba (kalite şartnamesi), Kuzey Anadolu Fındık (parite), Çukurova Bayi (limit ve vade).", "Kışlık ekim kampanya broşürü hafta sonuna kadar onaylanacak.", "Vadesi geçmiş alacaklar her çarşamba Can ile gözden geçirilecek."] },
    { title: "Çukurova Bayi müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: gübre fiyat endeksindeki artış ve ön sipariş avantajı.", "Esneklik alanları: vade 60 güne kadar, teslimat Şubat'ta iki parti.", "Sınır: %20 avans ve ek teminat olmadan 17,4 M₺'lik siparişe onay yok; ek iskonto en fazla %2."] },
    { title: "Hasat sonu saha gözlemleri", notebook: "Satış", section: "Saha Notları", daysAgo: 6, body: ["Konya ve Eskişehir çevresinde Ekim yağışı normalin yaklaşık %22 altında kaldı; geç ekilen parsellerde çıkış zayıf.", "Çiftçiler gübre fiyatının ilkbaharda yükselmesinden endişeli; ön sipariş ilgisi yüksek.", "Don riski için Aralık başında bitki koruma ve örtü önerileri bayilere iletilecek."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve saha işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Ton ve ciro hedefin, ön siparişler, bayi tahsilatları ve emtia fiyatları hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Buğday ve mısır fiyatları nasıl?", "Ön sipariş durumu nedir?", "Bayi tahsilatı nasıl gidiyor?", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?"],
    },
    answers: [
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış ve sevkiyat verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${KPI.achievedTon} ton** / hedef ${KPI.quotaTon} ton ve **${KPI.achieved} M₺** / hedef ${KPI.quota} M₺ (**%${KPI.achievedPct}**).\n\n- Açık pipeline: ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Bu hafta kapanan: ${KPI.closedWeek} M₺\n- Tahsilat: ${KPI.tahsilat} M₺ / ${KPI.tahsilatTarget} M₺ (%${KPI.tahsilatPct})\n\nKalan 5.620 ton için en kritik fırsat Ovasan Un (29,0 M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "buğday|mısır|ayçiçeği|nohut|fındık|emtia|parite|borsa|\\btmo\\b|gübre fiyat",
        steps: ["tyroTrader piyasa verisini okuyor…", "Borsa ve parite fiyatları derleniyor…"],
        text: "**Emtia fiyatları (haftalık)**\n\n| Ürün | Fiyat | Haftalık değişim |\n|---|---|---|\n| Ekmeklik buğday | 16.100 ₺/ton | +%1,2 |\n| Dane mısır | 11.900 ₺/ton | −%0,8 |\n| Yağlık ayçiçeği | 28.500 ₺/ton | +%2,1 |\n| Nohut | 51.900 ₺/ton | 0 |\n| Fındık (kabuklu) | 195 ₺/kg | +%1,6 |\n\nParite: EUR/USD 1,16; USD/TRY 44,2. Gübre fiyat endeksi son dört haftada %5,8 yükseldi. TMO alım fiyatı açıklandı, piyasa primi yaklaşık %4,5.\n\nKonya ve Eskişehir çevresinde yağış eksikliği ve Aralık başı don riski izleniyor.",
        chips: ["Ön sipariş durumu nedir?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "sipariş|tohum|gübre|ekim",
        steps: ["Ön sipariş kayıtları okunuyor…"],
        text: "**Kışlık ekim ve ilkbahar ön siparişleri**\n\n| Kalem | Alınan | Hedef | Gerçekleşme |\n|---|---|---|---|\n| Sertifikalı tohum | 1.420 ton | 2.600 ton | %55 |\n| Gübre (ilkbahar) | 1.180 ton | 2.000 ton | %59 |\n\n- Kızılvadi Birliği'nin 950 tonluk tohum teklifi onaylanırsa tohum %91'e çıkar.\n- Çukurova Bayi'nin 620 tonluk gübre siparişi kapanırsa gübre %90'a çıkar.\n- Ön siparişlerde %20 avans, kalan tutar vadeli çek/senet.\n\nErken sipariş iskontosu 15 Aralık'ta bitiyor.",
        chips: ["Bayi tahsilatı nasıl gidiyor?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "tahsilat|bayi|senet|vadeli|alacak",
        steps: ["Cari ve çek/senet kayıtları okunuyor…"],
        text: `**Tahsilat durumu**\n\nQ4 tahsilatı **${KPI.tahsilat} M₺** / ${KPI.tahsilatTarget} M₺ (**%${KPI.tahsilatPct}**). Vadesi geçmiş alacak **${KPI.overdue} M₺**:\n\n- Çukurova Bölge Bayi Ağı: 3,2 M₺ (12 gün gecikme)\n- Ege bölgesi iki bayi: 2,1 M₺\n- Çiftçi birlikleri: 1,6 M₺\n\nÇukurova Bayi'nin 25 M₺'lik kredi limitinin 21,4 M₺'si (%86) kullanımda; yeni ön sipariş için ek teminat ya da %20 avans gerekiyor. Bu hafta vadesi gelen çekler 9,4 M₺.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Depo doluluk durumu nedir?"],
      },
      {
        match: "depo|silo|doluluk|stok",
        steps: ["Silo ve kantar kayıtları okunuyor…"],
        text: `**Silo durumu**\n\nDoluluk **%${KPI.siloPct}** (${KPI.siloTon} / ${KPI.siloCap} ton).\n\n- Buğday 16.400 ton, mısır 9.100 ton, ayçiçeği 4.300 ton, baklagil 2.900 ton, diğer 1.380 ton\n- Ortalama kalite: protein %12,8, nem %12,4, hektolitre 78,6 kg\n\nAralık'taki Ovasan ve Karasu sevkiyatlarıyla doluluk yaklaşık %58'e inecek; iki sevkiyat aynı haftaya denk geldiği için öncelik sırasını Mert Aksoy'la netleştirmen gerekiyor.`,
        chips: ["Buğday ve mısır fiyatları nasıl?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Ürün | Hacim | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|---|\n| ${OU} | Ekmeklik buğday | 1.800 ton | 29,0 M₺ | Teklif | %60 |\n| ${AY} | Yağlık ayçiçeği | 1.000 ton | 28,5 M₺ | Müzakere | %45 |\n| ${KY} | Dane mısır (2. parti) | 2.200 ton | 26,2 M₺ | Teklif | %50 |\n| ${BT} | Nohut (ihracat) | 420 ton | 21,8 M₺ | Keşif | %35 |\n| ${CB} | DAP + üre ön sipariş | 620 ton | 17,4 M₺ | Müzakere | %70 |\n| ${FI} | Fındık (ihracat) | 85 ton | 16,6 M₺ | Müzakere | %40 |\n| ${KB} | Sertifikalı tohum | 950 ton | 14,6 M₺ | Teklif | %65 |\n\nDiğer 20 fırsatla birlikte toplam açık pipeline **${KPI.pipeline} M₺**.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:15 Saha günlük 15 dk\n- 14:00 ${OU} — buğday alım teklifi sunumu\n\nBu hafta ayrıca Çukurova Bayi gübre müzakeresi, Altınbaşak ayçiçeği görüşmesi, hassas gübreleme eğitimi ve Q4 hedef değerlendirmesi var. Ayrıca takvimde Konya çiftçi toplantısı (tüm gün) var.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu hafta ${KPI.closedWeek} M₺ kapanış: Yeşilırmak paketi (5,6 M₺) ve Karasu ilk parti mısır (6,8 M₺). Kazanma oranı %${KPI.winRate}.\n- Bugün Ovasan Un teklif sunumu (14:00), yarın Çukurova Bayi gübre müzakeresi.\n- Q4 hedef değerlendirmesi: sunum henüz hazır değil, görev listende.\n- Riskli fırsatlar: ${BT} (nohut kalite şartnamesi), ${FI} (parite), ${CB} (kredi limiti).\n- Vadesi geçmiş alacak ${KPI.overdue} M₺; silo doluluğu %${KPI.siloPct}.`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Rol | Gerçekleşme |\n|---|---|---|\n| Kaan Özdemir | Bölge satış | %107 |\n| Zeynep Acar | Kurumsal satış | %96 |\n| Onur Polat | Bayi kanalı | %84 |\n| Gizem Tunç | Müşteri ilişkileri | %73 |\n| Derya Çelik | Satış operasyon | %66 |\n\nKaan Konya ve Eskişehir bölgesinde hedefi aştı; Onur'un bayi tarafında vadesi geçmiş alacaklar pipeline'ı yavaşlatıyor.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kışlık ekim ve ön sipariş kampanyası**\n\n- Sertifikalı tohumda 15 Aralık'a kadar **%6 erken sipariş iskontosu**.\n- İlkbahar gübre ön siparişinde peşin ödemeye **%4 iskonto**; bayi çek vadesi en fazla 120 gün.\n- Şimdiye kadar 9 teklifte uygulandı; en büyüğü Kızılvadi Birliği (14,6 M₺).\n- %5 üzeri ek iskonto onayı Selin Aydın'da.\n\nFiyat ve iskonto simülasyonu için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Ön sipariş durumu nedir?"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 22 gün, kullandığın 9 gün; **kalan 13 gün**. Aralık sonu için 4 günlük onaylı planın var, 1 günlük bir talebin yönetici onayında.\n\nYoğun sezon haftalarını (Ekim ve Mayıs) yeni izin planına girerken ekiple birlikte gözden geçirmeni öneririm. Talep için *Self Servis*'i ya da burayı kullanabilirsin.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Saha ziyareti için yakıt, konaklama ve otoyol kalemlerini seç; fişi ekle (fiş okuyucu tutarı kendisi çıkarır)\n3. Ziyaret edilen bayi ya da çiftçi birliğini not düşüp gönder; yöneticin onaylar.\n\nŞu an onay bekleyen bir masraf raporun var (HRMS-071582, Konya ziyareti).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **3 onayın** var: Çukurova Bayi için %3 ek iskonto talebi, Kaan Özdemir'in Konya çiftçi toplantısı bütçesi ve Onur Polat'ın bayi kredisi eğitimi talebi.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Ton ve ciro hedefin, ön siparişler, bayi tahsilatı, silo doluluğu, emtia fiyatları, takvimin ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

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
  siloFree: "13.920", // boş kapasite (ton)
  tahsilatLeft: "42,0", // Q4 tahsilat hedefine kalan (milyon TL)
  checksWeek: "9,4", // bu hafta vadesi gelen çek/senet
  seedPreTon: "1.420", // sertifikalı tohum ön siparişi
  seedPreTarget: "2.600",
  seedPrePct: 55,
  fertPreTon: "1.180", // ilkbahar gübre ön siparişi
  fertPreTarget: "2.000",
  fertPrePct: 59,
}

const KB = "Kızılvadi Tarım Kooperatifleri Birliği"
const CB = "Çukurova Bölge Bayi Ağı A.Ş."
const OU = "Ovasan Un Sanayi A.Ş."
const AY = "Altınbaşak Yağ Sanayi A.Ş."
const YC = "Yeşilırmak Çiftçi Birliği"
const KY = "Karasu Yem ve Mısır Sanayi A.Ş."
const FI = "Kuzey Anadolu Fındık İhracat Ltd."
const BT = "Başoba Tahıl ve Baklagil İhracat A.Ş."
// ek müşteri ve iş ortakları
const BZ = "Bereket Ziraat Marketleri A.Ş."
const GU = "Gökçeova Un ve Bulgur Sanayi A.Ş."
const AU = "Akçaova Üreticiler Birliği"
const MS = "Meriç Süt Çiftlikleri A.Ş."
const FB = "Fırat Bakliyat Dış Ticaret Ltd."
const EZ = "Ege Ziraat Deposu Ltd."
const TT = "Tuzgölü Taşımacılık A.Ş."

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
    { name: "tyroCredit", type: "ai", description: "Bayi kredi skoru, limit kullanımı ve çek vadesi risk uyarıları.", icon: "DocumentValidationIcon" },
    { name: "tyroRoute", type: "ai", description: "Sevkiyat, araç ve kantar randevusu planlaması; ihracat yükleme takibi.", icon: "CargoShipIcon" },
    { name: "tyroCrop", type: "ai", description: "Parsel bazlı ekim zamanı, don ve kuraklık riski ile çeşit önerileri.", icon: "AiBrain02Icon" },
    { name: "Bayi Portalı", type: "business", description: "Bayi sipariş, kredi limiti ve tahsilat takibi", url: "#", icon: "Target02Icon" },
    { name: "Kantar ve Laboratuvar Sistemi", type: "business", description: "Araç kabul, kantar fişi ve numune analiz sonuçları", url: "#", icon: "Analytics01Icon" },
    { name: "Sözleşme ve Ön Sipariş Takibi", type: "business", description: "Birlik, bayi ve alım sözleşmeleri ile ön sipariş kayıtları", url: "#", icon: "AddInvoiceIcon" },
    { name: "Tarla ve Parsel Kayıtları", type: "business", description: "Çiftçi, parsel ve deneme tarlası kayıtları; saha ziyaret notları", url: "#", icon: "AiBookIcon" },
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

    // ───── ek takvim: tekrarlılar, 1:1'ler, müşteri ve saha görüşmeleri ─────
    {
      title: "Silo ve sevkiyat kapasitesi gözden geçirme",
      recur: "weekly",
      weekday: 5,
      time: "11:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Derya Çelik", "Kaan Özdemir"],
      body: "Silo doluluğu, kantar sırası, araç randevuları ve gelecek haftanın sevkiyat öncelikleri.",
    },
    {
      title: "Aylık sezon ve operasyon planlama (S&OP)",
      recur: "monthly",
      dom: 17,
      time: "11:00",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Selin Aydın", "Can Yıldız", "Deniz Arslan", "Elif Kaya"],
      body: "Kışlık ve ilkbahar ekim talebi, silo ve araç kapasitesi, gübre ile tohum tedarik durumu ve ihracat takvimi.",
    },
    { title: "Ekip 1:1 — Zeynep Acar", day: 2, time: "13:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Kızılvadi ve Ovasan hesaplarının durumu, kurumsal kanal hedefi ve gelişim planı." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 3, time: "16:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "Konya ve Eskişehir bölge hedefi, çiftçi toplantısı hazırlığı ve ilkbahar ön sipariş potansiyeli." },
    { title: `${BZ} — bayi sözleşmesi ve kampanya katkı payı`, day: 4, time: "14:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Tolga Aydoğdu (${BZ})`, "Onur Polat", "Emre Şahin"], body: "38 satış noktası için çerçeve bayi sözleşmesi, kışlık ekim kampanyasında %2 katkı payı ve ilk sipariş vadesi." },
    { title: `${GU} — ilk sipariş ve kalite şartnamesi`, day: 5, time: "15:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nurcan Ergin (${GU})`, "Zeynep Acar", "Mert Aksoy"], body: "320 ton ekmeklik buğday için protein, gluten indeksi ve hektolitre şartı; numune sonuçları ve teslim takvimi." },
    { title: `${AU} — ilkbahar gübre ön sipariş toplantısı`, day: 6, time: "10:00", minutes: 60, where: "Akçaova · Birlik Merkezi", organizer: "Kaan Özdemir", with: [`Hilmi Bozdağ (${AU})`, "Ömer Gümüş", "Gizem Tunç"], body: "Dokuz köyden toplanan 180 ton CAN ve üre talebi; avans oranı, teslim noktası ve hasat sonrası ödeme planı." },
    { title: "Don ve kuraklık risk planı — bayi iletişimi (davet)", day: 6, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Elif Kaya", status: "notResponded", with: ["Ömer Gümüş", "Deniz Arslan", "Kaan Özdemir", "Onur Polat"], body: "Aralık başı don riski ve yağış eksikliği için bayilere gönderilecek uyarı eşikleri ve mesaj planı. Katılımınızı bekliyoruz." },
    { title: "Ekip 1:1 — Derya Çelik", day: 7, time: "13:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "Haftalık rapor otomasyonu, vadesi geçmiş alacak raporu ve tahsilat takibi." },
    { title: `${MS} — dane mısır tedarik görüşmesi`, day: 7, time: "15:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Orhan Bulut (${MS})`, "Zeynep Acar", "Mert Aksoy"], body: "Sekiz çiftlik için yıllık 2.400 ton dane mısır; aylık 200 ton teslim, nem şartı ve 30 gün vade." },
    { title: `${EZ} — çek yapılandırma görüşmesi`, day: 9, time: "10:00", minutes: 45, where: "Microsoft Teams", organizer: "Onur Polat", with: [`Metin Özgüven (${EZ})`, "Ömer Gümüş", "Can Yıldız"], body: "Vadesi geçen 1,3 M₺'lik çekler için taksit planı, stok teminatı ve yeni sezon kredi limiti." },
    { title: `${TT} — Aralık araç planı`, day: 10, time: "11:00", minutes: 30, where: "Microsoft Teams", organizer: "Mert Aksoy", with: [`Sinan Erdem (${TT})`, "Ömer Gümüş", "Derya Çelik"], body: "Aralık ilk haftasında Ovasan ve Karasu sevkiyatları için araç sayısı, navlun ve kantar randevuları." },
    { title: "Güney Anadolu Tarım Girdileri Fuarı — stant günleri", day: 11, allDay: true, span: 2, where: "Adana · Tarım Fuar Alanı", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Kaan Özdemir", "Onur Polat", "Gizem Tunç"], body: "Kışlık ekim ve ilkbahar gübre ön sipariş kampanyası tanıtımı; bayi ve birlik görüşmeleri için nöbetli stant." },
    { title: "Ekip 1:1 — Gizem Tunç", day: 12, time: "14:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Çiftçi memnuniyet anketi aksiyonları, şikâyet yanıt süreleri ve ilkbahar iletişim planı." },
    { title: `${FB} — kırmızı mercimek ihracat teklifi`, day: 13, time: "10:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pelin Yavuzer (${FB})`, "Zeynep Acar", "Mert Aksoy"], body: "300 ton kırmızı mercimek için nem ve kırık oranı şartı, akreditifli ödeme ve Ocak yükleme takvimi." },
    // geçmiş
    { title: `${KB} — depo noktaları ve teslim planı`, day: -1, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Hasan Tuncer (${KB})`, "Zeynep Acar", "Mert Aksoy"], body: "Üç depo noktasında kantar randevusu, araç giriş saatleri ve 950 ton tohumun Kasım sonu teslim planı." },
    { title: "Hasat sonu verim analizi sunumu", day: -5, time: "14:00", minutes: 60, where: "Microsoft Teams", organizer: "Deniz Arslan", with: ["Ömer Gümüş", "Kaan Özdemir", "Elif Kaya"], body: "Üç bölgenin sezon verimi, çeşit performansı ve gelecek sezon tohum önerileri." },
    { title: "Gübre tedarik fiyatı ve stok teyidi", day: -6, time: "10:30", minutes: 45, where: "Microsoft Teams", organizer: "Can Yıldız", with: ["Ömer Gümüş", "Mert Aksoy", "Elif Kaya"], body: "DAP ve üre tedarikçi teklifleri, liman stok durumu ve ilkbahar teslimat takvimi." },
    { title: `${GU} — numune ve ilk tanışma görüşmesi`, day: -7, time: "15:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nurcan Ergin (${GU})`, "Zeynep Acar", "Deniz Arslan"], body: "Değirmenin yıllık buğday ihtiyacı, kalite beklentisi ve numune gönderim planı." },
    { title: `${AY} — ayçiçeği ön görüşme`, day: -10, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Sevgi Aral (${AY})`, "Deniz Arslan"], body: "Sözleşmeli üretim modelinin tanıtımı, yağ oranı beklentisi ve fiyat formülü çerçevesi." },
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

    // ───── ek posta: yeni müşteriler ve iç yazışmalar ─────
    {
      from: `Tolga Aydoğdu (${BZ})`,
      subject: "Re: Bayi sözleşmesi ve kampanya katkı payı",
      at: { hoursAgo: 3 },
      unread: true,
      important: true,
      body: [
        "Ömer Bey merhaba,",
        "38 satış noktamız için çerçeve bayi sözleşmesi taslağını inceledik. Kışlık ekim kampanyasında noktaların vitrin ve broşür giderine %2 katkı payı talep ediyoruz; ilk siparişte 120 ton sertifikalı tohum ve 90 ton gübre düşünüyoruz.",
        "Görüşmemizde ödeme vadesini 60 gün çek olarak konuşabilir miyiz? Hazırlık için kampanya iskonto tablonuzu önceden paylaşırsanız seviniriz.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Silo B-3 hücresinde sıcaklık alarmı",
      at: { days: 1, time: "08:50" },
      unread: true,
      important: true,
      body: [
        "Ömer,",
        "B-3 hücresindeki 1.100 tonluk mısır partisinde sıcaklık 31 °C'ye çıktı, nem %14,2. Havalandırmayı artırdık ama partiyi yaklaşık 10 gün içinde hareket ettirmemiz gerekiyor.",
        "Karasu ikinci parti teklifi (2.200 ton) hızlanabilirse bu partiyi ilk sevkiyata ayırırım; aksi halde boş B-5 hücresine aktaracağız ve 18 saatlik ek mesai maliyeti çıkacak. Satış tarafının kararını bekliyorum.",
      ],
    },
    {
      from: `Nurcan Ergin (${GU})`,
      subject: "Numune sonuçları ve ilk sipariş niyeti",
      at: { days: 2, time: "14:10" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Gönderdiğiniz numunelerin analizini tamamladık: protein %13,1, hektolitre 79,2 kg, gluten indeksi 74. Şartnamemizle uyumlu. İlk deneme siparişi olarak 320 ton alabiliriz.",
        "Fiyatı TMO açıklamasının %3 üzerinde bir primle ve 60 gün vadeli çek şeklinde konuşalım. Teslimat Aralık ortasında tek parti olabilir.",
      ],
    },
    {
      from: `Orhan Bulut (${MS})`,
      subject: "Süt çiftlikleri için dane mısır ihtiyacı",
      at: { days: 3, time: "10:25" },
      body: ["Ömer Bey merhaba,", "Sekiz çiftliğimizin yıllık dane mısır ihtiyacı yaklaşık 2.400 ton; aylık 200 ton eşit teslimat ve nemin en çok %14 olması şartıyla çalışmak istiyoruz. Aralık için ilk 300 tonluk teslimatın fiyatını iletebilir misiniz? Ödeme 30 gün vadeli olmalı."],
    },
    {
      from: `Hilmi Bozdağ (${AU})`,
      subject: "İlkbahar gübre ön sipariş listesi ve avans oranı",
      at: { days: 4, time: "16:20" },
      unread: true,
      body: ["Ömer Bey,", "Dokuz köyden 180 ton CAN ve üre talebi topladık; liste ekte. Üyelerimiz ödemeyi hasat sonrası yapabildiği için ön sipariş avansını %20 yerine %10 tutabilir miyiz? Teslimatı Şubat başında birlik deposundan almayı planlıyoruz."],
    },
    {
      from: `Metin Özgüven (${EZ})`,
      subject: "Vadesi geçen çekler için taksit talebi",
      at: { days: 5, time: "11:30" },
      important: true,
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "İki şubemizin toplam 1,3 M₺'lik çeki vadesini geçti; hasat sonrası çiftçi tahsilatlarının gecikmesi nakit akışımızı sıktı. Borcu üç eşit taksitte (Aralık, Ocak, Şubat) ödemeyi ve karşılığında mevcut stoğumuzu teminat göstermeyi öneriyoruz.",
        "Can Bey'le görüşmeden önce kabul edilebilir bir çerçeve olup olmadığını bilmek isteriz.",
      ],
    },
    {
      from: `Pelin Yavuzer (${FB})`,
      subject: "Kırmızı mercimek ihracat talebi",
      at: { days: 6, time: "09:35" },
      unread: true,
      body: ["Merhaba Ömer Bey,", "Orta Doğu'daki alıcımız 300 ton kırmızı mercimek için teklif bekliyor: nem en çok %13, kırık oranı en çok %1,5, 25 kg torbalı sevkiyat. Fiyat USD/ton bazında, ödeme akreditifli olacak.", "Numune ve ambalaj şartnamesi ekte; teslim tarihi Ocak ayının ilk yarısı."],
    },
    {
      from: `Sinan Erdem (${TT})`,
      subject: "Aralık ilk hafta araç kapasitesi",
      at: { days: 6, time: "14:45" },
      body: ["Merhaba Ömer Bey,", "Aralık'ın ilk haftasında sevkiyat talebi yoğun; o hafta için en fazla 46 çekici garanti edebiliyoruz. Navlun Kasım fiyatına göre %6 artacak. Araç sayısını 20 Kasım'a kadar teyit ederseniz fiyatı sabit tutabiliriz."],
    },
    {
      from: "Can Yıldız",
      subject: "Fındık ihracatı için forward kur önerisi",
      at: { days: 7, time: "15:20" },
      flagged: true,
      body: [
        "Ömer,",
        "EUR/TRY spot 51,3; bir aylık forward 52,0 seviyesinde (yaklaşık %1,4 prim). 85 tonluk fındık sevkiyatının tahsilatı Aralık sonunda olacağından tutarın %70'ini forward ile sabitlemeyi öneriyorum.",
        "Tamamı açık kalsaydı EUR/TRY'de %1'lik hareket yaklaşık 0,17 M₺ fark yaratırdı; %30'u açık bırakırsak etki yaklaşık 0,05 M₺ olur. Emine Hanım'a vereceğin kur varsayımını buna göre yazalım.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "2027 ekim sezonu çalıştayı — ön fikir notu",
      at: { days: 5, time: "09:20" },
      unread: true,
      body: ["Ömer merhaba,", "Çalıştaydan önce her ekip liderinin iki sayfalık bir fikir notu hazırlamasını istiyorum: ürün portföyü, bayi kapsama ve fiyat stratejisi. Seninkinde özellikle ilkbahar gübre ön siparişinin ekim sezonuna nasıl taşınacağını görmek isterim.", "Notları çalıştaydan iki gün önce paylaşırsan okuyup gelirim."],
    },
    {
      from: "Zeynep Acar",
      subject: "Kızılvadi sözleşmesi — hukuk görüşü",
      at: { days: 8, time: "13:05" },
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "Hukuk, Kızılvadi tohum ön sipariş sözleşmesinde iki maddeye itiraz etti: gecikme faizi oranı ve mücbir sebep tanımı. Kuraklık ve don gibi doğa olaylarının mücbir sebep sayılması birlik tarafının talebi.",
        "Önerim kuraklığı kapsam dışı bırakıp yalnız ilan edilmiş afet bölgelerini mücbir sebep saymak. Onayınla revize taslağı Hasan Bey'e göndereceğim.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "Bayi ziyaretleri — Adana ve Mersin notları",
      at: { days: 8, time: "17:30" },
      body: ["Ömer Bey, Adana ve Mersin'de altı bayiyi ziyaret ettim. Üçünde kışlık tohum stoğu yüksek, ikisi gübre ön siparişine ilgili, biri ise vade uzatımı olmadan yeni sipariş vermek istemiyor. Ziyaret notlarını ve fotoğrafları paylaşılan klasöre ekledim; ekip toplantısında özetleyeceğim."],
    },
    {
      from: "Gizem Tunç",
      subject: "Çiftçi memnuniyet anketi sonuçları",
      at: { days: 9, time: "11:50" },
      body: ["Ömer Bey merhaba,", "412 çiftçinin yanıtladığı anket tamamlandı. Genel memnuniyet 5 üzerinden 4,2; en sık şikâyet tohum teslim gecikmesi (%27), ardından fiyat bilgisine geç ulaşma (%19).", "Sonuç sunumunu ekledim; bayilere iletmeden önce görüşlerinizi almak isterim."],
    },
    {
      from: "Deniz Arslan",
      subject: "Tohum sertifikasyon numune sonuçları",
      at: { days: 10, time: "10:10" },
      flagged: true,
      body: [
        "Ömer,",
        "Üç tohum partisinden ikisi sertifikasyon eşiğini geçti (çimlenme %94 ve %93). Üçüncü ekmeklik buğday partisinde çimlenme %88 çıktı, asgari değer %92. Parti yeniden testten geçene kadar satış listesinden çıkardım.",
        "Etkilenen sipariş yok ama Kızılvadi teslimatından önce sonucu kesinleştirmemiz gerekiyor.",
      ],
    },
    { from: "Ayşe Demir", subject: "Hassas gübreleme eğitimi — katılım teyidi", at: { days: 11, time: "09:30" }, body: ["Merhaba Ömer Bey, eğitim için ekibinizden dört kişi kayıtlı: Zeynep, Kaan, Onur ve siz. Gizem Hanım'ın talebi bekleme listesinde; iptal olursa ilk sırada. Katılım belgeleri eğitim sonunda iletilecek."] },
    { from: `Hasan Tuncer (${KB})`, subject: "Depo kabul saatleri ve randevu düzeni", at: { days: 12, time: "14:40" }, body: ["Ömer Bey merhaba,", "Üç depo noktamızda araç kabulü hafta içi 08:00–17:00 arasında yapılıyor. 950 tonluk teslimat için günde en fazla 12 araç kabul edebiliriz; randevu listesini iki gün önceden iletmenizi rica ederiz."] },
    { from: "Elif Kaya", subject: "Don riski uyarı eşiği ve bayi SMS'i", at: { days: 13, time: "10:40" }, body: ["Ömer Bey, hava modeli Aralık'ın ilk haftasında gece sıcaklığının −6 °C altına düşme olasılığını %35 gösteriyor (Konya ve Eskişehir). Uyarı eşiğini −4 °C olarak belirledim; eşik aşılırsa 112 bayiye otomatik SMS gidecek. Mesaj metnini onayınıza sunuyorum."] },
    { from: "Emre Şahin", subject: "Fuar stantı ve broşür adetleri", at: { days: 14, time: "16:10" }, body: ["Ömer merhaba, Güney Anadolu Tarım Girdileri Fuarı için 24 m²'lik stant tasarımı hazır. Kışlık ekim ve ilkbahar gübre kampanya broşüründen 2.500 adet basacağız; stantta kimlerin nöbet tutacağını satış tarafı belirlesin."] },

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

    // ───── Keşfet akışı: ek içerikler ─────
    { feed: "haberler", subject: "Bayi ağımız 214 noktaya ulaştı", at: { days: 5, time: "10:40" }, body: ["Bayi ağımıza bu çeyrekte 11 yeni satış noktası katıldı; toplam bayi sayısı 214 oldu. Yeni noktaların dokuzu Akdeniz ve Ege bölgesinde.", "Yeni noktaların kredi limiti ve sipariş kayıtlarını Bayi Portalı'ndan izleyebilirsiniz."] },
    { feed: "haberler", subject: "Kantar ve laboratuvarda kâğıtsız kabul oranı %92'ye çıktı", at: { days: 7, time: "09:50" }, body: ["Dijital kantar fişi ve laboratuvar sonuç formu devreye alınalı üç ay oldu; araç kabulünde kâğıtsız işlem oranı %92'ye ulaştı. Araç başına ortalama bekleme süresi 41 dakikadan 28 dakikaya indi."] },
    { feed: "haberler", subject: "Tohum laboratuvarımızın akreditasyonu iki yıl uzatıldı", at: { days: 9, time: "13:15" }, body: ["Sertifikalı tohum laboratuvarımızın çimlenme ve saflık analizi akreditasyonu iki yıl uzatıldı. Denetimde ölçüm süreçleri ve numune saklama koşullarında uygunsuzluk çıkmadı.", "Laboratuvar ekibine teşekkür ederiz."] },
    { feed: "duyuru", subject: "Saha araçlarında kış lastiği ve bakım takvimi", at: { days: 4, time: "11:00" }, body: ["Şirket araçlarında kış lastiği değişimi 20 Kasım'a kadar tamamlanacak. Randevu için filo sayfasındaki takvimden istasyon ve saat seçebilirsiniz; yüksek rakımlı bölgelere çıkacak araçlara öncelik verilecek."] },
    { feed: "duyuru", subject: "Yeni masraf politikası: saha konaklama limitleri 1 Aralık'ta değişiyor", at: { days: 8, time: "09:30" }, body: ["1 Aralık'tan itibaren saha ziyaretlerinde gecelik konaklama limiti 2.600 ₺ olacak; yakıt fişleri fiş okuyucu ile yüklenecek. Politika metni İK sayfasında."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Barış Kılınç", at: { days: 6, time: "09:40" }, body: ["Operasyon ekibimize Saha Lojistik Uzmanı olarak katılan Barış Kılınç'a hoş geldin diyoruz. Barış, Mersin ve Adana limanlarında beş yıl hububat ve gübre sevkiyatı yönetti.", "Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Doğum günleri: Onur Polat ve Emre Şahin", at: { days: 4, time: "08:50" }, body: ["Bu hafta doğum günü olan Onur Polat ve Emre Şahin'e iyi ki doğdunuz diyor, tüm ekip arkadaşlarımıza nice mutlu yıllar diliyoruz. Pasta ikramı 15:30'da mutfak alanında."] },
    { feed: "ik", subject: "Yıl sonu performans değerlendirme takvimi", at: { days: 11, time: "10:20" }, body: ["Yıl sonu hedef ve yetkinlik değerlendirmeleri 1–19 Aralık arasında yapılacak. Öz değerlendirme formunu 10 Aralık'a kadar doldurmanız ve yönetici görüşmeleri için takvimden uygun saat seçmeniz gerekiyor."] },
    { feed: "egitim", subject: "Bitki koruma ürünleri: etiket okuma ve doz eğitimi", at: { days: 8, time: "10:30" }, body: ["Bayi danışmanlığı yapan ekipler için bitki koruma ürünü etiketlerini okuma, ruhsat bilgisi ve uygulama dozu eğitimi 26 Kasım'da 14:00'te çevrim içi yapılacak. Süre 90 dakikadır."] },
    { feed: "egitim", subject: "Vade yönetimi ve teminat eğitimi: Finans ve Hukuk anlatıyor", at: { days: 6, time: "15:45" }, body: ["Çek, senet ve teminat mektubu işlemleri, bayi limit yönetimi ve gecikmiş alacak süreci iki saatlik atölyede anlatılacak. Satış ve kanal ekiplerine özellikle önerilir."] },
    { feed: "egitim", subject: "Siber güvenlik: oltalama e-postası simülasyonu", at: { days: 13, time: "09:00" }, body: ["Bu ay sonunda tüm çalışanlara kısa bir oltalama simülasyonu gönderilecek. Şüpheli e-postaları nasıl bildireceğinizi 15 dakikalık videodan öğrenebilirsiniz."] },
    { feed: "akademi", subject: "Yeni video: Silo kalite parametreleri (protein, nem, hektolitre)", at: { days: 5, time: "14:00" }, body: ["Akademi'de 25 dakikalık yeni bir video yayında: protein, nem ve hektolitre ölçümünün anlamı, kalite sınıfı farkının fiyata etkisi ve müşteriye şartname okuma ipuçları."] },
    { feed: "akademi", subject: "Vaka çalışması: kurak sezonda bayi kredisi nasıl yönetilir?", at: { days: 9, time: "12:10" }, body: ["Kurak geçen bir sezonda limit kullanımı, çek yenileme ve teminat yönetimi üzerine 20 dakikalık bir vaka çalışması eklendi. Çıkış sınavı 10 sorudan oluşuyor."] },
    { feed: "kulup", subject: "Kitap kulübü: Kasım seçkisi", at: { days: 6, time: "12:00" }, body: ["Kitap kulübü bu ayın kitabını belirledi; buluşma 27 Kasım'da öğle arasında mutfak alanında. Okumak isteyenler için ofis kitaplığında kopyalar bulunuyor."] },
    { feed: "kulup", subject: "Fotoğraf kulübü: hasat mevsimi sergisi", at: { days: 9, time: "16:20" }, body: ["Kulüp üyelerinin sezon boyunca çektiği hasat ve tarla fotoğrafları lobi alanında sergilenecek. Kendi karenizi eklemek isterseniz 20 Kasım'a kadar kulüp sayfasından yükleyin."] },
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
          { title: "Silo B-3 mısır partisi için satış önceliğini Mert ile netleştir", due: 0, importance: "high", note: "1.100 ton, sıcaklık 31 °C; Karasu ikinci parti hızlanırsa ilk sevkiyata ayrılacak." },
          { title: "Akçaova Birliği avans oranı talebi için Can ve Selin'den görüş al", due: 2, importance: "high", steps: ["Avansı %20'den %10'a indirmenin riskini Can'la değerlendir", "Selin'den istisna onayı iste", "Birliğe yazılı yanıt hazırla"] },
          { title: "Ege Ziraat Deposu çek yapılandırma önerisini hazırla", due: -1, importance: "high", status: "inProgress", note: "1,3 M₺; üç taksit (Aralık, Ocak, Şubat) ve stok teminatı önerisi." },
          { title: "Bereket Ziraat Marketleri bayi sözleşme taslağını hukuka gönder", due: 3, steps: ["%2 katkı payı için Selin'in onayını al", "Taslağı hukuka ilet", "Kampanya iskonto tablosunu Tolga Bey'le paylaş"] },
          { title: "Gökçeova Un ilk sipariş teklifini hazırla", due: 4, steps: ["Numune sonuçlarını teklife ekle", "Prim ve 60 gün vade için Can'dan limit teyidi al"] },
          { title: "Meriç Süt Çiftlikleri dane mısır teklifini gönder", due: 5 },
          { title: "Kızılvadi sözleşmesinde mücbir sebep revizyonunu onayla", due: 4, importance: "high" },
          { title: "Aralık sevkiyat öncelik listesini Mert ve Derya ile kesinleştir", due: 6, steps: ["Ovasan ve Karasu teslim tarihlerini sıraya diz", "Tuzgölü Taşımacılık araç sayısını teyit et"] },
          { title: "Başoba nohut kalite şartnamesini hukuk ile gözden geçir", completedDaysAgo: 3 },
          { title: "Gübre tedarikçi fiyat teyidi için Can ile görüş", completedDaysAgo: 6 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Q4 hedef toplantısı", due: 3 },
          { title: "Onur için bayi kredisi ve tahsilat eğitim planı hazırla", due: 8 },
          { title: "Gizem'in çiftçi memnuniyet anketi sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın bölge ziyaret raporunu gözden geçir", due: 5 },
          { title: "Onur'un Adana ve Mersin ziyaret notlarını bayi stok raporuyla karşılaştır", due: 4 },
          { title: "Derya ile tahsilat raporu şablonunu sadeleştir", due: 7, importance: "low" },
          { title: "Gizem'in anket sonuçlarından üç aksiyon seç", due: 9, steps: ["Teslim gecikmesi şikâyetlerini grupla", "Mert'le lojistik çözümünü görüş", "Aksiyon planını ekibe duyur"] },
          { title: "Kaan için Konya ve Eskişehir bölge hedef revizyon önerisi hazırla", due: 10 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Araç kış lastiği değişimi için randevu al", due: 4, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Ev sigortası yenileme tekliflerini karşılaştır", due: 11, importance: "low" },
          { title: "Vergi beyanı için fatura klasörünü düzenle", due: 12, importance: "low" },
        ],
      },
      {
        name: "Saha ve Bayiler",
        tasks: [
          { title: "Kızılvadi depo noktaları için kantar randevu listesini teyit et", due: 2, importance: "high", steps: ["Üç depo müdürüyle günlük 12 araç sınırını doğrula", "Randevu listesini Mert'ten al", "Listeyi birliğe iki gün önceden ilet"] },
          { title: "Don riski bayi SMS metnini onayla", due: 3, importance: "high", note: "Eşik −4 °C; 112 bayiye otomatik gönderim. Metni Elif hazırladı." },
          { title: "Çukurova bayilerinde stok sayımı tarihini Onur'la belirle", due: 4 },
          { title: "Akçaova Birliği toplantısı için gübre fiyat tablosunu hazırla", due: 5, steps: ["DAP, üre ve CAN güncel fiyatlarını Elif'ten al", "Avans seçeneklerini tabloya ekle"] },
          { title: "Konya Ovası deneme parseli ziyaret rotasını çıkar", due: 6, steps: ["Üç ilçeden parsel listesini Kaan'dan iste", "Yol süresini ve öğle arasını planla"] },
          { title: "Ege bayileri ziyaret programını planla", due: 8, importance: "low" },
          { title: "Güney Anadolu fuarı stant nöbet çizelgesini oluştur", due: 9, steps: ["Kaan, Onur ve Gizem'in uygunluğunu sor", "Fuar numunelerini Deniz'den teslim al"] },
          { title: "Adana bayi ziyaretini tamamla", completedDaysAgo: 2 },
          { title: "Mersin bayi stok raporunu al", completedDaysAgo: 5 },
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
    { name: "Bereket Ziraat Marketleri — Bayi Sözleşme Taslağı.docx", folder: "Sözleşmeler", by: "Onur Polat", daysAgo: 0 },
    { name: "Aralık Sevkiyat ve Araç Planı.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 1 },
    { name: "Kızılvadi Birliği Depo Noktaları ve Teslim Planı.pdf", folder: "Operasyon", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Gökçeova Un — Numune Analiz Sonuçları.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 2 },
    { name: "Bayi Kredi Limitleri ve Teminat Özeti.xlsx", folder: "Finans", by: "Can Yıldız", daysAgo: 3 },
    { name: "Akçaova Birliği Gübre Ön Sipariş Listesi.xlsx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 3 },
    { name: "Meriç Süt Çiftlikleri — Dane Mısır Teklifi.pptx", folder: "Teklifler", by: "Zeynep Acar", daysAgo: 4 },
    { name: "Ege Bayileri Vade Yapılandırma Önerisi.docx", folder: "Finans", by: "Can Yıldız", daysAgo: 4 },
    { name: "2027 Ekim Sezonu Strateji Çalıştayı Ön Notu.docx", folder: "Raporlar", by: "Selin Aydın", daysAgo: 5 },
    { name: "Don ve Kuraklık Risk Haritası.pdf", folder: "Raporlar", by: "Elif Kaya", daysAgo: 6 },
    { name: "Tohum Sertifikasyon Numune Sonuçları.pdf", folder: "Raporlar", by: "Deniz Arslan", daysAgo: 7 },
    { name: "Çiftçi Memnuniyet Anketi — Sonuç Özeti.pptx", folder: "Raporlar", by: "Gizem Tunç", daysAgo: 8 },
    { name: "Güney Anadolu Tarım Girdileri Fuarı Stant Planı.pdf", folder: "Satış", by: "Emre Şahin", daysAgo: 10 },
    { name: "TMO Fiyat Açıklaması Etki Analizi.xlsx", folder: "Piyasa", by: "Elif Kaya", daysAgo: 11 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: "Ovasan Un toplantı notları", notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma müdürü ve değirmen kalite sorumlusu.", "İstekler: protein en az %12,5, hektolitre 78 kg üzeri, nem en çok %13; fiyatta TMO açıklamasına göre prim indirimi.", "Teslimat Aralık sonuna kadar iki parti; ödeme 45 gün vadeli çek.", "Sonraki adım: güncellenmiş teklif ve silo kalite raporu."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Riskli üç fırsat için aksiyon sahipleri belirlendi: Başoba (kalite şartnamesi), Kuzey Anadolu Fındık (parite), Çukurova Bayi (limit ve vade).", "Kışlık ekim kampanya broşürü hafta sonuna kadar onaylanacak.", "Vadesi geçmiş alacaklar her çarşamba Can ile gözden geçirilecek."] },
    { title: "Çukurova Bayi müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: gübre fiyat endeksindeki artış ve ön sipariş avantajı.", "Esneklik alanları: vade 60 güne kadar, teslimat Şubat'ta iki parti.", "Sınır: %20 avans ve ek teminat olmadan 17,4 M₺'lik siparişe onay yok; ek iskonto en fazla %2."] },
    { title: "Hasat sonu saha gözlemleri", notebook: "Satış", section: "Saha Notları", daysAgo: 6, body: ["Konya ve Eskişehir çevresinde Ekim yağışı normalin yaklaşık %22 altında kaldı; geç ekilen parsellerde çıkış zayıf.", "Çiftçiler gübre fiyatının ilkbaharda yükselmesinden endişeli; ön sipariş ilgisi yüksek.", "Don riski için Aralık başında bitki koruma ve örtü önerileri bayilere iletilecek."] },
    { title: "Silo B-3 mısır partisi — aksiyon notları", notebook: "Satış", section: "Saha Notları", daysAgo: 1, body: ["B-3 hücresinde 1.100 ton dane mısır var; sıcaklık 31 °C, nem %14,2. Havalandırma artırıldı ama parti yaklaşık 10 gün içinde hareket etmeli.", "Seçenek 1: Karasu ikinci parti (2.200 ton) teklifini hızlandırıp bu partiyi ilk sevkiyata ayırmak. Seçenek 2: B-5 hücresine aktarmak; 18 saatlik ek mesai gerektiriyor.", "Silo toplamda %71 dolu, boş kapasite 13.920 ton; yer sorunu yok. Karar için Gülay Sezer'in ikinci parti yanıtı bekleniyor."] },
    { title: "Akçaova Birliği — gübre avansı hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 2, body: ["Birlik 180 ton CAN ve üre istiyor; üyeler ödemeyi hasat sonrası yapabildiği için avansı %10'a indirmek istiyorlar.", "Politikamız %20 avans; %10'a inmek için Selin Aydın'ın istisna onayı ve Can Yıldız'ın teminat görüşü gerekir. Alternatif: avansı %15 tutup kalan tutarı yaz sonu vadeli senede bağlamak.", "Toplantıda gübre fiyat tablosu ile DAP, üre ve CAN endeks gelişimi gösterilecek."] },
    { title: "Don ve kuraklık riski — bayi mesaj taslağı", notebook: "Satış", section: "Saha Notları", daysAgo: 3, body: ["Aralık'ın ilk haftasında gece sıcaklığının −6 °C altına düşme olasılığı %35; Konya ve Eskişehir öncelikli bölge.", "Mesaj taslağı: geç ekilen parsellerde gübre uygulamasını erteleme ve örtü önerisi, bitki koruma ürünü stok durumu ve bayi destek hattı.", "Uyarı eşiği −4 °C; aşılırsa 112 bayiye otomatik SMS gidecek. Metin Emre'nin ekibiyle birlikte kontrol edilecek."] },
    { title: "Meriç Süt Çiftlikleri ihtiyaç analizi", notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: ["Sekiz süt çiftliği; yıllık dane mısır ihtiyacı yaklaşık 2.400 ton, silajlık mısırı kendileri üretiyor.", "İstekleri: aylık 200 ton eşit teslimat, nem en çok %14, ödeme 30 gün vadeli.", "İlk adım Aralık için 300 tonluk teslimat teklifi; nem toleransı Karasu deneyimi nedeniyle şartnameye net yazılacak."] },
    { title: "Ekip 1:1 notları — Onur Polat", notebook: "Satış", section: "Ekip Notları", daysAgo: 3, body: ["Bayi hedefi %84; en büyük engel Çukurova ve Ege'deki gecikmiş çekler.", "Onur'un önerisi: Ege bayileri için taksitli yapılandırma, teminat olarak stok ve ek limit yerine kademeli sipariş.", "Gelişim planı: bayi kredi analizi eğitimi ve Can'la haftalık tahsilat toplantısına düzenli katılım.", "Ömer'in aksiyonu: yapılandırma önerisini Selin'e taşımak."] },
    { title: "Fındık ihracatı — kur ve forward notları", notebook: "Satış", section: "Toplantı Notları", daysAgo: 4, body: ["Kuzey Anadolu Fındık: 85 ton, 24 Kasım yükleme, EUR cinsinden fiyat.", "Can'ın önerisi: tutarın %70'i bir aylık forward ile sabitlensin (EUR/TRY 52,0), %30'u açık kalsın.", "Alıcı fiyatı sabitlemeden önce güncel kur varsayımımızı istiyor; Emine Taşkın'a yazılı iletilecek. Parite oynaklığı artarsa fiyat revizyonu talep edebilirler."] },
    { title: "Gökçeova Un ilk görüşme notları", notebook: "Satış", section: "Müşteri Notları", daysAgo: 7, body: ["Karşı taraf: genel müdür yardımcısı ve kalite sorumlusu. Yıllık ihtiyaç yaklaşık 9.000 ton; şu an iki tedarikçiyle çalışıyorlar.", "Şartname: protein en az %12,5, gluten indeksi 70 üzeri, hektolitre 78 kg. Numune testi sonucu beklenecek.", "İlk adım küçük bir deneme siparişi (320 ton); memnun kalırlarsa Ocak'tan sonra aylık alım. Sonraki adım: numune analizi ve TMO açıklamasına bağlı prim teklifi."] },
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
      // ───── ek cevaplar: özel konular önce, genel kalıplar (aşağıdaki) sonra gelir ─────
      {
        match: "hasat sonu|çek takvimi|vade takvimi|tahsilat planı|tahsilat takvimi",
        steps: ["Çek ve senet vadeleri okunuyor…", "Tahsilat takvimi derleniyor…"],
        text: `**Hasat sonu tahsilat takvimi**\n\nQ4 tahsilat hedefine kalan: **${KPI.tahsilatLeft} M₺** (${KPI.tahsilat} / ${KPI.tahsilatTarget} M₺ gerçekleşti).\n\n| Dönem | Vadesi gelen çek/senet |\n|---|---|\n| Bu hafta | ${KPI.checksWeek} M₺ |\n| Kasım'ın son iki haftası | 12,8 M₺ |\n| Aralık ilk yarısı | 13,6 M₺ |\n| Aralık ikinci yarısı | 8,6 M₺ |\n| **Toplam** | **44,4 M₺** |\n\nPlanlı vadeler hedefin yaklaşık 2,4 M₺ üzerinde; ancak vadesi geçmiş ${KPI.overdue} M₺ tahsil edilmezse tampon çok dar. Çukurova Bayi ve Ege Ziraat Deposu'nun çekleri en riskli iki kalem.`,
        chips: ["Bayi kredi limitleri nasıl?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kredi limit|bayi kredi|teminat|limit kullanım",
        steps: ["Bayi limitleri ve cari kayıtlar okunuyor…"],
        text: `**Bayi kredi limitleri**\n\n| Bayi | Limit | Kullanım | Oran | Vadesi geçmiş |\n|---|---|---|---|---|\n| ${CB} | 25,0 M₺ | 21,4 M₺ | %86 | 3,2 M₺ |\n| ${EZ} | 4,0 M₺ | 3,3 M₺ | %83 | 1,3 M₺ |\n| Ege'deki diğer bayi | 3,0 M₺ | 2,1 M₺ | %70 | 0,8 M₺ |\n| ${BZ} (yeni, öneri) | 8,0 M₺ | — | — | — |\n\n- Kullanımı %85'i aşan bayide yeni siparişe %20 avans ya da banka teminat mektubu isteniyor.\n- Çukurova için ek teminat kararı Can Yıldız'da; Ege Ziraat Deposu'nun üç taksitli yapılandırma önerisi Selin Aydın'ın onayına gidecek.\n- Limit ve cari hareketleri *Bayi Portalı*'ndan da izleyebilirsin.`,
        chips: ["Bayi tahsilatı nasıl gidiyor?", "Yeni müşteriler kimler?"],
      },
      {
        match: "kuraklık|don riski|don uyar|yağış|çıkış zayıf",
        steps: ["Hava ve saha verileri okunuyor…", "Parsel riski hesaplanıyor…"],
        text: "**Kuraklık ve don riski**\n\n- Ekim yağışı Konya ve Eskişehir çevresinde normalin yaklaşık **%22 altında**; geç ekilen parsellerde çıkış zayıf.\n- Hava modeli Aralık'ın ilk haftasında gece sıcaklığının −6 °C altına düşme olasılığını **%35** gösteriyor.\n- Satışını yaptığımız tohumun yaklaşık 22.000 dekarı geç ekim kapsamında: Konya 14.000, Eskişehir 8.000 dekar.\n\nÖnlem: uyarı eşiği −4 °C; aşılırsa 112 bayiye otomatik SMS gidecek. Bitki koruma ürünü ve örtü stoğu bayilerde yeterli; ilkbahar gübre fiyat endişesi de bu bölgede daha yüksek.\n\nElif Kaya'nın don riski toplantı davetine henüz yanıt vermedin.",
        chips: ["Ön sipariş durumu nedir?", "Buğday ve mısır fiyatları nasıl?"],
      },
      {
        match: "ihracat|konteyner|navlun|gümrük|akreditif",
        steps: ["İhracat siparişleri okunuyor…", "tyroRoute yükleme takvimini getiriyor…"],
        text: `**İhracat sevkiyatları**\n\n| Müşteri | Ürün | Hacim | Durum |\n|---|---|---|---|\n| ${FI} | Fındık | 85 ton | Yükleme 24 Kasım; EUR fiyatı sabitlenecek |\n| ${BT} | Nohut | 420 ton | Numune analizi bekleniyor |\n| ${FB} | Kırmızı mercimek | 300 ton | Teklif aşamasında; akreditifli, Ocak ilk yarısı |\n\nParite: EUR/USD 1,16, USD/TRY 44,2 (EUR/TRY ≈ 51,3). Fındık tahsilatı Aralık sonunda olacağından Finans tutarın %70'ini forward ile sabitlemeyi öneriyor.`,
        chips: ["Kur ve forward önerisi nedir?", "Aralık sevkiyat planı nasıl?"],
      },
      {
        match: "hücre|havalandırma|sıcaklık alarmı|aktarma|b-3",
        steps: ["Silo sensör kayıtları okunuyor…"],
        text: `**Silo B-3 hücresi**\n\nB-3'te 1.100 ton dane mısır var: sıcaklık **31 °C**, nem **%14,2**. Havalandırma artırıldı ama partinin yaklaşık 10 gün içinde hareket etmesi gerekiyor.\n\n| Seçenek | Etki |\n|---|---|\n| Karasu ikinci parti (2.200 ton) teklifini hızlandırıp bu partiyi ilk sevkiyata ayır | Ek maliyet yok; Gülay Sezer'in onayı gerekir |\n| B-5 hücresine aktar | 18 saat ek mesai; kalite riski düşük |\n\nSilo %${KPI.siloPct} dolu; boş kapasite ${KPI.siloFree} ton, yani aktarma için yer sorunu yok. İlk seçenek için Karasu'yla ilk partideki nem farkının (%14,2 / en çok %14) fiyatta uzlaşılması gerekiyor.`,
        chips: ["Depo doluluk durumu nedir?", "Aralık sevkiyat planı nasıl?"],
      },
      {
        match: "sertifikasyon|sertifikalı|çimlenme|çeşit|tohumluk|verim deneme",
        steps: ["Tohum laboratuvar kayıtları okunuyor…", "Ön sipariş verisi birleştiriliyor…"],
        text: `**Sertifikalı tohum: ön sipariş ve sertifikasyon**\n\nÖn sipariş: **${KPI.seedPreTon} ton** / ${KPI.seedPreTarget} ton hedef (%${KPI.seedPrePct}). Kızılvadi Birliği'nin 950 tonu onaylanırsa %91'e çıkar.\n\n| Parti | Çimlenme | Sonuç |\n|---|---|---|\n| Ekmeklik buğday (yeni çeşit) | %94 | Uygun |\n| Arpa (yeni çeşit) | %93 | Uygun |\n| Ekmeklik buğday (ikinci parti) | %88 | Asgari %92; yeniden test |\n\nYeniden test sonucu gelene kadar üçüncü parti satış listesinden çıkarıldı; etkilenen sipariş yok. Yeni çeşitlerde dekar başına ortalama %9 verim artışı ve kuraklık dayanım puanı 8/10 var.\n\nKızılvadi teslimatı Kasım sonunda; depo kabulü günde en fazla 12 araç.`,
        chips: ["Ön sipariş durumu nedir?", "Yeni müşteriler kimler?"],
      },
      {
        match: "forward|kur riski|kur varsay|\\bkur\\b|eur/usd|\\beur\\b|euro|dolar|\\busd\\b",
        steps: ["tyroTrader kur ve forward verisini okuyor…"],
        text: `**Kur ve forward önerisi**\n\nGüncel: EUR/USD 1,16; USD/TRY 44,2; EUR/TRY ≈ 51,3. Bir aylık EUR/TRY forward yaklaşık **52,0** (yaklaşık %1,4 prim).\n\n- ${FI}: 85 ton fındık, yaklaşık 16,6 M₺ (≈ 323 bin EUR); tahsilat Aralık sonunda.\n- Finans önerisi: tutarın **%70'i** forward ile sabitlensin, %30'u açık kalsın.\n- EUR/TRY'de %1'lik hareket tutarın tamamında yaklaşık 0,17 M₺ fark yaratır; %30'u açık bırakırsan etki yaklaşık 0,05 M₺.\n\nAlıcıya vereceğin kur varsayımı için Can Yıldız'ın yazdığı seçenekler e-postanda duruyor.`,
        chips: ["İhracat sevkiyatları nasıl?", "Buğday ve mısır fiyatları nasıl?"],
      },
      {
        match: "ilkbahar gübre|gübre ön sipariş|gübre sipariş|gübre tedarik|gübre stok|\\bdap\\b|\\büre\\b|\\bcan gübre|akçaova",
        steps: ["Gübre ön sipariş kayıtları okunuyor…", "Tedarikçi fiyatları getiriliyor…"],
        text: `**İlkbahar gübre ön siparişi ve fiyatlar**\n\nÖn sipariş: **${KPI.fertPreTon} ton** / ${KPI.fertPreTarget} ton hedef (%${KPI.fertPrePct}).\n\n| Ürün | Güncel fiyat |\n|---|---|\n| DAP | 31.800 ₺/ton |\n| Üre | 22.400 ₺/ton |\n| CAN | 17.900 ₺/ton |\n\nFiyat endeksi son dört haftada %5,8 yükseldi. Bekleyen iki sipariş: ${CB} 620 ton (DAP + üre) ve ${AU} 180 ton (CAN + üre); ikisi de kapanırsa ön sipariş 1.980 tona, yani hedefin %99'una çıkar.\n\nAkçaova avansı %10'a indirmek istiyor; politika %20 olduğundan Selin Aydın'ın istisna onayı gerekir.`,
        chips: ["Bayi kredi limitleri nasıl?", "Ön sipariş durumu nedir?"],
      },
      {
        match: "yeni müşteri|yeni bayi|kazanım|yeni firma",
        steps: ["Fırsat ve hesap kayıtları okunuyor…"],
        text: `**Yeni müşteriler ve fırsatlar**\n\n| Firma | Konu | Hacim | Durum |\n|---|---|---|---|\n| ${GU} | Ekmeklik buğday, ilk sipariş | 320 ton (≈ 5,2 M₺) | Numune uygun, teklif hazırlanıyor |\n| ${MS} | Dane mısır (yıllık 2.400 ton) | İlk teslim 300 ton | Fiyat bekleniyor |\n| ${BZ} | Çerçeve bayi sözleşmesi, 38 nokta | 120 ton tohum + 90 ton gübre | Sözleşme taslağı |\n| ${AU} | İlkbahar gübre ön siparişi | 180 ton | Avans pazarlığı |\n| ${FB} | Kırmızı mercimek ihracatı | 300 ton | Keşif |\n\nBu beş firma açık pipeline'ın küçük ama hızlı büyüyen bölümü; en yakın kapanış beklentisi ${GU}'ta.`,
        chips: ["Açık fırsatlarımı özetle", "Aralık sevkiyat planı nasıl?"],
      },
      {
        match: "sevkiyat|lojistik|araç planı|\\btır\\b|kantar|yükleme",
        steps: ["tyroRoute araç ve kantar planını okuyor…", "Aralık sevkiyatları sıralanıyor…"],
        text: `**Aralık sevkiyat planı**\n\n| Sevkiyat | Ton | Araç (≈ 27 ton) |\n|---|---|---|\n| ${OU}, 1. teslimat | 900 | 34 |\n| ${OU}, 2. teslimat | 900 | 34 |\n| ${KY}, ikinci parti (iki yarım) | 2 × 1.100 | 2 × 41 |\n| ${GU} (deneme) | 320 | 12 |\n\n${TT} Aralık'ın ilk haftası için en fazla **46 araç** garanti ediyor; Ovasan ilk teslimatı ile Karasu ilk yarısı aynı haftaya düşerse 75 araç gerekir. Öneri: Karasu ilk yarısını ikinci haftaya kaydır ve araç sayısını 20 Kasım'a kadar teyit et (navlun %6 artıyor, teyitle fiyat sabit kalıyor).\n\nKantar günlük kapasitesini ve B-3 mısır partisinin önceliğini Mert Aksoy ile netleştirmen gerekiyor.`,
        chips: ["Depo doluluk durumu nedir?", "İhracat sevkiyatları nasıl?"],
      },
      {
        match: "eğitim|akademi|webinar",
        steps: ["Eğitim takvimi okunuyor…"],
        text: "**Yaklaşan eğitimler**\n\n- *Hassas gübreleme* (Maslak Eğitim Salonu, 180 dk): takvimde var; ekibinden Zeynep, Kaan ve Onur kayıtlı.\n- *Bitki koruma ürünleri: etiket ve doz* (çevrim içi, 26 Kasım 14:00, 90 dk).\n- *Vade yönetimi ve teminat* (Finans ve Hukuk, 2 saat): kanal ekibine öneriliyor.\n- Zorunlu *gıda güvenliği ve kalıntı mevzuatı* eğitimi bu ay sonuna kadar tamamlanmalı (yaklaşık 40 dk).\n\nAkademi'de ayrıca silo kalite parametreleri videosu ve kurak sezonda bayi kredisi vaka çalışması yayında.",
        chips: ["Bu hafta toplantılarım neler?"],
      },
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

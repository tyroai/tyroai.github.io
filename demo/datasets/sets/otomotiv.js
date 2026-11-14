// OTOMOTİV veri seti — TYRO Tech'in otomotiv yedek parça, lastik ve filo bakım ürünlerini sattığı
// bir satış yöneticisi haftası: kış lastiği ve akü sezonu, periyodik bakım kampanyaları, yıl sonu filo
// yenilemeleri. Tüm kişi, firma ve rakamlar KURGUSALDIR.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: "26,4", // Q4 hedefi (milyon ₺)
  quotaOrders: "1.480", // Q4 sipariş adedi hedefi
  achieved: "15,8", // gerçekleşen (milyon ₺)
  achievedOrders: "890",
  achievedPct: 60,
  gap: "10,6", // hedefe kalan
  pipeline: "41,5", // açık pipeline (milyon ₺)
  openDeals: 27,
  winRate: 36,
  closedThisMonth: "5,9",
  serviceLevel: "93,4", // stok servis seviyesi (%)
  serviceTarget: 95,
  rmaRate: "1,9", // genel iade (RMA) oranı (%)
  rmaOpen: 142, // açık RMA kaydı
  rmaDays: "9,5", // ortalama RMA kapanış süresi (gün)
  rmaDaysTarget: 7,
  overdue: "3,2", // vadesi geçen alacak (milyon ₺)
  overdueInvoices: 18,
  dso: 58, // ortalama tahsilat süresi (gün)
  dsoTarget: 50,
  fleetContracts: 14, // aktif filo bakım sözleşmesi
  fleetVehicles: "5.800",
  renewals: 4, // yıl sonuna kadar yenilemeye gelen sözleşme
  renewalVehicles: "3.900",
  forecastError: "7,5", // haftalık talep tahmini sapması (%)
  delayDays: 12, // kış lastiği tedarik gecikmesi (gün)
  delayImpact: "0,9", // gecikmenin hedefe kayma riski (milyon ₺)
  altBatch: "4.000", // alternatif tedarikçiden ek parti (adet)
  newPipeline: "7,9", // yeni altı hesabın toplam fırsatı (milyon ₺)
}

const EY = "Ege Yetkili Servis Grubu"
const AP = "Anka Parça Toptan A.Ş."
const BF = "Boğaz Filo Kiralama"
const TL = "Trakya Lojistik Filosu"
const KY = "Kuzey Yan Sanayi A.Ş."
const SD = "Sepetpark Dijital Ticaret"
const HO = "Hazar Oto Dağıtım"
const TS = "Toros Servis Zinciri"
const GY = "Güneyyol Kiralama A.Ş." // uzun dönem filo kiralama
const DS = "Doruk Servis Merkezleri" // 54 noktalı servis zinciri
const MK = "Meridyen Kurye ve Dağıtım" // 960 van ve kamyonetlik kurye filosu
const LA = "Levent Oto Aksesuar Pazarlama" // aksesuar toptancısı
const YO = "Yeşilova Otobüs İşletmeleri" // şehirlerarası otobüs filosu
const NO = "Nilüfer Oto Online" // e-ticaret
const CF = "Çınar Fren Sistemleri A.Ş." // fren grubu tedarikçisi

export default defineDataset({
  id: "otomotiv",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Satış hedefi, parça ve filo fırsatları, stok ve servis ağı sorularını yanıtlar; haftalık özet hazırlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Parça talep ve stok tahmini.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Filo sözleşmeleri ve teklifler için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Bayi iskontosu ve fiyat simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Servis ağı, müşteri ve iade (RMA) içgörüleri.", icon: "Telescope02Icon" },
    { name: "tyroCatalog", type: "ai", description: "Parça–araç eşleştirme ve uyumluluk doğrulama.", icon: "DocumentValidationIcon" },
    { name: "tyroFleet", type: "ai", description: "Filo yenileme takvimi, bakım periyodu ve sözleşme risk uyarıları.", icon: "ChartHistogramIcon" },
    { name: "tyroRMA", type: "ai", description: "İade nedeni sınıflandırma ve tekrar eden arıza analizi.", icon: "AiBrain02Icon" },
    { name: "tyroSupply", type: "ai", description: "Tedarik gecikmesi erken uyarısı ve alternatif parti önerisi.", icon: "Robot01Icon" },
    { name: "Servis Ağı Portalı", type: "business", description: "Yetkili servis siparişleri ve stok görünümü", url: "#", icon: "Package01Icon" },
    { name: "Sevkiyat Takip", type: "business", description: "Depo çıkışları ve teslimat durumu", url: "#", icon: "CargoShipIcon" },
    { name: "Filo Takip Paneli", type: "business", description: "Sözleşme, araç sayısı ve bakım takvimi görünümü", url: "#", icon: "ChartHistogramIcon" },
    { name: "Tahsilat Takip", type: "business", description: "Vadesi geçen alacak ve müşteri bakiyesi", url: "#", icon: "AddInvoiceIcon" },
    { name: "Depo Yönetim Sistemi", type: "business", description: "Raf adresi, stok sayımı ve sevkiyat çıkışı", url: "#", icon: "Package01Icon" },
  ],

  weather: { now: "lightrain", base: 11, amp: 4, moods: ["lightrain", "rain", "cloudy", "fog", "cloudy", "lightrain", "partlycloudy", "rain", "cloudy", "fair"] },
  market: { rates: { USD: 44.1, EUR: 51.2, GBP: 58.0, CHF: 54.6 }, bist: 11285 },

  // ───────────── takvim ─────────────
  meetings: [
    {
      title: "Haftalık satış toplantısı",
      recur: "weekly",
      weekday: 1,
      time: "09:30",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Geçen haftanın sipariş ve kapanış sonuçları, stok servis seviyesi ve bu haftanın öncelikleri. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Sabah stok ve sevkiyat turu",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç", "Mert Aksoy"],
      body: "Kısa durum turu: dünün sevkiyatları, kritik kalemlerde stok, bugün teslim edilecek siparişler ve engeller.",
    },
    {
      title: "Pipeline ve filo yenileme gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık fırsatların aşama, olasılık ve kapanış tarihi kontrolü; yıl sonunda biten filo sözleşmeleri için yenileme planı.",
    },
    {
      title: "Aylık servis ağı performans toplantısı",
      recur: "monthly",
      dom: 12,
      time: "15:00",
      minutes: 60,
      where: "Maslak · Toplantı Odası 1",
      organizer: "Ömer Gümüş",
      with: ["Kaan Özdemir", "Onur Polat", "Gizem Tunç", "Mert Aksoy"],
      body: "Yetkili servis ve toptancı kanalında sipariş, iade (RMA) oranı ve teslim süresi performansı.",
    },
    {
      title: "Filo ve servis ağı operasyon senkronu",
      recur: "weekly",
      weekday: 3,
      time: "11:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Kaan Özdemir",
      with: ["Ömer Gümüş", "Mert Aksoy", "Gizem Tunç", "Onur Polat"],
      body: "Yetkili servis ve filo müşterilerinden gelen açık talepler, geciken sevkiyatlar ve saha ziyaret planı. Kısa ve aksiyon odaklı.",
    },
    {
      title: "İade (RMA) ve garanti gözden geçirme",
      recur: "weekly",
      weekday: 5,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Gizem Tunç",
      with: ["Ömer Gümüş", "Mert Aksoy", "Deniz Arslan"],
      body: "Açık RMA kayıtları, kapanış süresi ve tekrar eden iade nedenleri; yanlış parça eşleştirme vakalarının düzeltme listesi.",
    },
    {
      title: "Aylık stok ve talep planlama (S&OP)",
      recur: "monthly",
      dom: 20,
      time: "10:30",
      minutes: 60,
      where: "Maslak · Toplantı Odası 1",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Derya Çelik", "Elif Kaya", "Emre Şahin"],
      body: "Talep tahmini, stok kapsama günleri ve tedarik takvimi tek tabloda; kampanya takvimine göre yeniden sipariş noktaları güncellenir.",
    },
    { title: `${BF} — filo bakım sözleşmesi müzakeresi`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Barış Tekin (${BF})`, "Zeynep Acar", "Can Yıldız"], body: "2.400 araçlık üç yıllık bakım sözleşmesinin fiyat güncelleme, parça teslim SLA'sı ve ödeme vadesi maddeleri." },
    { title: "Kış lastiği tedarik gecikmesi — aksiyon toplantısı", day: 0, time: "16:30", minutes: 30, where: "Microsoft Teams", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Can Yıldız", "Derya Çelik"], body: "Ana tedarikçideki 12 günlük gecikme için alternatif parti ve müşteri öncelik sırası." },
    { title: `${EY} — kış paketi teklif sunumu`, day: 1, time: "10:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Tolga Bayraktar (${EY})`, "Kaan Özdemir", "Deniz Arslan"], body: "140 servis noktası için lastik ve akü paketinin son sunumu: stok taahhüdü, teslim takvimi ve iade penceresi." },
    { title: "Q4 hedef ve sezon değerlendirmesi", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin", "Mert Aksoy"], body: "Çeyrek sonu hedef gerçekleşme, kış sezonu stok riski ve son yedi haftanın aksiyon planı." },
    { title: "2027 kanal stratejisi çalıştayı (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "Yetkili servis, toptancı ve e-ticaret kanallarında 2027 hedefleri ve iskonto yapısı. Katılımınızı bekliyoruz." },
    { title: `${KY} — numune onayı ve kalite toplantısı`, day: 3, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Oğuz Aslantaş (${KY})`, "Deniz Arslan", "Mert Aksoy"], body: "Aydınlatma grubu numune test sonuçları ve düzeltme planı." },
    { title: `${AP} — çerçeve anlaşma fiyat görüşmesi`, day: 4, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Sevgi Karaca (${AP})`, "Onur Polat"], body: "Yıllık fren ve filtre çerçeve anlaşması için kademeli bayi iskontosu." },
    { title: "Teknik eğitim: parça eşleştirme ve garanti süreçleri", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat", "Gizem Tunç"], body: "TYRO Eğitim: araç uyumluluğu, OEM/OES/aftermarket ayrımı ve garanti–iade süreçleri." },
    { title: `${SD} — pazaryeri entegrasyonu görüşmesi`, day: 6, time: "16:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Ceren Uysal (${SD})`, "Elif Kaya"], body: "Katalog verisi, araç uyumluluk alanları ve komisyon oranı taslağı." },
    { title: `${HO} — ihracat sevkiyat planı`, day: 7, time: "11:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Fuat Sezer (${HO})`, "Mert Aksoy"], body: "İlk ihracat konteynerinin içeriği, gümrük belgeleri ve sevkiyat tarihi." },
    { title: "Ankara cross-dock merkezi ziyareti — iş gezisi", day: 9, allDay: true, span: 2, where: "Ankara", organizer: "Ömer Gümüş", with: ["Ömer Gümüş", "Kaan Özdemir", "Onur Polat"], body: "Ocak ayında açılacak cross-dock merkezinde saha turu; bölge servis ağı ve filo müşterileriyle görüşmeler." },
    { title: "Bölge servis ziyareti — İzmir", day: 8, allDay: true, where: "İzmir", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "İzmir, Manisa ve Aydın'daki yetkili servis ziyaretleri." },
    { title: "Yedek Parça Tedarik Zirvesi", day: 10, allDay: true, span: 2, where: "İstanbul", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Emre Şahin", "Mert Aksoy"], body: "İki günlük sektör buluşması: tedarikçi görüşmeleri ve stant ziyaretleri." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 1, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "İzmir bölge ziyareti hazırlığı, bölge hedefi ve servis noktası bazında açık fırsatlar." },
    { title: `${GY} — mevsimsel lastik ve akü programı`, day: 2, time: "11:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Esra Kılınç (${GY})`, "Zeynep Acar", "Mert Aksoy"], body: "1.850 araçlık uzun dönem kiralama filosunda mevsimsel lastik değişimi ve akü kontrol programı: bölge bazlı takvim, saha servis kapasitesi ve eski lastik saklama." },
    { title: `${DS} — konsinye stok pilotu`, day: 3, time: "15:45", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Hakan Soylu (${DS})`, "Onur Polat", "Mert Aksoy"], body: "54 servis noktasında akü ve filtre grubunda konsinye stok pilotu: ilk yükleme, sayım periyodu ve faturalama anı." },
    { title: "Kocaeli deposu — stok ve servis seviyesi gözden geçirme", day: 4, time: "12:30", minutes: 45, where: "Maslak · Toplantı Odası 2", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Derya Çelik", "Elif Kaya"], body: "Bölge deposunda kritik kalemlerin kapsama günleri, yeniden sipariş noktaları ve talep tahmini sapmaları." },
    { title: "Ekip 1:1 — Zeynep Acar", day: 4, time: "16:15", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Boğaz Filo müzakeresi sonrası aksiyonlar, filo hesap planı ve gelişim hedefleri." },
    { title: `${MK} — van filosu bakım paketi sunumu`, day: 5, time: "13:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pınar Okumuş (${MK})`, "Zeynep Acar", "Deniz Arslan"], body: "960 hafif ticari aracın bakım periyotları; balata ve filtre kalemlerinde sabit fiyatlı paket ve plaka bazlı raporlama." },
    { title: "Tahsilat ve vade risk toplantısı", day: 6, time: "11:30", minutes: 30, where: "Microsoft Teams", organizer: "Can Yıldız", with: ["Ömer Gümüş", "Derya Çelik", "Zeynep Acar"], body: `Vadesi geçen ${KPI.overdue} M₺ alacağın müşteri bazlı dağılımı, tahsilat takvimi ve sevkiyat kısıtı gereken hesaplar.` },
    { title: "Servis ağı memnuniyet anketi sonuçları (davet)", day: 6, time: "15:15", minutes: 45, where: "Microsoft Teams", organizer: "Emre Şahin", status: "notResponded", with: ["Ömer Gümüş", "Kaan Özdemir", "Gizem Tunç", "Deniz Arslan"], body: "Yetkili servis ve toptancı anketinde 312 yanıt: teslim süresi, iade kolaylığı ve teknik destek başlıkları. Katılımınızı bekliyoruz." },
    { title: `${CF} — fren balatası tahsisat görüşmesi`, day: 7, time: "10:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Sibel Yurtsever (${CF})`, "Mert Aksoy", "Derya Çelik"], body: "2027 ilk çeyrek fren balatası ve disk tahsisatı, talep tahmininin paylaşımı ve teslim gecikmesi maddeleri." },
    { title: `${LA} — silecek ve aksesuar sezon siparişi`, day: 7, time: "14:30", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Murat Ekinci (${LA})`, "Onur Polat"], body: "Silecek, cam suyu ve buz çözücü gruplarında kış sezonu sipariş planı ve vitrin desteği." },
    { title: `${YO} — ağır ticari lastik teklif sunumu`, day: 9, time: "10:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Cemal Dinçer (${YO})`, "Kaan Özdemir", "Mert Aksoy"], body: "410 otobüslük şehirlerarası filo için 295/80 R22.5 ve 315/80 R22.5 ağır ticari lastik, kaplama seçeneği ve sezonluk koruyucu bakım paketi." },
    { title: "Ekip 1:1 — Derya Çelik", day: 9, time: "16:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "Pipeline veri kalitesi, raporlama otomasyonu ve Q4 kapanış desteği." },
    { title: `${TS} — akü teslimat teyidi`, day: 11, time: "10:30", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Melis Gündoğdu (${TS})`, "Onur Polat"], body: "86 servis noktasına yapılan akü teslimatlarının teyidi ve eski akü (hurda) iadesinin toplama takvimi." },
    { title: "Ekip 1:1 — Onur Polat", day: 11, time: "14:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Kanal eğitim planı, toptancı hesapları ve iskonto onay süreci." },
    { title: "Talep tahmini ve stok planı bağlantısı — tyroForecast", day: 12, time: "11:30", minutes: 45, where: "Microsoft Teams", organizer: "Elif Kaya", with: ["Ömer Gümüş", "Mert Aksoy", "Derya Çelik"], body: `Kış lastiği ve akü haftalık talep tahmininin stok planına bağlanması; sapmayı %${KPI.forecastError}'ten %6'ya indirme hedefi.` },
    { title: "Ankara bölge bayi günü", day: 13, allDay: true, where: "Ankara", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir", "Onur Polat"], body: "Ankara ve Konya'daki toptancı ve servis zinciri ziyaretleri; kış paketi stok taahhütleri ve iade pencereleri yerinde anlatılacak." },
    { title: `${TL} — sözleşme yenileme teklifi sunumu`, day: 14, time: "14:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nalan Erdem (${TL})`, "Zeynep Acar", "Can Yıldız"], body: "620 araçlık filo için 15 Ocak'ta biten sözleşmenin yenileme teklifi: bakım bedeli, kış lastiği değişim paketi ve fiyat güncelleme formülü." },
    // geçmiş
    { title: `${BF} — filo envanter çalışması`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Barış Tekin (${BF})`, "Zeynep Acar"], body: "2.400 aracın marka–model dağılımı ve bakım periyotlarının netleştirilmesi." },
    { title: `${TL} — bakım planı toplantısı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nalan Erdem (${TL})`, "Deniz Arslan"], body: "620 araçlık filo için periyodik bakım ve kış lastiği değişim takvimi." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "İade (RMA) süreçleri, müşteri şikâyetleri ve gelişim planı." },
    { title: `${TS} — akü kampanyası başlangıcı`, day: -4, time: "10:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Melis Gündoğdu (${TS})`, "Onur Polat"], body: "86 servis noktası için akü kampanyasının sipariş ve teslimat akışı." },
    { title: `${DS} — akü siparişi değerlendirmesi`, day: -1, time: "11:15", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Hakan Soylu (${DS})`, "Onur Polat"], body: "54 noktanın Ekim akü siparişi, teslim performansı ve konsinye stok pilotu için ilk beklentiler." },
    { title: `${MK} — ihtiyaç analizi görüşmesi`, day: -2, time: "15:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pınar Okumuş (${MK})`, "Zeynep Acar"], body: "960 van ve kamyonet için mevcut bakım sağlayıcıları, arıza duruş süreleri ve lastik değişim maliyetleri." },
    { title: `${YO} — ilk ihtiyaç görüşmesi`, day: -5, time: "14:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Cemal Dinçer (${YO})`, "Kaan Özdemir"], body: "410 otobüs için lastik ömrü, kaplama uygulaması ve sezon öncesi bakım beklentileri." },
    { title: "Yıl sonu filo yenileme planlama atölyesi", day: -6, time: "10:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Ömer Gümüş", with: ["Zeynep Acar", "Kaan Özdemir", "Can Yıldız"], body: `Yıl sonuna kadar biten ${KPI.renewals} sözleşme için araç sayıları, fiyat güncelleme formülü ve görüşme sırası.` },
    { title: `${GY} — tanışma ve ihtiyaç toplantısı`, day: -8, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Esra Kılınç (${GY})`, "Zeynep Acar"], body: "Uzun dönem kiralama filosunun bölge dağılımı, mevcut lastik–akü tedarik modeli ve değişim dönemleri." },
    { title: `${EY} — yıllık iş birliği değerlendirmesi`, day: -9, time: "13:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Tolga Bayraktar (${EY})`, "Kaan Özdemir"], body: "140 servis noktasının yıllık sipariş, iade ve teslim süresi performansı; 2027 iş birliği çerçevesi." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Tolga Bayraktar (${EY})`,
      subject: "Re: Kış lastiği ve akü paketi teklifi",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "140 servis noktamız için hazırladığınız lastik ve akü paketini satın alma ve servis operasyon ekibimizle inceledik. Birim fiyatlar uygun; ancak 205/55 R16 ve 195/65 R15 ölçülerinde Kasım sonuna kadar teslim taahhüdü ve sezon sonu 30 günlük iade (RMA) penceresi talep ediyoruz.",
        "Yarınki sunumda stok planını birlikte netleştirelim. İyi çalışmalar.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Q4 hedef değerlendirme sunumu",
      at: { hoursAgo: 4 },
      unread: true,
      body: [
        "Ömer merhaba,",
        `Q4 değerlendirme toplantısı için kanal bazlı rakamları tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'ındayız (${KPI.achieved} M₺ / ${KPI.quota} M₺, ${KPI.achievedOrders} / ${KPI.quotaOrders} sipariş); açık pipeline ${KPI.pipeline} M₺.`,
        "Kış lastiği tedarik gecikmesinin hedefe etkisini ve riskli üç fırsatı da ekle lütfen.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: `${BF} sözleşme taslağı`,
      at: { days: 1, time: "17:40" },
      unread: true,
      body: [
        "Ömer Bey merhaba,",
        "Boğaz Filo'dan gelen karşı taslağı özetledim: araç başına aylık bakım bedelinin 36 ay sabit kalmasını, fiyat güncellemesinin yılda iki kez yapılmasını ve ödeme vadesinin 60 güne uzatılmasını istiyorlar. Yarınki 14:00 toplantısından önce on dakika görüşebilir miyiz?",
      ],
    },
    {
      from: "Can Yıldız",
      subject: `${TL} — fatura onayı`,
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: ["Merhaba Ömer,", "Trakya Lojistik Filosu'nun ilk dönem bakım faturası için satış onayı bekliyor. Talep edilen %4 ek filo iskontosunu teyit eder misin? Onay gelince faturayı hemen keseceğim."],
    },
    {
      from: `Barış Tekin (${BF})`,
      subject: "Müzakere toplantısı gündemi",
      at: { days: 1, time: "14:20" },
      body: ["Merhaba,", "Yarınki toplantı için gündem önerimiz: (1) fiyat güncelleme periyodu, (2) parça teslim SLA'sı, (3) ödeme vadesi, (4) araç envanterinin ilk faz devreye alma takvimi. Eklemek istediğiniz başlık varsa bildirin."],
    },
    {
      from: `Sevgi Karaca (${AP})`,
      subject: "Yıllık çerçeve anlaşma — fren ve filtre kalemleri",
      at: { days: 2, time: "16:05" },
      body: [
        "Ömer Bey merhaba,",
        "Fren balatası, disk ve filtre gruplarında bayi iskonto matrisini inceledik. Yıllık 3 M₺ üzeri alımda ek %2 olacak şekilde kademeli iskonto önerinizi kabul edebiliriz; karşılığında OES kalitesindeki ürünlerde 48 saatlik teslim süresi taahhüdü bekliyoruz.",
        "Hafta içinde kısa bir görüşme ayarlayabilir miyiz?",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Kış lastiği sevkiyat takvimi",
      at: { days: 2, time: "10:30" },
      body: [
        "Ömer,",
        `Ana tedarikçiden gelen son bilgiye göre 205/55 R16 ve 195/65 R15 kış lastiği partisi 12 gün gecikecek. Stok servis seviyemiz şu an %${KPI.serviceLevel} (hedef %${KPI.serviceTarget}); önlem almazsak sezon ortasında %90'ın altına inebilir.`,
        "Alternatif tedarikçiden ek parti için hangi müşteriye hangi ölçüden öncelik verileceğini satış tarafında netleştirmemiz gerekiyor; toplantı daveti gönderdim.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 45. hafta",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: ["Merhaba Ömer Bey,", `Bu ay şimdiye kadar ${KPI.closedThisMonth} M₺ kapanış gerçekleşti; kazanma oranı %${KPI.winRate}, sipariş adedi ${KPI.achievedOrders}. Rapor ekte ve paylaşılan klasörde.`],
    },
    {
      from: `Nalan Erdem (${TL})`,
      subject: "Araç listesi ve bakım takvimi",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "620 araçlık filomuzun güncel plaka ve kilometre listesini ekledim. Periyodik bakım takvimini 15 Ocak'taki sözleşme bitişine göre yeniden planlamak istiyoruz; parça eşleştirmesi için marka–model–motor bilgileri listede yer alıyor."],
    },
    {
      from: `Oğuz Aslantaş (${KY})`,
      subject: "Aydınlatma grubu numune test sonuçları",
      at: { days: 4, time: "15:20" },
      body: ["Ömer Bey,", "Gönderdiğiniz far ve stop lambası numunelerinin laboratuvar testlerinde 14 kalemden 12'si geçti; iki kalemde ışık dağılımı toleransın dışında kaldı. Düzeltilmiş numuneleri iki hafta içinde bekliyoruz; sonrasında seri üretim siparişi için onay verebiliriz."],
    },
    {
      from: `Ceren Uysal (${SD})`,
      subject: "Pazaryeri listeleme anlaşması",
      at: { days: 5, time: "13:25" },
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Katalogunuzdaki 3.200 parça kalemi için araç uyumluluk verisine (marka–model–yıl) ihtiyacımız var; veri gelince listelemeyi Aralık başında açabiliriz. Kış sezonu için akü ve silecek gruplarını öne almak istiyoruz.",
        "Komisyon oranı taslağı ekte.",
      ],
    },
    {
      from: `Fuat Sezer (${HO})`,
      subject: "İhracat proforması ve sevkiyat planı",
      at: { days: 6, time: "15:40" },
      body: ["Ömer Bey merhaba,", "Proforma faturadaki EUR fiyatlar uygun görünüyor. Fren ve filtre gruplarını tek konteynerde toplayabilirsek navlun maliyetini düşürebiliriz; ilk sevkiyat için Aralık ortasını hedefliyoruz. Menşe ve gümrük belgeleri için Operasyon ekibinden bir irtibat kişisi rica ederim."],
    },
    {
      from: `Melis Gündoğdu (${TS})`,
      subject: "Akü kampanyası sipariş teyidi",
      at: { days: 6, time: "11:15" },
      body: ["Merhaba,", "86 servis noktamız için akü kampanyası siparişimizi onayladık. Teslimatların noktalara 20 Kasım'dan önce yapılmasını rica ederiz; eski akü iadesi (hurda) prosedürünü de netleştirelim."],
    },
    { from: "Kaan Özdemir", subject: "İzmir bölge servis ziyaret planı", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, İzmir, Manisa ve Aydın'daki yetkili servis ziyaretlerini tek güne topladım. Plan ekte; onayınızla randevuları sabitleyeceğim. Ziyaretlerde kış paketi stok taahhüdünü ve iade koşullarını anlatacağım."] },
    { from: "Emre Şahin", subject: "Kış kampanyası broşürü onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, kış kampanyası broşürünün son hali ekte. Lastik + akü paketi iskonto oranı (%7) ve 15 Aralık bitiş tarihi doğru mu, satış tarafı bir kez daha baksın istedik."] },
    { from: "Deniz Arslan", subject: "Parça eşleştirme veri güncellemesi", at: { days: 9, time: "16:30" }, body: ["Ömer,", "Parça–araç eşleştirme veri tabanını bu ay 42.000 yeni kayıtla güncelledik. Özellikle ağır ticari araç filtre grupları artık filo müşterilerinin plaka listeleriyle otomatik eşleşiyor; sunumlarda kullanabilirsin."] },
    { from: "Elif Kaya", subject: "Talep tahmini modeli: pilot sonuçları", at: { days: 10, time: "14:45" }, body: ["Ömer Bey,", "Kış lastiği ve akü için haftalık talep tahmini modelinin pilot sonuçları hazır: son sekiz haftada ortalama sapma %7,5. Sıradaki adım tahmini stok planlamasına bağlamak; önümüzdeki hafta kısa bir sunum yapabilirim."] },

    // ───── ikinci dalga: yeni hesaplar, tahsilat, iade ve tedarik ─────
    {
      from: `Esra Kılınç (${GY})`,
      subject: "Mevsimsel lastik ve akü değişim programı — teklif talebi",
      at: { minutesAgo: 40 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Tanışma toplantımızdaki konuşmamız doğrultusunda 1.850 araçlık filomuz için kış dönemi lastik değişimi ve akü kontrol programını fiyatlandırmanızı rica ediyoruz. Araçların yaklaşık %60'ı İstanbul ve Kocaeli'de, kalanı Ankara ile İzmir'de; değişimlerin 28 Kasım'a kadar tamamlanması gerekiyor.",
        "Söküm sonrası kullanılmış lastiklerin saklanması ve akü hurda iadesi için de ayrı kalemde fiyat görmek isteriz. Teklifi bu hafta içinde alabilirsek yönetim onayına yetiştirebiliriz.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Alternatif tedarikçi: ek parti maliyeti ve teslim planı",
      at: { hoursAgo: 5 },
      unread: true,
      flagged: true,
      body: [
        "Ömer,",
        `Alternatif tedarikçiyle ${KPI.altBatch} adetlik ek parti için görüşmeyi tamamladık. İlk 1.500 adet 9 günde, kalan 2.500 adet 16 günde teslim edilebiliyor; birim maliyet ana tedarikçiye göre yaklaşık %5,5 yüksek.`,
        "Ücretsiz sevkiyat koşulunu 500 adet üzerinde tutarsak marj korunuyor. Öncelik sırasını satış tarafı netleştirirse siparişi hemen geçebilirim; Ege Yetkili Servis Grubu ve Trakya Lojistik'in ölçüleri ilk partide yer almalı.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Vadesi geçen alacaklar — Kasım listesi",
      at: { hoursAgo: 6 },
      unread: true,
      flagged: true,
      body: [
        "Merhaba Ömer,",
        `Kasım başı itibarıyla ${KPI.overdueInvoices} faturada toplam ${KPI.overdue} M₺ vadesi geçmiş alacağımız var; ortalama tahsilat süremiz ${KPI.dso} gün (hedef ${KPI.dsoTarget}). En yüksek üç kalem Hazar Oto Dağıtım, Anka Parça ve Toros Servis Zinciri hesaplarında.`,
        "Vadesi 30 günü aşan hesaplarda yeni sevkiyattan önce satış ekibinin müşteriyi aramasını istiyorum. Hesap bazlı liste ekte; tahsilat toplantısında müşteri sahiplerinden aksiyon bekliyorum.",
      ],
    },
    {
      from: `Hakan Soylu (${DS})`,
      subject: "Konsinye stok pilotu — nokta listesi ve sayım periyodu",
      at: { days: 1, time: "16:10" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "54 servis noktamızdan pilot için 12 noktayı seçtik; liste ekte. Akü ve yağ filtresi gruplarında ilk yüklemenin Kasım sonunda yapılmasını, sayımın ayda bir olmasını tercih ederiz.",
        "Faturalamanın servis tüketimi anında değil aylık sayım sonrası yapılmasını öneriyoruz; bu konuda finans tarafınızın görüşünü ve stok sigortası koşullarını rica ederim.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Ekim iade (RMA) analizi — öne çıkan bulgular",
      at: { days: 1, time: "13:50" },
      unread: true,
      body: [
        "Ömer Bey merhaba,",
        `Ekim analizini tamamladım: genel iade oranı %${KPI.rmaRate}, ancak açık ${KPI.rmaOpen} RMA kaydının ortalama kapanış süresi ${KPI.rmaDays} gün (hedef ${KPI.rmaDaysTarget}). İadelerin %38'i yanlış parça eşleştirmesinden, %21'i ambalaj hasarından kaynaklanıyor.`,
        "E-ticaret kanalındaki iadelerin yarısından fazlası uyumluluk alanı eksik ürünlerde çıkıyor. Deniz'le çapraz referans düzeltmesi için bir liste çıkarmayı öneriyorum; haftalık RMA toplantısında da konuşabiliriz.",
      ],
    },
    {
      from: `Barış Tekin (${BF})`,
      subject: "Envanter çalışması sonrası eksik kayıtlar",
      at: { days: 1, time: "16:50" },
      body: ["Merhaba,", "Envanter çalışmasında 63 aracın motor bilgisinin, 41 aracın da güncel kilometre bilgisinin eksik olduğunu gördük. Parça eşleştirmesi bu kayıtlara bağlı olduğu için üç iş günü içinde tamamlanmış listeyi göndereceğiz; sözleşme taslağındaki araç sayısında değişiklik beklemiyoruz."],
    },
    {
      from: `Pınar Okumuş (${MK})`,
      subject: "Van filosu bakım paketi — teklif talebi",
      at: { days: 2, time: "10:05" },
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Görüşmemizin ardından 960 aracımız için bakım paketi şartlarını yazılı olarak iletiyorum: balata ve filtre kalemlerinde plaka başına sabit yıllık bedel, lastikte liste fiyatı üzerinden sabit iskonto, arıza duruşunda 24 saat içinde parça teslimi ve plaka bazlı aylık raporlama. Ödeme vadesi 45 gün olmalı.",
        "Kurye operasyonumuz yılın son iki ayında en yoğun dönemde; paketin Aralık başında devreye girmesi bizim için önemli.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: "Güneyyol Kiralama teklif varsayımları",
      at: { days: 2, time: "17:20" },
      body: ["Ömer Bey merhaba,", "Güneyyol için mevsimsel değişim, lastik saklama ve akü kontrol paketinin ilk fiyat taslağı hazır: 1.850 araç için araç başına yaklaşık 1.135 ₺, toplam 2,1 M₺. Saha servis maliyetini ve saklama kalemini ayrı satırlarda gösterdim; rakibin saklamayı ücretsiz sunduğunu düşünürsek paket içinde göstermek daha doğru olabilir. Toplantıdan önce on dakika konuşalım mı?"],
    },
    {
      from: "Selin Aydın",
      subject: "2027 kanal stratejisi: iskonto basamakları için görüşün",
      at: { days: 2, time: "09:25" },
      body: [
        "Ömer merhaba,",
        "Çalıştay öncesinde yetkili servis, toptancı ve e-ticaret kanalları için iskonto basamaklarını sadeleştirmeyi düşünüyorum. Saha gözlemine ihtiyacım var: hangi hesaplar mevcut basamaklarda zorlanıyor, hangilerinde gereğinden fazla iskonto veriliyor?",
        "Kısa bir not yeterli. Çalıştay davetini henüz yanıtlamadığını gördüm; katılımını teyit edersen sevinirim.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "Anka Parça iskonto matrisi — marj kontrolü",
      at: { days: 3, time: "09:35" },
      body: [
        "Ömer Bey merhaba,",
        "Sevgi Hanım'ın önerdiği kademeli yapıyı Derya ile marj tablosunda denedik: yıllık 3 M₺ üzerinde ek %2 uygularsak toplam marj %9,6'ya iniyor, yani %9 alt sınırının üzerinde kalıyor. 5 M₺ üzerinde ek %3 ise sınıra yaklaşıyor; bunu pazarlıkta elde tutmayı öneriyorum.",
        "48 saatlik OES teslim taahhüdünü kabul edersek depo çıkış süresi için Mert'in teyidine ihtiyacımız var.",
      ],
    },
    {
      from: `Tolga Bayraktar (${EY})`,
      subject: "Kış paketi — sezon sonu iade penceresi için hukuk ön görüşü",
      at: { days: 3, time: "14:05" },
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "Satın alma ekibimiz 30 günlük iade penceresi talebini hukuka taşıdı. Ön görüşleri: pencere yalnızca ambalajı açılmamış ve kullanılmamış ürünler için geçerli olmalı, iadeler sayım tutanağıyla birlikte yapılmalı. Akülerde şarj kaybı kontrolü için test raporu isteniyor.",
        "Bu koşulları teklif ekine işleyebilirseniz sunum öncesinde iç onayı almış oluruz.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "Manisa ve Aydın servislerinin stok taahhüdü talepleri",
      at: { days: 3, time: "17:30" },
      body: ["Ömer Bey,", "Ziyaret öncesinde Manisa ve Aydın'daki yedi servis noktası taleplerini iletti: toplam 96 adet 205/55 R16 ve 70 adet 195/65 R15 için kesin teslim tarihi istiyorlar; üç noktada ayrıca akü hurda toplama sıklığı sorun olmuş. Gecikme bilgisini ziyaretten önce paylaşmanın daha doğru olacağını düşünüyorum."],
    },
    {
      from: `Cemal Dinçer (${YO})`,
      subject: "Ağır ticari lastik teklifi hakkında",
      at: { days: 4, time: "15:50" },
      body: [
        "Ömer Bey merhaba,",
        "410 otobüslük filomuz için 295/80 R22.5 ve 315/80 R22.5 ölçülerinde yeni lastik yanında kaplama (yeniden sırt geçirme) seçeneğini ve lastik başına kilometre garantisini içeren bir teklif görmek isteriz.",
        "Sezon yoğunluğu başlamadan, Aralık ortasına kadar ilk 150 lastiğin teslimi mümkün mü? Teslim takvimini teklifte ayrıca belirtirseniz sevinirim.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "Pipeline kayıtlarında geçmiş kapanış tarihleri",
      at: { days: 5, time: "09:45" },
      body: ["Merhaba Ömer Bey,", `${KPI.openDeals} açık fırsatın 6'sında kapanış tarihi geçmiş görünüyor, 3'ünde de aşama bilgisi iki haftadır güncellenmemiş. Tahmin raporunun güvenilir çıkması için ay sonu raporundan önce satış arkadaşlarından güncelleme isteyeceğim; liste ekte.`],
    },
    {
      from: `Sibel Yurtsever (${CF})`,
      subject: "2027 ilk çeyrek fren balatası tahsisat çizelgesi",
      at: { days: 5, time: "16:20" },
      body: [
        "Ömer Bey merhaba,",
        "2027 Ocak–Mart dönemi için ön balata ve disk tahsisatınızı aylık 36.000 set olarak planladık. Tahsisatı kesinleştirmek için talep tahmininizi 30 Kasım'a kadar iletmenizi rica ederiz.",
        "Toplantıda iki başlıkta mutabakat arıyoruz: teslim gecikmesinde günlük %0,5 bedel indirimi ve kalite red oranının %0,8'i aşması halinde parti değişimi.",
      ],
    },
    {
      from: `Nalan Erdem (${TL})`,
      subject: "Sözleşme yenileme teklifi için beklentilerimiz",
      at: { days: 6, time: "10:25" },
      body: ["Merhaba Ömer Bey,", "15 Ocak'ta biten bakım sözleşmesinin yenilemesi için kış lastiği değişim paketini de içeren tek bir teklif görmek istiyoruz. Araç başına yıllık maliyetin geçen yıla göre %6'dan fazla artmaması ve bakım bedelinin kilometre bazlı hesaplanması yönetimimizin başlıca beklentileri."],
    },
    {
      from: `Murat Ekinci (${LA})`,
      subject: "Kış sezonu silecek ve aksesuar siparişi",
      at: { days: 6, time: "11:40" },
      body: [
        "Merhaba,",
        "Bayi ağımızdaki 38 mağaza için silecek takımı, cam suyu ve buz çözücü siparişimizi 1,0 M₺ civarında planlıyoruz. Kış paketiyle birlikte akü ve silecek gruplarını tek sevkiyatta alabilirsek mağazalar için çok daha kolay olur.",
        "Vitrin standı ve broşür desteğiniz olup olmadığını da öğrenmek isteriz.",
      ],
    },
    {
      from: `Aslı Tuncer (${NO})`,
      subject: "Araç uyumluluk veri akışı — test sonuçları",
      at: { days: 7, time: "12:15" },
      body: [
        "Merhaba Ömer Bey,",
        "Test akışında 3.400 ürünün 212'sinde marka–model–yıl alanı boş geldi; bu ürünleri sitede uyumsuz olarak işaretlemek zorunda kaldık. İade nedenlerimizin başında yanlış ölçü ve uyumsuzluk geliyor, bu yüzden alanların tam gelmesi bizim için öncelikli.",
        "Düzeltilmiş dosyayı aldığımızda ilk 500 ürünle canlı yayına geçebiliriz.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Bayi webinarı: kış sezonu ürün bilgisi — konuşmacı daveti",
      at: { days: 9, time: "10:40" },
      body: ["Ömer merhaba,", "Aralık başında 320 bayimize yönelik bir kış sezonu webinarı planlıyoruz. Lastik–akü paketi koşullarını ve iade penceresini anlatacak 10 dakikalık bir konuşma için seni düşündük; toplam süre 45 dakika olacak, ürün bilgisi bölümünü Deniz yapacak. Uygunsan bir tarih önerir misin?"],
    },
    {
      from: "Mert Aksoy",
      subject: "Kocaeli deposu döngüsel sayım sonuçları",
      at: { days: 11, time: "10:15" },
      body: ["Ömer,", "Kocaeli deposunda ilk döngüsel sayımı tamamladık: 12.000 kalemin 94'ünde fark çıktı (%0,8) ve farkların çoğu raf adresi hatasından kaynaklanıyor, fiziki kayıp değil. Otomatik raf yönetiminin ilk haftaları için beklenen bir düzey; servis seviyesine etkisi görünmüyor. Kış lastiği kalemlerinde ikinci bir sayımı ayrıca yapacağız."],
    },
    {
      from: "Deniz Arslan",
      subject: "OEM–aftermarket çapraz referans hataları",
      at: { days: 13, time: "14:10" },
      body: ["Ömer,", "Çapraz referans tablosunda 318 kayıtta bir OEM koduna iki farklı aftermarket parçası bağlı kalmış; Gizem'in RMA analizindeki yanlış eşleştirme iadelerinin büyük kısmı buradan çıkıyor. Düzeltmeyi bu ay içinde bitireceğiz; o zamana kadar filo tekliflerinde plaka listesiyle doğrulama yapmanı öneririm."],
    },
    {
      from: `Tolga Bayraktar (${EY})`,
      subject: "Servis noktaları kış ihtiyaç listesi",
      at: { days: 14, time: "15:00" },
      body: ["Merhaba Ömer Bey,", "140 servis noktamızın ölçü bazlı kış ihtiyaç listesini ekledim. 205/55 R16 ve 195/65 R15 ölçüleri toplamın yaklaşık %55'ini oluşturuyor; akü tarafında en yoğun talep 70 Ah. Teklifi bu listeye göre güncelleyebilirseniz değerlendirmemiz hızlanır."],
    },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları açıklandı", at: { days: 1, time: "09:05" }, body: ["Şirketimiz üçüncü çeyreği geçen yılın aynı dönemine göre %14 büyümeyle tamamladı.", "Büyümede filo bakım sözleşmeleri ve e-ticaret kanalı öne çıktı; filo sözleşmelerinin toplam gelirdeki payı %31'e ulaştı. Tüm ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "Kocaeli'de yeni bölge deposu hizmete girdi", at: { days: 4, time: "10:20" }, body: ["18.000 m² kapalı alana sahip yeni bölge depomuz bu hafta faaliyete geçti. Marmara ve Trakya'daki servis noktalarına teslim süresi 48 saatten 24 saate inecek.", "Depoda 12.000 parça kalemi için otomatik raf yönetimi kullanılacak."] },
    { feed: "haberler", subject: "Kış lastiği tedariki: ana tedarikçide 12 günlük gecikme", at: { days: 2, time: "14:10" }, body: ["Tedarikçimizin üretim hattındaki bakım nedeniyle 205/55 R16 ve 195/65 R15 kış lastiği sevkiyatları yaklaşık 12 gün gecikecek.", "Operasyon ekibi alternatif tedarikçiyle ek parti görüşmesi yapıyor; kritik müşteriler için öncelik listesi satış ekibiyle paylaşıldı."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: depo yönetim sistemi cumartesi 02:00–04:00 arası kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–04:00 arasında depo yönetim ve sipariş sistemlerinde bakım yapılacak. Bu sürede stok sorgulama ve sipariş girişi yapılamayacak."] },
    { feed: "duyuru", subject: "Kış sezonu kampanyası başladı", at: { days: 6, time: "09:00" }, important: true, body: ["Kış sezonu kampanyası bugün başladı: lastik ve akü paketlerinde %7 ek bayi iskontosu, 500 adet üzeri siparişlerde ücretsiz sevkiyat. Kampanya 15 Aralık'a kadar geçerli; detaylar ekteki broşürde."] },
    { feed: "duyuru", subject: "Maslak otoparkı: B1 katı 12–14 Kasım arası kapalı", at: { days: 11, time: "14:30" }, body: ["Kapalı otoparkta zemin kaplaması yapılacağı için B1 katı 12–14 Kasım arasında kullanıma kapalı olacak. Çalışanlarımız için açık otoparkta ek kontenjan ayrıldı."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Hande Korkmaz", at: { days: 3, time: "09:30" }, body: ["Operasyon ekibimize Depo ve Stok Planlama Uzmanı olarak katılan Hande Korkmaz'a hoş geldin diyoruz. Hande, bölge depolarındaki stok seviyelerinin takibini yürütecek.", "Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan arkadaşlarımız: Onur Polat (Çarşamba) ve Mert Aksoy (Cuma).", "İyi ki doğdunuz, nice mutlu yıllara!"] },
    { feed: "ik", subject: "Yıl sonu çalışma takvimi ve izin planlaması", at: { days: 9, time: "10:00" }, body: ["Yıl sonu envanter sayımı nedeniyle 24–31 Aralık arasında depo vardiya düzeni değişecek. Bu döneme izin planlayan arkadaşlarımızın talebini 30 Kasım'a kadar yöneticileriyle birlikte girmesi rica olunur."] },
    { feed: "egitim", subject: "Teknik eğitim: parça eşleştirme ve garanti süreçleri", at: { days: 5, time: "11:15" }, body: ["Üç saatlik teknik eğitimde araç uyumluluğu, OEM/OES/aftermarket ayrımı ve garanti–iade (RMA) süreçleri anlatılacak. Kontenjan 25 kişidir; saha ve satış ekiplerine öncelik verilir."] },
    { feed: "egitim", subject: "Sürücü güvenliği eğitimi: kış sürüşü ve saha araçları", at: { days: 8, time: "09:40" }, body: ["Saha araçlarını kullanan tüm çalışanlar için kış sürüşü tekniklerini ve lastik–fren kontrol alışkanlıklarını kapsayan yarım günlük eğitim 25 Kasım'da yapılacak.", "Kayıtlar İK portalından açıldı."] },
    { feed: "egitim", subject: "Zorunlu İSG eğitimi: depo ve sevkiyat", at: { days: 12, time: "09:20" }, body: ["Depo ve sevkiyat süreçlerinde çalışanların yıllık iş sağlığı ve güvenliği eğitimini bu ay sonuna kadar tamamlaması gerekiyor."] },
    { feed: "akademi", subject: "Yeni modül: araç uyumluluğu ve parça eşleştirme temelleri", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: bir parçanın hangi marka, model ve motor grubuyla uyumlu olduğu nasıl doğrulanır? 30 dakikalık video ve uygulama dosyaları."] },
    { feed: "akademi", subject: "Yeni modül: kış lastiği ve akü ürün bilgisi", at: { days: 10, time: "15:30" }, body: ["Kış lastiği ölçü okuma, akü kapasitesi (Ah) ve soğuk çalıştırma değerleri anlatan 20 dakikalık modül yayında. Müşteri görüşmeleri öncesi hızlı bir tekrar için ideal."] },
    { feed: "kulup", subject: "Klasik araç kulübü: Cumartesi buluşması ve kış bakım sohbeti", at: { days: 3, time: "12:30" }, body: ["Klasik araç meraklıları Cumartesi sabahı Maslak otoparkında buluşuyor. Kış bakım ipuçları paylaşılacak; katılmak isteyen herkes davetlidir."] },
    { feed: "kulup", subject: "Gönüllülük günü: okullarda trafik güvenliği anlatımı", at: { days: 10, time: "13:00" }, body: ["Kasım ayı gönüllülük gününde ilkokul öğrencilerine trafik güvenliği ve emniyet kemeri anlatımı yapacağız. Kayıtlar açıldı."] },

    // ───── Keşfet akışı: ikinci dalga ─────
    { feed: "haberler", subject: "Ankara bölge cross-dock merkezi Ocak'ta açılıyor", at: { days: 7, time: "09:50" }, body: ["İç Anadolu'daki servis noktalarına hizmet verecek 6.500 m² cross-dock merkezimiz Ocak ayında açılıyor. Ankara ve çevre illere teslim süresi 36 saatten 24 saate inecek.", "Merkez, Kocaeli deposundan gelen sevkiyatları gün içinde ayrıştırarak dağıtıma verecek; ilk aşamada 40 çalışan görev alacak."] },
    { feed: "haberler", subject: "Piyasa bülteni: Ekim'de kış lastiği talebi geçen yıla göre %18 arttı", at: { days: 5, time: "11:30" }, body: ["Piyasa Analizi ekibimizin derlediği bültene göre Ekim ayında kış lastiği talebi geçen yılın aynı dönemine göre %18, akü talebi %11 arttı. Artışın ana nedenleri mevsim normallerinin altında seyreden sıcaklıklar ve filo müşterilerinin siparişlerini erkene çekmesi.", "Bültenin tamamı paylaşılan Raporlar klasöründe."] },
    { feed: "haberler", subject: "tyroForecast kış sezonu tahmin modeli canlıya alındı", at: { days: 9, time: "14:00" }, body: [`Elif Kaya ve Deniz Arslan'ın geliştirdiği haftalık talep tahmin modeli kış lastiği ve akü kalemlerinde canlıya alındı. Son sekiz haftalık pilotta ortalama sapma %${KPI.forecastError} olarak ölçüldü.`, "Model, stok planlama ekibinin yeniden sipariş noktalarını otomatik önermesini sağlayacak."] },
    { feed: "duyuru", subject: "E-irsaliye şablonu 1 Aralık'ta değişiyor", at: { days: 3, time: "13:20" }, body: ["Finans ekibimiz yeni e-irsaliye şablonuna 1 Aralık'ta geçiyor. Bu tarihten sonra eski şablonla kesilen irsaliyeler müşteri sistemlerinde kabul edilmeyecek.", "Sevkiyat çıkışı yapan arkadaşlarımız için kısa bir kılavuz paylaşılan klasöre eklendi."] },
    { feed: "duyuru", subject: "Servis Ağı Portalı: iade (RMA) talepleri artık portaldan açılıyor", at: { days: 5, time: "09:15" }, body: ["Servis Ağı Portalı'nın yeni sürümünde iade (RMA) talebi fotoğraf ve plaka bilgisiyle doğrudan açılabiliyor; talep durumu müşteriye otomatik bildiriliyor.", "Yeni akış Kasım ayı içinde tüm yetkili servislere açılacak. Müşterilerinizden talep gelirse portala yönlendirebilirsiniz."] },
    { feed: "duyuru", subject: "Kocaeli deposunda yangın ve tahliye tatbikatı", at: { days: 8, time: "12:00" }, body: ["Kocaeli deposunda Kasım'ın son haftasında yangın ve tahliye tatbikatı yapılacak. Tatbikat yaklaşık 20 dakika sürecek; bu sürede sevkiyat çıkışı kısa süreli durdurulacak.", "Depoda bulunan çalışanların ve ziyaretçilerin toplanma alanını önceden öğrenmesi rica olunur."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Bora Ekmekçi", at: { days: 8, time: "09:45" }, body: ["Operasyon ekibimize Servis Ağı Koordinatörü olarak katılan Bora Ekmekçi'ye hoş geldin diyoruz. Bora, yetkili servis ve toptancı kanalındaki sipariş ve iade taleplerinin takibini yürütecek.", "Daha önce bir servis zincirinde saha operasyonunda çalışan Bora'ya yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Doğum günü kutlaması: Zeynep Acar ve Emre Şahin", at: { days: 4, time: "08:50" }, body: ["Bu hafta doğum günü olan iki arkadaşımız var: Zeynep Acar ve Emre Şahin. Yeni yaşlarının sağlık ve başarı getirmesini dileriz.", "Pazarlama ekibinin hazırladığı kutlama kartını ortak alandan imzalayabilirsiniz. Nice yıllara!"] },
    { feed: "ik", subject: "Çalışan memnuniyeti anketi açıldı", at: { days: 6, time: "10:30" }, body: ["Yıllık çalışan memnuniyeti anketi açıldı. 12 sorudan oluşan anket yaklaşık 5 dakika sürüyor ve yanıtlar anonim değerlendiriliyor.", "Anketi 20 Kasım'a kadar İK portalından doldurabilirsiniz; sonuçlar Aralık ayında tüm şirketle paylaşılacak."] },
    { feed: "egitim", subject: "Satış becerileri atölyesi: müzakere ve filo sözleşmesi dili", at: { days: 6, time: "11:00" }, body: ["İki günlük atölyede fiyat müzakeresi, itiraz yönetimi ve filo sözleşmelerinde kullanılan maddelerin (SLA, fiyat güncelleme, cezai şart) sade bir dille anlatımı yer alacak. Kontenjan 15 kişidir; satış ve operasyon ekiplerine öncelik verilir.", "Kayıtlar Aralık ayının ilk haftasına kadar açık."] },
    { feed: "egitim", subject: "Zorunlu siber güvenlik farkındalık eğitimi", at: { days: 10, time: "09:30" }, body: ["Tüm çalışanlarımızın yıllık siber güvenlik farkındalık eğitimini Aralık sonuna kadar tamamlaması gerekiyor. 25 dakikalık çevrim içi eğitim, oltalama e-postalarını tanımayı ve müşteri verilerinin korunmasını kapsıyor."] },
    { feed: "akademi", subject: "Yeni modül: iade (RMA) süreçlerinde müşteri iletişimi", at: { days: 4, time: "15:10" }, body: ["Akademi'ye yeni bir modül eklendi: iade talebini alırken hangi bilgiler istenmeli, müşteriye kapanış süresi nasıl anlatılmalı? Örnek yazışmalar ve 25 dakikalık video yayında."] },
    { feed: "akademi", subject: "Yeni modül: filo sözleşmelerinde fiyat güncelleme formülleri", at: { days: 8, time: "16:20" }, body: ["Filo sözleşmelerinde kullanılan endeks bazlı ve sabit fiyat güncelleme formüllerini karşılaştıran 30 dakikalık modül yayında. Boğaz Filo ve Trakya Lojistik örnekleri üzerinden çalışılmış vaka dosyaları da modülle birlikte geliyor."] },
    { feed: "akademi", subject: "Yeni modül: ağır ticari lastik ölçüleri ve yük–hız endeksi", at: { days: 12, time: "14:45" }, body: ["Otobüs ve kamyon lastiklerinde ölçü okuma, yük ve hız endeksi tablolarını anlatan 20 dakikalık modül eklendi. Ağır ticari filo görüşmelerine girmeden önce hızlı bir tekrar için uygundur."] },
    { feed: "kulup", subject: "Koşu kulübü: Belgrad Ormanı'nda sabah koşusu", at: { days: 5, time: "13:10" }, body: ["Koşu kulübü bu ay 8 km'lik rotada buluşuyor; her seviyeden katılımcı davetlidir. Buluşma noktası Maslak ofis girişi, dönüşte ortak kahvaltı yapılacak."] },
    { feed: "kulup", subject: "Kitap kulübü: Kasım seçkisi için oylama", at: { days: 9, time: "12:45" }, body: ["Kasım ayı seçkisini belirlemek için üç aday kitap İK portalında oylamaya açıldı. Buluşma öğle arasında Maslak ofisteki toplantı odasında yapılacak."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${BF} filo sözleşmesi karşı teklifini hazırla`, due: 0, importance: "high", steps: ["Araç başına bakım bedelini doğrula", "Fiyat güncelleme maddesini Can ile netleştir", "Hukuk onayını al"], note: "36 ay fiyat sabitleme talebine karşılık yılda iki kez güncelleme önerilecek." },
          { title: `${EY} kış paketi teklifini revize et`, due: 1, importance: "high", steps: ["Ölçü bazlı stok taahhüdünü Mert'ten al", "İade (RMA) penceresini ekle", "Teklifi tyroSign ile gönder"] },
          { title: "Q4 hedef sunumunu hazırla", due: 2, steps: ["Kanal bazlı hedef kırılımı", "Riskli fırsatlar slaytı", "Selin ile prova yap"] },
          { title: "Kış lastiği için alternatif tedarikçi listesini Mert'ten iste", due: 0, importance: "high" },
          { title: "Haftalık pipeline raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: `${AP} çerçeve anlaşma iskonto matrisini onayla`, due: 3 },
          { title: `${KY} numune test raporunu yanıtla`, due: 3, importance: "low" },
          { title: "Kış kampanyası broşürünü bayilerle paylaş", due: 1, steps: ["Broşürü son kez kontrol et", "Bayi e-postasını yaz"] },
          { title: `${HO} ihracat proformasını kontrol et`, due: 4 },
          { title: `${SD} listeleme anlaşması taslağını incele`, due: 5 },
          { title: "İzmir bölge servis ziyaret planını onayla", due: 5, steps: ["İzmir randevuları", "Manisa ve Aydın randevuları"] },
          { title: `${TL} araç listesi için parça eşleştirmesini tamamla`, due: 6 },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: `${TS} akü kampanyası siparişini onayla`, completedDaysAgo: 1 },
          { title: "Kış kampanyası fiyat listesini onayla", completedDaysAgo: 3 },
          { title: "Ekim iade (RMA) raporunu incele", completedDaysAgo: 5 },
          { title: `${GY} mevsimsel lastik ve akü teklifini hazırla`, due: 2, importance: "high", steps: ["Bölge bazlı araç sayılarını Zeynep'ten al", "Saha servis kapasitesini Mert ile teyit et", "Eski lastik saklama kalemini fiyatla"], note: "1.850 araç için araç başına yaklaşık 1.135 ₺; değişimlerin 28 Kasım'a kadar bitmesi isteniyor." },
          { title: "Derya ile pipeline kayıtlarındaki geçmiş kapanış tarihlerini güncelle", due: -2, importance: "high" },
          { title: `${DS} konsinye stok pilotu nokta listesini onayla`, due: 3 },
          { title: `${MK} van filosu bakım paketini fiyatlandır`, due: 4, steps: ["Plaka başı yıllık bedeli hesapla", "Lastik iskontosunu Can ile marj açısından kontrol et", "Teklifi tyroSign ile gönder"] },
          { title: `${YO} ağır ticari lastik teklifini hazırla`, due: 6, steps: ["Yeni ve kaplamalı lastik seçeneklerini ayır", "Kilometre garantisi şartlarını gözden geçir"] },
          { title: "2027 kanal iskonto basamakları için Selin'e görüş yaz", due: 3, steps: ["Kanal bazlı mevcut iskonto dağılımını çıkar", "Marj etkisini tyroPricing ile simüle et"] },
          { title: `${CF} fren balatası talep tahminini hazırla`, due: 8 },
          { title: "Kocaeli deposu ek sipariş önceliklerini Mert ile kesinleştir", completedDaysAgo: 2 },
          { title: "Bayi iskonto raporunu Selin'e gönder", completedDaysAgo: 4 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Boğaz Filo müzakere stratejisini konuş", due: 1 },
          { title: "Onur için kanal eğitim planı hazırla", due: 8 },
          { title: "Gizem'in garanti ve iade süreci sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan ile İzmir ziyaretleri öncesi hazırlık yap", due: 7 },
          { title: "Gizem ile RMA kapanış süresi hedefini belirle", due: 2 },
          { title: "Derya'nın raporlama otomasyonu önerisini incele", due: 5, importance: "low" },
          { title: "Ekip için yıl sonu izin takvimini çıkar", due: 9, steps: ["Ekipten izin taleplerini topla", "24–31 Aralık depo vardiyasıyla çakışmaları kontrol et"] },
        ],
      },
      {
        name: "Filo ve Servis Ağı",
        tasks: [
          { title: "Kış lastiği müşteri öncelik listesini kesinleştir", due: 0, importance: "high", steps: ["Ege Yetkili ve Trakya Lojistik ölçü ihtiyaçlarını karşılaştır", "Alternatif parti takvimiyle eşleştir", "Listeyi satış ekibine duyur"] },
          { title: "Yıl sonunda biten dört filo sözleşmesinin yenileme sırasını belirle", due: 2, importance: "high" },
          { title: `${TS} eski akü (hurda) toplama takvimini netleştir`, due: 2 },
          { title: "Servis noktalarına iade (RMA) penceresi bilgilendirmesi gönder", due: 3 },
          { title: `${TL} sözleşme yenileme teklif taslağını hazırla`, due: 5, steps: ["Fiyat güncelleme formülünü Can ile gözden geçir", "Plaka bazlı kilometre varsayımını güncelle", "Kış lastiği değişim paketini ekle"] },
          { title: "Manisa ve Aydın servislerinin stok taahhüdü taleplerini derle", due: 6 },
          { title: "Servis ağı memnuniyet anketi sonuçlarını incele", due: 7, importance: "low" },
          { title: `${BF} 2.400 araçlık bakım takvimini sisteme gir`, due: 8 },
          { title: "Yetkili servis performans skor kartını güncelle", due: -1, status: "inProgress" },
          { title: "Eski akü iade (hurda) sözleşme şablonunu güncelle", completedDaysAgo: 3 },
          { title: "Servis noktası sipariş portalı yetki listesini kontrol et", completedDaysAgo: 6 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Aracın kış lastiklerini taktır", due: 2, importance: "low" },
          { title: "Spor salonu üyeliğini yenile", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Kombi yıllık bakımı için randevu al", due: 5, importance: "low" },
          { title: "Diş kontrol randevusu al", due: 8, importance: "low" },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Hedef ve Gerçekleşme — Kanal Bazlı.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${BF} — Filo Bakım Sözleşmesi Taslağı.docx`, folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 1 },
    { name: `${EY} — Kış Paketi Teklif v2.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: "Stok ve Servis Seviyesi — Haftalık.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 2 },
    { name: "Pipeline Raporu — Kasım.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 2 },
    { name: "Bayi İskonto Matrisi.xlsx", folder: "Teklifler", by: "Derya Çelik", daysAgo: 3 },
    { name: "Haftalık Toplantı Notları.docx", folder: "Satış", by: "Ömer Gümüş", daysAgo: 3 },
    { name: "Parça Fiyat Listesi 2026-27.xlsx", folder: "Teklifler", by: "Emre Şahin", daysAgo: 4 },
    { name: "Kış Kampanyası Broşürü.pdf", folder: "Pazarlama", by: "Emre Şahin", daysAgo: 5 },
    { name: "İzmir Bölge Ziyaret Planı.xlsx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 5 },
    { name: "İade ve Garanti (RMA) Analizi — Ekim.csv", folder: "Raporlar", by: "Gizem Tunç", daysAgo: 6 },
    { name: "Filo Sözleşme Takip Listesi.xlsx", folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 7 },
    { name: "Teknik Eğitim — Parça Eşleştirme.pptx", folder: "Eğitim", by: "Deniz Arslan", daysAgo: 8 },
    { name: `${GY} — Mevsimsel Değişim ve Akü Kontrol Teklifi.pptx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Vadesi Geçen Alacaklar — Kasım.xlsx", folder: "Raporlar", by: "Can Yıldız", daysAgo: 1 },
    { name: "RMA Kapanış Süresi Takibi.xlsx", folder: "Operasyon", by: "Gizem Tunç", daysAgo: 2 },
    { name: `${DS} — Konsinye Stok Pilotu Nokta Listesi.xlsx`, folder: "Operasyon", by: "Onur Polat", daysAgo: 2 },
    { name: "Alternatif Tedarikçi Maliyet Karşılaştırması.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 3 },
    { name: "2027 Kanal İskonto Yapısı — Taslak.xlsx", folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 3 },
    { name: `${YO} — Ağır Ticari Lastik Teklifi.docx`, folder: "Teklifler", by: "Kaan Özdemir", daysAgo: 4 },
    { name: "Talep Tahmini Modeli — Pilot Sonuçları.pdf", folder: "Raporlar", by: "Elif Kaya", daysAgo: 5 },
    { name: "Servis Noktası Performans Skor Kartı.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 6 },
    { name: "Parça–Araç Eşleştirme Veri Güncellemesi.csv", folder: "Operasyon", by: "Deniz Arslan", daysAgo: 6 },
    { name: `${MK} — Van Filosu Bakım Paketi.xlsx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 7 },
    { name: "Filo Yenileme Takvimi — 2027.xlsx", folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 8 },
    { name: "Kocaeli Deposu Döngüsel Sayım Sonuçları.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 9 },
    { name: "Bayi Webinarı Sunum Taslağı.pptx", folder: "Pazarlama", by: "Emre Şahin", daysAgo: 11 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${BF} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: filo operasyon müdürü ve finans direktörü. Teknik değerlendirmeyi servis planlama ekibi yürütüyor.", "İstekler: araç başına aylık bakım bedelinin 36 ay sabitlenmesi, fiyat güncellemesinin yılda iki kez yapılması, 2.400 araç için 48 saat içinde parça teslimi taahhüdü.", "Sonraki adım: güncellenmiş sözleşme taslağı ve Can Yıldız ile birlikte fiyat güncelleme formülü."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Riskli üç fırsat için aksiyon sahipleri belirlendi: Kuzey Yan Sanayi (numune), Hazar Oto Dağıtım (ihracat belgeleri), Sepetpark (komisyon oranı).", "Kış kampanyası broşürü bu hafta onaylanacak; bayi iskonto matrisi Derya'da.", "Kış lastiği teslim gecikmesi için Mert ile ek sipariş planı çıkarılacak."] },
    { title: "Kış sezonu stok planı", notebook: "Satış", section: "Planlama", daysAgo: 5, body: [`Hedef servis seviyesi %${KPI.serviceTarget}; mevcut %${KPI.serviceLevel}. Açık nokta: 205/55 R16 ve 195/65 R15 kış lastikleri ile 70 Ah akü.`, "Önlem: alternatif tedarikçiden 4.000 adetlik ek parti; sezon sonu iade penceresi 30 gün.", "Kritik tarih: 20 Kasım — ilk soğuk hava dalgası öncesi servis zincirlerine stok taahhüdü teyidi."] },
    { title: "Müzakere hazırlığı — filo sözleşmesi", notebook: "Satış", section: "Toplantı Notları", daysAgo: 6, body: ["Açılış: toplam sahip olma maliyeti ve 2.400 araçta öngörülebilir bakım bütçesi.", "Esneklik alanları: ödeme vadesi (45 günden 60 güne), fiyat güncelleme periyodu.", "Sınır: bayi iskontosu dahil toplam marj %9'un altına inmez; parça teslim SLA'sı 48 saatten uzun olamaz."] },
    { title: `${GY} tanışma toplantısı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 10, body: ["Katılımcılar: filo operasyon sorumlusu Esra Kılınç ve satın alma ekibi. Güneyyol 1.850 araçlık uzun dönem kiralama filosunu üç bölgeden (İstanbul–Kocaeli, Ankara, İzmir) yönetiyor; lastik ve akü işleri şu an üç ayrı tedarikçiyle yürüyor.", "İhtiyaç: iki dönemli lastik değişimi, söküm sonrası lastik saklama, akü sağlık testi ve filo genelinde tek raporlama. Karar kriteri fiyat kadar değişim süresi: araç başına servis duruşu 90 dakikayı aşmamalı.", "Sonraki adım: bölge bazlı araç sayıları, saha servis kapasitesi ve saklama maliyetiyle ilk teklif taslağı. Mevcut tedarikçilerden biri saklamayı ücretsiz veriyor; saklama kalemini ayrı fiyatlamak yerine paket içinde göstermek gerekebilir."] },
    { title: "İade (RMA) süreci iyileştirme fikirleri", notebook: "Satış", section: "Planlama", daysAgo: 4, body: [`Ekim verisi: genel iade oranı %${KPI.rmaRate} (hedef %2'nin altı), ancak ${KPI.rmaOpen} açık kaydın ortalama kapanış süresi ${KPI.rmaDays} gün; hedef ${KPI.rmaDaysTarget} gün.`, "Kök nedenler: yanlış parça eşleştirmesi %38, ambalaj ve nakliye hasarı %21, yanlış ölçü veya seçim %17, kalan %24 üretim kusuru ve diğer. İlk iki neden TYRO'nun kontrolünde: çapraz referans düzeltmesi (Deniz) ve palet ambalaj standardı (Mert).", "Öneriler: portal üzerinden fotoğraflı RMA açılışı, 48 saatte ilk yanıt kuralı ve tekrar iade eden müşteriler için aylık gözden geçirme. Gizem ile kapanış süresi hedefini haftalık RMA toplantısında takip edeceğiz."] },
    { title: "Tahsilat ve vade stratejisi", notebook: "Satış", section: "Planlama", daysAgo: 2, body: [`Kasım başı: ${KPI.overdueInvoices} faturada ${KPI.overdue} M₺ vadesi geçmiş; ortalama tahsilat süresi ${KPI.dso} gün, hedef ${KPI.dsoTarget}.`, "Yaklaşım: 30 günü aşan hesaplarda satış sahibi müşteriyi arar; 45. günde Can sevkiyat kısıtı uygular. İade mahsubu bekleyen hesaplar (örneğin Anka Parça) ayrı listelenir ki gecikme yanlış okunmasın.", "Kış kampanyasında vade uzatma talepleri 60 günü geçmeyecek; 60 gün isteyen müşteriye iskonto yerine peşin ödeme alternatifi sunulacak."] },
    { title: "2027 kanal iskonto yapısı — ön düşünceler", notebook: "Satış", section: "Planlama", daysAgo: 3, body: ["Mevcut durum: yetkili servis, toptancı ve e-ticaret için ayrı iskonto tabloları var; basamak sayısı kanal başına 4–6 arasında değişiyor ve aynı hacimde farklı iskonto verilebiliyor.", "Öneri: hacim bazlı tek çerçeve (3 basamak) kurmak, kanal farkını yalnızca hizmet bedeliyle (stok taahhüdü, iade penceresi) yansıtmak. E-ticarette komisyon oranı ile bayi iskontosunun toplamı %14'ü geçmemeli.", "Risk: toptancı kanalı basamakların sadeleşmesini iskonto kaybı olarak okuyabilir; Anka Parça'nın kabul edebileceği kademeli yapıyla uyum önemli."] },
    { title: `${YO} ihtiyaç notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 7, body: ["Yeşilova 410 otobüsle şehirlerarası hatta çalışıyor; lastik gideri işletme maliyetinin yaklaşık %9'unu oluşturuyor. Filo operasyon müdürü Cemal Dinçer lastik ömrünü ve kaplama oranını temel ölçüt olarak görüyor.", "Talepler: 295/80 R22.5 ve 315/80 R22.5 ölçüleri, kaplamalı lastik seçeneği, kilometre garantisi ve sezon öncesi koruyucu bakım. Mevcut tedarikçinin teslim süresi 10 gün; 5 gün hedefi bizim için rekabet avantajı olur.", "Sonraki adım: yeni ve kaplamalı lastiği iki ayrı seçenek olarak sunan teklif; Mert'ten ağır ticari ölçüler için stok kapsama bilgisi."] },
    { title: "Konsinye stok pilotu — tasarım notları", notebook: "Satış", section: "Servis Ağı", daysAgo: 5, body: ["Doruk Servis Merkezleri'nin 54 noktasından 12'sinde akü ve yağ filtresi gruplarında konsinye stok denenecek. Amaç servislerin sık kullanılan kalemlerde stoksuz kalmasını önlemek ve sipariş döngüsünü kısaltmak.", "Açık sorular: stok sigortası, sayım periyodu (ayda bir), faturalama anı (sayım sonrası, aylık) ve hurda akü iadesi. Finans faturalama anı konusunda çekimser; stok devri düşük noktalarda geri çekme hakkı istiyor.", "Başarı ölçütleri: pilot noktalarda servis seviyesi %97 üzeri, stok devir hızı yılda 8 ve üzeri, RMA oranı %2'nin altı. Pilot başarılı olursa Ege Yetkili ve Toros zincirine de önerilebilir."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, parça ve filo fırsatların, stok durumu ve servis ağın hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Stok durumu nasıl?", "Filo sözleşmeleri ne durumda?", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?", "Kış lastiği ve akü sezonu nasıl gidiyor?", "İade (RMA) durumu nedir?"],
    },
    answers: [
      // ───── Daha özel kalıplar önce: genel kalıplar (hedef, stok, filo, servis ağı…) sonra eşleşir ─────
      {
        match: "yeni müşteri|yeni hesap|güneyyol|doruk|meridyen|yeşilova|levent|nilüfer|çınar",
        steps: ["Yeni hesap kayıtları okunuyor…"],
        text: `**Yeni hesaplar ve fırsatlar**\n\n| Müşteri | Çözüm | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${GY} | Mevsimsel değişim, saklama ve akü kontrol paketi (1.850 araç) | 2,1 M₺ | Teklif hazırlanıyor | %50 |\n| ${DS} | Konsinye stok pilotu (54 nokta) | 1,5 M₺ | Pilot kurgusu | %45 |\n| ${YO} | Ağır ticari lastik ve koruyucu bakım (410 otobüs) | 1,3 M₺ | İhtiyaç analizi | %40 |\n| ${MK} | Van filosu bakım paketi (960 araç) | 1,2 M₺ | Teklif | %45 |\n| ${LA} | Silecek ve aksesuar kış siparişi | 1,0 M₺ | Sipariş planı | %60 |\n| ${NO} | Pazaryeri listeleme ve uyumluluk verisi | 0,8 M₺ | Veri testi | %35 |\n\nAltı yeni fırsat toplam **${KPI.newPipeline} M₺**; açık pipeline'ın (${KPI.pipeline} M₺) yaklaşık beşte biri.\n\nTedarik tarafında ${CF} ile 2027 ilk çeyrek fren balatası tahsisatı görüşülüyor; talep tahmini 30 Kasım'a kadar iletilmeli.`,
        chips: ["Açık fırsatlarımı özetle", "Q4 kapanış senaryoları neler?"],
      },
      {
        match: "tahsilat|alacak|vade|geciken fatura",
        steps: ["Cari hesap kayıtları okunuyor…", "Vade analizi yapılıyor…"],
        text: `**Tahsilat ve vade durumu**\n\nVadesi geçen alacak **${KPI.overdue} M₺** (${KPI.overdueInvoices} fatura). Ortalama tahsilat süresi **${KPI.dso} gün**, hedef ${KPI.dsoTarget}.\n\n| Hesap | Vadesi geçen | Gecikme | Not |\n|---|---|---|---|\n| ${HO} | 0,9 M₺ | 38 gün | İhracat belgeleri bekliyor |\n| ${AP} | 0,7 M₺ | 27 gün | İade mahsubu bekliyor |\n| ${TS} | 0,6 M₺ | 19 gün | Akü kampanyası faturaları |\n| Diğer hesaplar | 1,0 M₺ | 8–24 gün | Küçük tutarlı kalemler |\n\n- Can Yıldız, 30 günü aşan hesaplarda yeni sevkiyattan önce satış aramasını istiyor; 45. günde sevkiyat kısıtı uygulanıyor.\n- ${BF} ödeme vadesini 60 güne uzatmak istiyor; vade uzarsa tahsilat süresi hedefi zorlanır.\n- Kış kampanyasında vade uzatma taleplerine peşin ödemeli alternatif öneriliyor.`,
        chips: ["Açık fırsatlarımı özetle", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "\\brma\\b|iade|garanti",
        steps: ["İade (RMA) kayıtları okunuyor…", "Kök nedenler gruplanıyor…"],
        text: `**İade (RMA) durumu**\n\nGenel iade oranı **%${KPI.rmaRate}** (hedef %2'nin altı). Asıl sorun hız: ${KPI.rmaOpen} açık kaydın ortalama kapanış süresi **${KPI.rmaDays} gün** (hedef ${KPI.rmaDaysTarget}).\n\n| İade nedeni | Pay |\n|---|---|\n| Yanlış parça eşleştirme | %38 |\n| Ambalaj ve nakliye hasarı | %21 |\n| Yanlış ölçü veya seçim | %17 |\n| Üretim kusuru ve diğer | %24 |\n\n- İlk iki neden TYRO'nun kontrolünde: çapraz referans düzeltmesi (Deniz) ve palet ambalaj standardı (Mert).\n- E-ticaret kanalında iade oranı %2,9; araç uyumluluk verisi tamamlanınca düşmesi bekleniyor.\n- ${EY} kış paketinde 30 günlük sezon sonu iade penceresi istiyor; hukuk ön görüşü pencerenin ambalajı açılmamış ürünlerle sınırlı olmasını öneriyor.\n\nGizem Tunç'un haftalık RMA toplantısında kapanış süresi takip ediliyor.`,
        chips: ["Katalog ve OEM eşleştirme durumu nedir?", "Servis ağı performansı nasıl?"],
      },
      {
        match: "oem|eşleştir|uyumluluk|katalog|çapraz referans|plaka",
        steps: ["Parça–araç eşleştirme verisi okunuyor…"],
        text: `**Katalog ve OEM eşleştirme durumu**\n\nParça–araç eşleştirme veri tabanına bu ay 42.000 yeni kayıt eklendi; ağır ticari filtre grupları artık filo plaka listeleriyle otomatik eşleşiyor.\n\n- **Çapraz referans:** 318 kayıtta bir OEM koduna iki farklı aftermarket parça bağlı; düzeltme bu ay içinde bitecek.\n- **E-ticaret:** ${NO} test akışında 3.400 üründen 212'sinde araç uyumluluk alanı boş; ${SD} için 3.200 kalemlik uyumluluk verisi hazırlanıyor.\n- **İade etkisi:** İadelerin %38'i yanlış eşleştirmeden geliyor; düzeltme bitince genel RMA oranının %1,6'ya inmesi hedefleniyor.\n- **Filo teklifleri:** Plaka listesiyle doğrulanmadan teklif gönderilmemesini öneririm.\n\nDoğrulama için *tyroCatalog* uygulamasını açabilirsin.`,
        chips: ["İade (RMA) durumu nedir?", "Stok durumu nasıl?"],
      },
      {
        match: "yenileme|biten sözleşme|bitiş tarih",
        steps: ["Sözleşme bitiş tarihleri okunuyor…"],
        text: `**Filo yenileme takvimi**\n\nYıl sonuna kadar **${KPI.renewals} sözleşme** yenilemeye geliyor (${KPI.renewalVehicles} araç); ${KPI.fleetContracts} aktif sözleşmenin (${KPI.fleetVehicles} araç) yaklaşık üçte ikisi.\n\n| Sıra | Müşteri | Araç | Bitiş | Aksiyon |\n|---|---|---|---|---|\n| 1 | ${BF} | 2.400 | 31 Aralık | Karşı teklif hazırlanıyor, müzakere sürüyor |\n| 2 | ${TL} | 620 | 15 Ocak | Yenileme teklifi sunumu planlandı |\n| 3–4 | Diğer iki sözleşme | 880 | Aralık | Fiyat güncelleme formülü hazır |\n\n- Sıralama araç sayısı ve bitiş tarihine göre; fiyat güncelleme yılda iki kez, marj alt sınırı %9.\n- Yenileme dışı yeni filo adayları: ${GY} (1.850 araç) ve ${MK} (960 van).\n- *tyroFleet* bitiş tarihlerine 90 gün kala uyarı üretiyor.`,
        chips: ["Filo sözleşmeleri ne durumda?", "Q4 kapanış senaryoları neler?"],
      },
      {
        match: "gecikme|alternatif tedarik|ek parti|tedarikçi",
        steps: ["Tedarik takvimi okunuyor…", "Alternatif parti maliyeti hesaplanıyor…"],
        text: `**Tedarik gecikmesi — etki ve aksiyonlar**\n\nAna tedarikçideki **${KPI.delayDays} günlük** gecikme 205/55 R16 ve 195/65 R15 kış lastiği partilerini etkiliyor.\n\n| Seçenek | Miktar | Teslim | Maliyet etkisi |\n|---|---|---|---|\n| Ana tedarikçi (gecikmeli) | Mevcut sipariş | +${KPI.delayDays} gün | — |\n| Alternatif tedarikçi, ilk parti | 1.500 adet | 9 gün | +%5,5 |\n| Alternatif tedarikçi, ikinci parti | 2.500 adet | 16 gün | +%5,5 |\n\n- Toplam ek parti **${KPI.altBatch} adet**; ücretsiz sevkiyat koşulunu 500 adet üzerinde tutmak marjı koruyor.\n- İlk partide öncelik: ${EY} ve ${TL} ölçüleri.\n- Gecikme sürerse sezon ortasında servis seviyesi %90'ın altına inebilir.\n- Hedefe kayma riski yaklaşık **${KPI.delayImpact} M₺** (Q4 içinde teslim edilemeyen kış paketi siparişleri).`,
        chips: ["Kış lastiği ve akü sezonu nasıl gidiyor?", "Q4 kapanış senaryoları neler?"],
      },
      {
        match: "lasti[kg].*(sezon|satış|talep)|(akü|aku).*(sezon|talep)|sezon.*(durum|nasıl|gidiyor|performans)",
        steps: ["Sezon satış ve stok verileri okunuyor…"],
        text: `**Kış lastiği ve akü sezonu**\n\nKış kampanyası 15 Aralık'a kadar sürüyor ve talep güçlü: Ekim'de kış lastiği %18, akü %11 arttı. Stok servis seviyesi %${KPI.serviceLevel} (hedef %${KPI.serviceTarget}).\n\n| Kalem | Stok kapsama | Talep artışı | Risk |\n|---|---|---|---|\n| Kış lastiği 205/55 R16 | 6 gün | %21 | Yüksek |\n| Kış lastiği 195/65 R15 | 11 gün | %16 | Orta |\n| Akü 70 Ah | 14 gün | %12 | Orta |\n| Silecek ve cam suyu | 33 gün | %9 | Düşük |\n\n- Ana tedarikçideki gecikme için alternatif tedarikçiden ${KPI.altBatch} adetlik ek parti planlanıyor.\n- 20 Kasım'daki ilk soğuk hava dalgasından önce servis zincirlerine stok taahhüdü teyidi gerekiyor.\n- Haftalık talep tahmini modeli (*tyroForecast*) ortalama %${KPI.forecastError} sapmayla çalışıyor.`,
        chips: ["Tedarik gecikmesinin etkisi nedir?", "Stok durumu nasıl?"],
      },
      {
        match: "senaryo|tutturabil|kapanış tahmini",
        steps: ["Pipeline olasılıkları okunuyor…", "Senaryolar hesaplanıyor…"],
        text: `**Q4 kapanış senaryoları**\n\nHedef ${KPI.quota} M₺; gerçekleşen ${KPI.achieved} M₺, hedefe kalan ${KPI.gap} M₺.\n\n| Senaryo | Varsayım | Q4 sonu | Hedefe oran |\n|---|---|---|---|\n| Temkinli | ${BF} imzası Ocak'a kayar, kış lastiği gecikmesi sürer | 23,5 M₺ | %89 |\n| Beklenen | Kış paketi ve çerçeve anlaşma Aralık'ta kapanır | 25,9 M₺ | %98 |\n| İyimser | ${BF} ve ${GY} Aralık'ta imzalanır | 28,3 M₺ | %107 |\n\n- Tedarik gecikmesinin kayma riski yaklaşık ${KPI.delayImpact} M₺.\n- En kritik üç hamle: ${BF} sözleşmesi, ${EY} kış paketi ve alternatif lastik partisinin siparişi.\n- Kazanma oranı %${KPI.winRate}; açık pipeline ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat).`,
        chips: ["Açık fırsatlarımı özetle", "Tedarik gecikmesinin etkisi nedir?"],
      },
      {
        match: "bölge bazl|bölge performans|bölgelere göre|servis noktas|skor kart|memnuniyet",
        steps: ["Servis noktası skor kartı okunuyor…"],
        text: `**Bölge bazlı servis ağı performansı (Ekim)**\n\n| Bölge | Sipariş payı | Teslim süresi | İade oranı | Memnuniyet |\n|---|---|---|---|---|\n| Marmara ve Trakya | %38 | 24 saat | %1,7 | 4,4 / 5 |\n| Ege | %27 | 36 saat | %1,8 | 4,2 / 5 |\n| İç Anadolu | %19 | 36 saat | %2,0 | 4,0 / 5 |\n| Akdeniz ve Güney | %11 | 44 saat | %2,2 | 3,9 / 5 |\n| Karadeniz ve Doğu | %5 | 48 saat | %2,4 | 3,8 / 5 |\n\n- En zayıf halka Akdeniz ve Karadeniz hatlarında teslim süresi; Marmara'da Kocaeli deposu sayesinde 24 saat.\n- Ankara cross-dock merkezi Ocak'ta açılınca İç Anadolu'da teslim süresi 36 saatten 24 saate inecek.\n- Memnuniyet anketi (312 yanıt) sonuçları, davet edildiğin toplantıda paylaşılacak.`,
        chips: ["Servis ağı performansı nasıl?", "İade (RMA) durumu nedir?"],
      },
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${KPI.achieved} M₺** / hedef ${KPI.quota} M₺ (**%${KPI.achievedPct}**); ${KPI.achievedOrders} / ${KPI.quotaOrders} sipariş.\n\n- Hedefe kalan: ${KPI.gap} M₺\n- Açık pipeline: ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Bu ay kapanan: ${KPI.closedThisMonth} M₺\n- Stok servis seviyesi: %${KPI.serviceLevel} (hedef %${KPI.serviceTarget})\n\nAçığı kapatmak için en kritik fırsat Boğaz Filo Kiralama filo bakım sözleşmesi (8,6 M₺); kış paketi ve çerçeve anlaşmaların da Kasım–Aralık sezonunda kapanması gerekiyor.`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Çözüm | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${BF} | 3 yıllık filo bakım sözleşmesi (2.400 araç) | 8,6 M₺ | Müzakere | %65 |\n| ${EY} | Kış lastiği + akü paketi (140 servis) | 6,2 M₺ | Teklif | %60 |\n| ${AP} | Yıllık fren ve filtre çerçeve anlaşması | 5,1 M₺ | Teklif | %55 |\n| ${TL} | 620 araçlık periyodik bakım + lastik | 4,4 M₺ | Müzakere | %50 |\n| ${KY} | OEM aydınlatma grubu tedariki | 3,3 M₺ | Numune onayı | %35 |\n| ${SD} | Pazaryeri listeleme anlaşması | 2,2 M₺ | Teklif | %45 |\n\nToplam açık pipeline **${KPI.pipeline} M₺** (${KPI.openDeals} fırsat).`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Filo sözleşmeleri ne durumda?"],
      },
      {
        match: "stok|envanter|teslim süresi|tedarik|sevkiyat",
        steps: ["Depo stokları okunuyor…", "Tedarik süreleri karşılaştırılıyor…"],
        text: `**Stok ve teslim durumu**\n\nStok servis seviyesi **%${KPI.serviceLevel}** (hedef %${KPI.serviceTarget}).\n\n| Kalem grubu | Stok kapsama | Tedarik süresi | Durum |\n|---|---|---|---|\n| Kış lastiği 205/55 R16 | 6 gün | 21 gün | Kritik |\n| Kış lastiği 195/65 R15 | 11 gün | 18 gün | Dikkat |\n| Akü 70 Ah | 14 gün | 9 gün | Dikkat |\n| Ön fren balatası seti | 38 gün | 7 gün | Yeterli |\n| Yağ ve hava filtresi | 45 gün | 5 gün | Yeterli |\n| Far ve aydınlatma grubu | 52 gün | 10 gün | Yeterli |\n\nAna tedarikçideki 12 günlük gecikme lastik sevkiyatlarını etkiliyor. Bugün 16:30'daki aksiyon toplantısında alternatif parti ve müşteri öncelik sırası netleşecek.`,
        chips: ["Servis ağı performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "filo|sözleşme|periyodik bakım|yenileme",
        steps: ["Sözleşme kayıtları okunuyor…"],
        text: `**Filo sözleşmeleri**\n\n- 14 aktif filo bakım sözleşmesi, toplam **5.800 araç**.\n- Yıl sonuna kadar **4 sözleşme** yenilemeye geliyor (3.900 araç).\n\n| Müşteri | Araç | Bitiş | Durum |\n|---|---|---|---|\n| ${BF} | 2.400 | 31 Aralık | Yeni 3 yıllık teklif, müzakerede |\n| ${TL} | 620 | 15 Ocak | Teklif hazırlanıyor |\n| Diğer iki sözleşme | 880 | Aralık | Yenileme görüşmesi planlandı |\n\nBugün 14:00'te ${BF} müzakeresi var; araç başına bakım bedeli, fiyat güncelleme periyodu ve 48 saatlik parça teslim SLA'sı ana başlıklar.`,
        chips: ["Açık fırsatlarımı özetle", "Haftalık satış özeti hazırla"],
      },
      {
        match: "servis ağı|servis zinciri|toptancı|kanal",
        steps: ["Kanal verileri okunuyor…"],
        text: `**Servis ağı ve kanal performansı (Ekim)**\n\n| Kanal | Aktif nokta | Ekim sipariş | Yıllık büyüme | İade oranı |\n|---|---|---|---|---|\n| ${EY} | 140 | 124 | %9 | %1,8 |\n| ${TS} | 86 | 71 | %4 | %2,1 |\n| ${AP} | 320 bayi | 96 | %6 | %1,6 |\n| ${SD} | Online | 88 | %41 | %2,9 |\n\nGenel iade (RMA) oranı %1,9 (hedef %2'nin altı). En hızlı büyüyen kanal e-ticaret; iade oranı da orada en yüksek, araç uyumluluk verisi iyileşince düşmesi bekleniyor.`,
        chips: ["Stok durumu nasıl?", "Ekip performansı nasıl?"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:15 Sabah stok ve sevkiyat turu\n- 14:00 ${BF} — filo bakım sözleşmesi müzakeresi\n- 16:30 Kış lastiği tedarik gecikmesi — aksiyon toplantısı\n\nBu hafta ayrıca ${EY} kış paketi sunumu, Q4 hedef ve sezon değerlendirmesi, ${KY} numune toplantısı ve teknik eğitim var. 2027 kanal stratejisi çalıştayı daveti yanıtını bekliyor.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu ay ${KPI.closedThisMonth} M₺ kapanış gerçekleşti, kazanma oranı %${KPI.winRate}; sipariş adedi ${KPI.achievedOrders} / ${KPI.quotaOrders}.\n- Bugün ${BF} müzakeresi (14:00), yarın ${EY} kış paketi sunumu.\n- Q4 hedef değerlendirmesi: sunum hazır değil, görev listende.\n- Riskli konular: kış lastiği tedarik gecikmesi (12 gün), ${KY} aydınlatma numunesinde iki uygunsuz kalem.\n- Stok servis seviyesi %${KPI.serviceLevel}, hedefin %${KPI.serviceTarget} olduğu düşünülürse kritik kalemler izlenmeli.`,
        chips: ["Ekip performansı nasıl?", "Stok durumu nasıl?"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Gerçekleşme |\n|---|---|\n| Kaan Özdemir | %71 |\n| Zeynep Acar | %66 |\n| Onur Polat | %58 |\n| Derya Çelik | %52 |\n| Gizem Tunç | %47 |\n\nKaan'ın servis ziyaretleri kış paketi siparişlerini öne çekti. Gizem'in portföyünde iki büyük sipariş kış lastiği stoğu bekliyor; tedarik toplantısı sonrası hızlanması beklenir.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kış sezonu kampanyası**\n\n- Lastik ve akü paketlerinde **%7 ek bayi iskontosu**; 500 adet üzeri siparişlerde ücretsiz sevkiyat.\n- Şimdiye kadar 9 teklifte uygulandı; en büyüğü Ege Yetkili Servis Grubu (6,2 M₺).\n- Kampanya 15 Aralık'a kadar; toplam iskonto %12'yi aşarsa onay Selin Aydın'da.\n\nFiyat simülasyonu için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 22 gün, kullandığın 11 gün; **kalan 11 gün**. 2 gün onaylı izin planın var, 1 günlük bir talebin yönetici onayında.\n\nYıl sonu envanter sayımı nedeniyle 24–31 Aralık arasında depo vardiya düzeni değişiyor; izin planını buna göre yapmanı öneririm.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori, tutar ve fişi ekle (fiş okuyucu tutarı kendisi çıkarır)\n3. Gönder; yöneticin onaylar.\n\nBölge servis ziyaretlerindeki yakıt, otopark ve yemek fişlerini aynı rapora ekleyebilirsin. Şu an onay bekleyen bir masraf raporun var (HRMS-063107).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: `Bekleyen **3 onayın** var: ${TL} fatura iskontosu (Can Yıldız), Gizem Tunç'un müşteri ziyareti masrafı ve Onur Polat'ın eğitim talebi.`,
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Satış hedefin, fırsatların, stok durumun, filo sözleşmelerin, takvimin ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

// BEYAZ EŞYA veri seti — TYRO Tech'in buzdolabı, çamaşır ve bulaşık makinesi, fırın/ocak, kurutma makinesi,
// klima ve küçük ev aletlerini bayi, zincir mağaza, pazaryeri, konut projesi ve otel müşterilerine
// sattığı bir satış yöneticisi haftası. Tüm kişi, firma, model ve rakamlar KURGUSALDIR.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: "140", // Q4 ciro hedefi (milyon ₺)
  quotaAdet: "6.400", // Q4 adet hedefi
  achieved: "81,2", // gerçekleşen ciro (milyon ₺)
  achievedAdet: "3.712",
  achievedPct: 58,
  gap: "58,8", // kalan fark (milyon ₺)
  gapAdet: "2.688",
  pipeline: "148,0", // açık pipeline (milyon ₺)
  weighted: "75", // olasılık ağırlıklı pipeline (milyon ₺)
  openDeals: 19,
  winRate: 27,
  closed30: "22,4", // son 30 günde kapanan (milyon ₺)
  stok: "18.400", // depodaki toplam stok (adet)
  stokDevir: 41, // ortalama stok devir hızı (gün)
  devirHedef: 38, // hedef stok devir hızı (gün)
  doluluk: 91, // depo doluluğu (%)
  openReceivable: "27,6", // açık cari bakiye (milyon ₺)
  overdue: "3,1", // vadesi geçmiş bakiye (milyon ₺)
  ecomSellIn: "16,5", // pazaryeri ve e-ticaret kanalı sell-in (milyon ₺)
  ecomPct: 20, // bu kanalın Q4 cirosundaki payı (%)
  sla: 94, // yetkili servis SLA içinde kapanış (%)
  returnRate: "1,4", // bayi kaynaklı iade oranı (%)
  plusPreorder: "1.380", // NovaCool 640 Plus bayi ön siparişi (adet)
}

const EGE = "Ege Ev Bayileri A.Ş."
const EVIM = "Evim Elektronik Mağazaları"
const KERVAN = "Kervan Pazaryeri A.Ş."
const YUVAM = "Yuvam Konut Yapı A.Ş."
const LACI = "Lacivert Koy Otelleri"
const ANAD = "Anadolu Ev Aletleri Dağıtım"
const MTP = "Marmara Teknoloji Pazarı"
const AKSU = "Aksu Toplu Konut Geliştirme"
const KARA = "Karadeniz Beyaz Eşya Pazarlama A.Ş."
const TRAKYA = "Trakya Ev Gereçleri Bayilik"
const PUSULA = "Pusula Perakende Zinciri"
const DORUK = "Dorukhan Dijital Pazar A.Ş."
const MAVI = "Mavi Liman Otelcilik"
const SEDIR = "Sedir Yapı Kooperatifi"

export default defineDataset({
  id: "beyaz-esya",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Bayi, zincir mağaza ve proje satışlarında kota, sell-out, stok ve kampanya sorularını yanıtlar; haftalık özet hazırlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Bayi bazlı talep ve stok tahmini; kampanya dönemi sell-in öngörüsü.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Bayi sözleşmesi, proje teklifi ve kota mutabakatları için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Model bazlı fiyat, bayi iskontosu ve kampanya marjı simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Sell-out ve rakip fiyat içgörüleri; bayi ve zincir hesap özetleri.", icon: "Telescope02Icon" },
    { name: "tyroStock", type: "ai", description: "Depo stok devir hızı ve sevkiyat önceliklendirme önerileri.", icon: "Package01Icon" },
    { name: "tyroService", type: "ai", description: "Servis talebi, arıza ve yedek parça verisinden garanti riski ve bekleme süresi tahmini.", icon: "DocumentValidationIcon" },
    { name: "tyroRoute", type: "ai", description: "Depo çıkışı, sevkiyat sırası ve teslimat penceresi planlama önerileri.", icon: "CargoShipIcon" },
    { name: "tyroCampaign", type: "ai", description: "Kampanya talebi, stok ve marj etkisini model ve bayi bazında simüle eder.", icon: "AiBrain02Icon" },
    { name: "Bayi Portalı", type: "business", description: "Bayi sipariş, sevkiyat ve cari bakiye takibi", url: "#", icon: "AddInvoiceIcon" },
    { name: "Servis ve Garanti Takip", type: "business", description: "Yetkili servis talepleri, garanti kayıtları ve yedek parça durumu", url: "#", icon: "DocumentValidationIcon" },
    { name: "Sevkiyat Takip", type: "business", description: "Depo çıkışları, araç planı ve bayi teslimat durumu", url: "#", icon: "CargoShipIcon" },
    { name: "Proje Teklif Yönetimi", type: "business", description: "Konut ve otel projeleri için teklif, revizyon ve onay takibi", url: "#", icon: "Package01Icon" },
  ],

  weather: { now: "clearsky", base: 15, amp: 5, moods: ["clearsky", "fair", "partlycloudy", "cloudy", "lightrain", "fair", "rain"] },
  market: { rates: { USD: 44.4, EUR: 51.5, GBP: 58.3, CHF: 54.9 }, bist: 11410 },

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
      body: "Geçen haftanın sell-in rakamları, bayi siparişleri ve Kasım indirim günleri öncelikleri. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Sabah stok ve sevkiyat turu",
      recur: "daily",
      time: "09:10",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç", "Mert Aksoy"],
      body: "Dünün sevkiyatları, kritik modellerde stok seviyesi ve bugün çıkacak bayi siparişleri.",
    },
    {
      title: "Bayi ve proje pipeline gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık bayi, zincir ve proje fırsatlarının aşama, olasılık ve sipariş tarihi kontrolü. Riskli fırsatlar için aksiyon belirlenir.",
    },
    {
      title: "Aylık kampanya ve fiyat komitesi",
      recur: "monthly",
      dom: 18,
      time: "11:00",
      minutes: 60,
      where: "Maslak · Toplantı Odası 1",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin", "Deniz Arslan"],
      body: "Model bazlı liste fiyatı, bayi iskontosu ve kampanya marjlarının aylık değerlendirmesi.",
    },
    {
      title: "Haftalık tahsilat ve kredi limiti toplantısı",
      recur: "weekly",
      weekday: 3,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Can Yıldız",
      with: ["Ömer Gümüş", "Derya Çelik", "Onur Polat"],
      body: "Vadesi yaklaşan ve geçmiş bakiyeler, bayi kredi limiti kullanımı ve kampanya siparişlerinin vade onayları gözden geçirilir.",
    },
    {
      title: "E-ticaret kanalı haftalık kontrol",
      recur: "weekly",
      weekday: 2,
      time: "16:30",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Derya Çelik", "Emre Şahin"],
      body: "Pazaryeri ve online bayi kanallarında fiyat uyumu, stok senkronizasyonu, iade nedenleri ve kampanya sayfaları kontrol edilir.",
    },
    {
      title: "Aylık servis ve garanti kalite toplantısı",
      recur: "monthly",
      dom: 24,
      time: "14:00",
      minutes: 60,
      where: "Maslak · Toplantı Odası 2",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Gizem Tunç", "Deniz Arslan"],
      body: "Yetkili servis müdahale süreleri, tekrarlayan arıza nedenleri, yedek parça bekleme süresi ve garanti maliyetlerinin aylık değerlendirmesi.",
    },
    { title: `${YUVAM} — ankastre set teklif sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nilay Gökçe (${YUVAM})`, "Zeynep Acar", "Deniz Arslan"], body: "1.200 daireli konut projesi için ankastre set (fırın, ocak, davlumbaz) teklifinin son sunumu. Birim fiyat, teslimat partileri ve garanti şartları konuşulacak." },
    { title: `${EVIM} — çerçeve anlaşma müzakeresi`, day: 1, time: "10:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Sevgi Akın (${EVIM})`, "Zeynep Acar", "Can Yıldız"], body: "Kampanya dönemi adet taahhüdü, prim kademeleri ve fiyat koruma maddeleri." },
    { title: "Kasım indirim günleri — kampanya planlama", day: 1, time: "15:00", minutes: 60, where: "Microsoft Teams", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Emre Şahin", "Can Yıldız", "Mert Aksoy"], body: "20–30 Kasım kampanya takvimi, bayi iskonto tablosu, depo vardiyası ve broşür teslimi." },
    { title: "Q4 hedef ve stok değerlendirmesi", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Mert Aksoy", "Emre Şahin"], body: "Çeyrek sonu kota gerçekleşmesi, kritik model stokları ve kalan haftalar için aksiyon planı." },
    { title: `${KERVAN} — kampanya sell-in toplantısı`, day: 3, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Barış Tekin (${KERVAN})`, "Zeynep Acar", "Derya Çelik"], body: "Kasım indirim günleri sipariş miktarı, ek iskonto talebi ve teslimat penceresi." },
    { title: "Strateji çalıştayı — 2027 bayi modeli (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "2027 bayi modeli, iskonto yapısı ve kanal stratejisi çalıştayı. Katılımınızı bekliyoruz." },
    { title: `${EGE} — yıl sonu kota ve prim görüşmesi`, day: 4, time: "10:30", minutes: 75, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: [`Tolga Erdem (${EGE})`, "Kaan Özdemir", "Onur Polat", "Can Yıldız"], body: "Q4 kota taahhüdü, prim kademeleri ve alt bayilerin sell-out durumu." },
    { title: "Bayi yönetimi eğitimi — stok devir hızı", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Onur Polat", "Kaan Özdemir", "Gizem Tunç"], body: "TYRO Eğitim: güvenli stok hesabı, sipariş planlama, sell-in ve sell-out dengesi." },
    { title: `${LACI} — otel projesi keşif görüşmesi`, day: 6, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Ferhat Duman (${LACI})`, "Zeynep Acar", "Deniz Arslan"], body: "Altı otelin yenileme kapsamı: klima, buzdolabı ve çamaşırhane ekipmanları." },
    { title: `${ANAD} — kota görüşmesi`, day: 7, time: "11:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Gülşen Kara (${ANAD})`, "Onur Polat"], body: "Q4 kota revizyonu talebi ve mevcut stoğu eritme planı." },
    { title: "Bölge bayi ziyareti — İzmir ve Manisa", day: 8, allDay: true, where: "İzmir", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Ege Ev şubeleri ve alt bayi ziyaretleri." },
    { title: "Ekip 1:1 — Zeynep Acar", day: 0, time: "11:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Q4 proje hedefi, Yuvam sunumu sonrası adımlar ve Mavi Liman ile Sedir tekliflerinin önceliği." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 2, time: "11:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "Bölge bayi ziyaretleri, alt bayi sell-out takibi ve Trakya bölgesi için ziyaret planı." },
    { title: `${KARA} — yeni sezon stok planı görüşmesi`, day: 2, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Murat Dinçer (${KARA})`, "Onur Polat", "Mert Aksoy"], body: "FrostLine 480 ve AquaPure W7 Slim için ilk sezon sipariş miktarı, depo devir hızı ve vadesi geçmiş 0,5 M₺ bakiyenin ödeme planı." },
    { title: "Kasım indirim günleri sell-in sipariş kapanışı", day: 4, allDay: true, where: "Bayi Portalı", organizer: "Derya Çelik", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat"], body: "Bayi siparişleri gün sonunda kapanır. Bekleyen taslak siparişler, ek iskonto onayları ve vade talepleri gün içinde sonuçlandırılır." },
    { title: `${DORUK} — kampanya fiyat ve stok senkronizasyonu`, day: 4, time: "15:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Emir Tuncer (${DORUK})`, "Derya Çelik", "Emre Şahin"], body: "Kampanya fiyatlarının pazaryeri sayfalarına sabah 06:00 akışı, minimum satış fiyatı kuralı ve stok eşiği uyarıları." },
    { title: `${PUSULA} — kategori raf planı görüşmesi`, day: 5, time: "14:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Cem Altınbaş (${PUSULA})`, "Zeynep Acar", "Deniz Arslan"], body: "86 mağazalık zincir için Ocak raf planı, NovaCool 640 Plus ve TermoDry H10 yerleşimi ile mağaza içi demo cihaz sayısı." },
    { title: "Kampanya haftası depo ve sevkiyat kapasite planı (davet)", day: 6, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Mert Aksoy", status: "notResponded", with: ["Ömer Gümüş", "Derya Çelik", "Zeynep Acar", "Kaan Özdemir"], body: "20–30 Kasım arasında günlük sevkiyat kapasitesi, bayi bazlı teslimat sırası ve acil sevkiyat kuralları. Katılımınızı bekliyoruz." },
    { title: `${SEDIR} — örnek daire teslim ve montaj planı`, day: 6, time: "13:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Aylin Korkmaz (${SEDIR})`, "Zeynep Acar", "Mert Aksoy"], body: "420 daireli kooperatif projesi için ocak ve davlumbaz seti teslim partileri, montaj ekipleri ve örnek daire onay tutanağı." },
    { title: `${EVIM} — mağaza bazlı teslimat takvimi`, day: 7, time: "15:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Sevgi Akın (${EVIM})`, "Mert Aksoy", "Derya Çelik"], body: "Kampanya öncesi 31 mağazaya teslimat sırası, buzdolabı partilerinin öncelikli gönderimi ve depo kabul saatleri." },
    { title: "Kasım indirim günleri açılış kontrolü", day: 9, time: "08:30", minutes: 30, where: "Microsoft Teams", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Emre Şahin", "Mert Aksoy", "Can Yıldız"], body: "Kampanya fiyatlarının yayına alındığının, depo vardiyasının ve ilk gün sevkiyat önceliklerinin son kontrolü." },
    { title: `${MAVI} — klima ve minibar teklif sunumu`, day: 10, time: "14:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Leyla Sönmez (${MAVI})`, "Zeynep Acar", "Deniz Arslan"], body: "Üç otel ve 310 oda için inverter klima ve minibar teklifi, kış kapanışında montaj takvimi ve garanti şartları." },
    { title: "Trakya bayi ziyareti — Edirne, Çorlu ve Tekirdağ", day: 11, allDay: true, where: "Edirne", organizer: "Onur Polat", with: ["Ömer Gümüş", "Onur Polat"], body: "Trakya Ev Gereçleri'nin üç şubesi ve iki alt bayi; stok sayımı, vitrin düzeni ve vadesi geçmiş bakiye görüşmesi." },
    { title: "Kampanya ara dönem sell-out analizi ve 2027 fiyat çerçevesi (davet)", day: 12, time: "15:00", minutes: 60, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Can Yıldız", "Deniz Arslan", "Emre Şahin"], body: "İlk kampanya günlerinin sell-out okuması ve 2027 liste fiyat çerçevesi için ön çalışma. Katılımınızı bekliyoruz." },
    { title: "Yıl sonu bayi prim ve kota mutabakatı", day: 13, time: "11:00", minutes: 60, where: "Maslak · Toplantı Odası 3", organizer: "Can Yıldız", with: ["Ömer Gümüş", "Derya Çelik", "Onur Polat"], body: "Kota gerçekleşmesi %95 ve üzerindeki bayilerin prim hesabı, vadesi geçmiş bakiye kesintileri ve ödeme takvimi." },
    // geçmiş
    { title: `${MTP} — yeni seri listeleme sunumu`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Yücel (${MTP})`, "Deniz Arslan"], body: "NovaCool 640 serisinin kategori ekibine tanıtımı ve listeleme koşulları." },
    { title: `${AKSU} — saha ve teslimat keşfi`, day: -2, time: "11:00", minutes: 90, where: "Proje şantiye ofisi", organizer: "Ömer Gümüş", with: [`Pınar Ersoy (${AKSU})`, "Zeynep Acar", "Mert Aksoy"], body: "680 daireli projede montaj nişleri, asansör ve teslimat parti planı." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Hedef, servis ve garanti talepleri ve gelişim planı." },
    { title: "Servis ve garanti süreçleri değerlendirmesi", day: -4, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Gizem Tunç", "Elif Kaya"], body: "Yetkili servis müdahale süreleri ve bayi kaynaklı iade oranlarının incelenmesi." },
    { title: `${PUSULA} — tanışma ve kategori sunumu`, day: -1, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Cem Altınbaş (${PUSULA})`, "Zeynep Acar"], body: "86 mağazalık zincirin kategori ekibine TYRO ürün gamı, enerji etiketi avantajları ve bayi iskonto yapısının tanıtımı." },
    { title: `${DORUK} — kampanya sözleşmesi imza görüşmesi`, day: -2, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Emir Tuncer (${DORUK})`, "Derya Çelik", "Can Yıldız"], body: "Pazaryeri kampanya sözleşmesinin son maddeleri: minimum satış fiyatı, iade sorumluluğu ve 60 gün vade." },
    { title: "Ekip 1:1 — Derya Çelik", day: -5, time: "14:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "Sipariş akışı, haftalık rapor otomasyonu ve kampanya dönemi iş yükü." },
    { title: "Ekip 1:1 — Onur Polat", day: -6, time: "11:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Anadolu Ev stok eritme planı, Trakya ve Karadeniz bayilerinin vade durumu." },
    { title: `${SEDIR} — örnek daire ürün seçimi`, day: -7, time: "10:30", minutes: 90, where: "Proje şantiye ofisi", organizer: "Ömer Gümüş", with: [`Aylin Korkmaz (${SEDIR})`, "Zeynep Acar", "Deniz Arslan"], body: "Örnek dairede ChefLine H70 ocak ve davlumbaz setinin yerleşimi, boru ve elektrik bağlantı noktalarının kontrolü." },
    { title: "Aylık satış performans değerlendirmesi — Ekim kapanışı", day: -8, time: "14:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Mert Aksoy"], body: "Ekim ayı ciro, adet ve marj gerçekleşmesi; Q4 için kalan kota ve kampanya hazırlığı." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Tolga Erdem (${EGE})`,
      subject: "Re: Yıl sonu bayi kotası ve prim kademeleri",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Gönderdiğiniz kota ve prim tablosunu yönetimimizle değerlendirdik. Genel çerçeve uygun; yalnızca %2,5'lik yıl sonu priminin kota gerçekleşmesi %95'e ulaştığında devreye girmesini rica ediyoruz. Bu şartla 760 adetlik Q4 kota taahhüdümüzü teyit edebiliriz.",
        "Görüşmeden önce şubelerimizin sell-out rakamlarını da paylaşacağım.",
        "İyi çalışmalar.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Q4 hedef ve stok değerlendirmesi — tek sayfa özet",
      at: { hoursAgo: 4 },
      unread: true,
      body: [
        "Ömer merhaba,",
        `Değerlendirme toplantısı için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'indeyiz (${KPI.achieved} M₺ / ${KPI.quota} M₺; ${KPI.achievedAdet} / ${KPI.quotaAdet} adet); açık pipeline ${KPI.pipeline} M₺, kazanma oranı %${KPI.winRate}.`,
        "Kasım indirim günlerine girmeden riskli üç fırsatı, kritik model stoklarını ve benden istediğin desteği not düş lütfen.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: "Yuvam Konut — son fiyat tablosu ve garanti talebi",
      at: { days: 1, time: "17:40" },
      unread: true,
      body: [
        "Ömer Bey merhaba,",
        "Yuvam'ın satın alma ekibi ankastre set birim fiyatını 18.200 ₺'den 17.400 ₺'ye çekmek ve garantiyi 2 yıldan 3 yıla çıkarmak istiyor. Fiyat talebi kabul edilirse teklif yaklaşık 0,96 M₺ aşağı iner.",
        "Sunumdan önce iskonto sınırı ve garanti uzatma için Mert'in onayını almamız gerekiyor. Sabah on dakika görüşebilir miyiz?",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Kervan Pazaryeri — kampanya iskontosu ve vade onayı",
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: [
        "Merhaba Ömer,",
        "Kervan Pazaryeri Kasım indirim günleri siparişi için %9 ek iskonto ve 90 gün vade istiyor. Standart kampanya iskontosu %6 olduğu için %8 üzeri talepler Selin Hanım'ın onayından geçmeli; vade ve kredi limiti tarafında sorun görmüyorum.",
        "Satış onayını teyit edersen siparişi sisteme girip faturalama takvimini kuracağım.",
      ],
    },
    {
      from: `Sevgi Akın (${EVIM})`,
      subject: "Çerçeve anlaşma toplantısı gündemi",
      at: { days: 1, time: "14:20" },
      body: ["Merhaba Ömer Bey,", "Müzakere toplantısı için gündem önerimiz: (1) kampanya dönemi adet taahhüdü ve prim kademeleri, (2) fiyat koruma ve iade maddeleri, (3) mağaza bazlı teslimat takvimi. Eklemek istediğiniz başlık varsa bildirin."],
    },
    {
      from: `Serkan Yücel (${MTP})`,
      subject: "Listeleme sunumu için teşekkürler",
      at: { days: 1, time: "18:05" },
      unread: true,
      body: ["Merhaba Ömer Bey,", "Sunum için teşekkür ederiz. Kategori ekibimiz NovaCool 640 serisini Ocak raf planına almaya sıcak bakıyor; yalnızca liste fiyatı ve iade koşulları için yazılı teklifinizi bekliyoruz."],
    },
    {
      from: `Barış Tekin (${KERVAN})`,
      subject: "Kasım indirim günleri stok taahhüdü ve teslimat penceresi",
      at: { days: 2, time: "16:05" },
      body: ["Ömer Bey merhaba,", "Kampanya başlamadan raflarda olması gereken 840 adetlik siparişi 18 Kasım'a kadar teslim edebilir misiniz? Depomuzun kabul penceresi 15–18 Kasım arası. Buzdolabı sevkiyatını ilk güne alırsak çok iyi olur."],
    },
    {
      from: `Pınar Ersoy (${AKSU})`,
      subject: "Saha keşfi sonrası montaj soruları",
      at: { days: 2, time: "16:40" },
      body: ["Ömer Bey merhaba,", "Saha keşfinden sonra teknik ekibimizle konuştuk: 680 daireden 240'ında çamaşır makinesi nişi dar kalıyor. Dar nişe uygun 8 kg'lık bir model alternatifiniz var mı? Teslimat partilerini de kat sırasına göre planlamak istiyoruz."],
    },
    {
      from: "Deniz Arslan",
      subject: "NovaCool 640 Plus ve yeni enerji etiketi — satış sunumu güncellendi",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "Satış sunumuna NovaCool 640 Plus modellerini ve yeni enerji etiketi karşılaştırma slaytını ekledim. Plus modeller eski seriye göre %32 daha az enerji tüketiyor; zincir mağaza görüşmelerinde A enerji sınıfı farkını bu tabloyla anlatabilirsiniz."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık sell-in ve sell-out raporu",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: ["Merhaba Ömer Bey,", `Son 30 günde ${KPI.closed30} M₺ sell-in kapanışı gerçekleşti; kazanma oranı %${KPI.winRate}. Sell-out tarafında Anadolu Ev Aletleri'nin satış hızı yavaşlıyor, stok devri 52 güne çıktı. Rapor ekte ve paylaşılan klasörde.`],
    },
    {
      from: `Ferhat Duman (${LACI})`,
      subject: "Otel projesi: oda sayıları ve ürün listesi",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "Altı otelimizdeki yenileme için toplam 640 oda bilgisi hazır: her odaya inverter klima ve minibar tipi buzdolabı, çamaşırhaneler için 12 çamaşır ve 6 kurutma makinesi düşünüyoruz. Sezon kapanışı olan otellerde montajı Ocak'ta yapmak istiyoruz."],
    },
    {
      from: "Mert Aksoy",
      subject: "Kasım teslimat takvimi ve depo kapasitesi",
      at: { days: 5, time: "13:25" },
      body: ["Ömer,", "Kasım indirim günleri öncesi depo doluluğu %91'e çıktı. NovaCool 640'ta stok yalnızca 11 günlük satışa yetiyor; ikinci parti 14 Kasım'da geliyor. Kervan, Evim ve Ege Ev siparişlerinin sevkiyat sırasını satış tarafından netleştirebilir misin?"],
    },
    {
      from: `Nilay Gökçe (${YUVAM})`,
      subject: "Ankastre set numunesi ve garanti şartları",
      at: { days: 6, time: "15:40" },
      important: true,
      body: ["Merhaba Ömer Bey,", "Şantiyedeki örnek dairede kurulan ChefLine ankastre seti inceledik; teknik ekibimiz memnun. Sözleşme öncesi 3 yıllık garantiyi ve dört parti halindeki teslimat takvimini yazılı görmek isteriz.", "İlk parti Ocak başında 300 daire için gerekecek."],
    },
    { from: "Kaan Özdemir", subject: "İzmir ve Manisa bayi ziyaret planı", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, İzmir ve Manisa ziyaretlerini tek güne topladım: sabah Ege Ev'in Bornova şubesi, öğleden sonra iki alt bayi. Plan ekte; onayınızla randevuları sabitleyeceğim."] },
    { from: "Emre Şahin", subject: "Kasım indirim günleri broşürü ve raf etiketi onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, broşürün ve raf etiketlerinin son hali ekte. Fiyat, tarih ve enerji sınıfı bilgilerini satış tarafı bir kez daha kontrol etsin; baskıya bu haftanın sonunda vermemiz gerekiyor."] },
    { from: `Gülşen Kara (${ANAD})`, subject: "Q4 kota revizyonu talebi", at: { days: 9, time: "14:15" }, body: ["Merhaba Ömer Bey,", "Bölgemizde sell-out yavaşladığı için Q4 kotamızı 520 adetten 440 adede çekmeyi rica ediyoruz. Karşılığında Kasım indirim günlerinde mevcut stoğu eritmeye odaklanacağız."] },
    { from: "Elif Kaya", subject: "Asistan demo ortamı: bayi ve stok soruları eklendi", at: { days: 10, time: "16:30" }, body: ["Ömer Bey, müşteri sunumlarında kullanabileceğiniz asistan demo ortamına bayi performansı ve stok soruları da eklendi. Örnek veriler yüklü."] },

    {
      from: `Nurten Aydoğdu (${TRAKYA})`,
      subject: "Q4 stok devri ve kampanya sipariş taslağı",
      at: { hoursAgo: 7 },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Üç şubemizdeki stokları sayarak hazırladığımız Kasım indirim günleri sipariş taslağı ekte: buzdolabında 180, çamaşır makinesinde 140, bulaşık makinesinde 90 adet. Stok devrimiz şu an 46 gün olduğu için bulaşık makinesinde miktarı düşük tuttuk.",
        "Trakya ziyaretiniz öncesinde vadesi geçmiş 0,7 M₺'lik bakiye için ödeme planımızı da paylaşacağım.",
      ],
    },
    {
      from: `Murat Dinçer (${KARA})`,
      subject: "FrostLine 480 ve AquaPure W7 Slim ilk sezon siparişi",
      at: { days: 1, time: "09:20" },
      unread: true,
      important: true,
      body: [
        "Ömer Bey merhaba,",
        "Karadeniz'deki dokuz mağazamız için FrostLine 480 No-Frost buzdolabında 260, AquaPure W7 Slim çamaşır makinesinde 220 adetlik ilk sezon siparişi vermeyi planlıyoruz. Dar daire projelerinde W7 Slim'e talep belirgin biçimde artıyor.",
        "Siparişten önce mevcut 0,5 M₺'lik vadesi geçmiş bakiyemiz için Can Bey'le bir ödeme takvimi yapmamız gerekiyor; bunu görüşmede konuşabilir miyiz?",
      ],
    },
    {
      from: `Cem Altınbaş (${PUSULA})`,
      subject: "Mağaza listesi ve Ocak raf planı için bilgi talebi",
      at: { days: 1, time: "16:30" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Tanışma sunumunuz için teşekkür ederiz. 86 mağazamızın büyüklük ve bölge bilgisini ekledik; mağazaların 24'ü büyük format olduğu için demo cihaz ve ürün sayısını bu mağazalarda artırmayı düşünüyoruz.",
        "Raf planı görüşmesinden önce NovaCool 640 Plus ve TermoDry H10 için önerdiğiniz liste fiyatını da görmek isteriz.",
      ],
    },
    {
      from: `Emir Tuncer (${DORUK})`,
      subject: "Kampanya fiyat akışı: iki modelde minimum fiyat uyarısı",
      at: { days: 2, time: "11:45" },
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "Pazaryeri panelinde SilentWash D14 ve ChefLine F60 için üçüncü taraf satıcıların fiyatı sizin kampanya fiyatınızın altına inmiş görünüyor. Sözleşmedeki minimum satış fiyatı kuralını uygulayabilmemiz için bu iki modelin satıcı listesini ekledik.",
        "Fiyat senkronizasyonu toplantısında ele alırsak sayfaları kampanya başlamadan düzeltebiliriz.",
      ],
    },
    {
      from: `Leyla Sönmez (${MAVI})`,
      subject: "Üç otel için klima ve minibar teklif talebi",
      at: { days: 3, time: "10:25" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Üç otelimizdeki 310 odanın yenilemesi için inverter klima ve minibar tipi buzdolabı teklifi rica ediyoruz. Oteller sezon dışında kapalı olacağı için montajı Aralık sonu ile Şubat başı arasına yaymayı planlıyoruz.",
        "Garanti süresi ve montaj sonrası ilk bakım ziyareti teklifte ayrıca yer alsın lütfen.",
      ],
    },
    {
      from: `Aylin Korkmaz (${SEDIR})`,
      subject: "Örnek daire onayı ve teslim takvimi",
      at: { days: 3, time: "15:50" },
      important: true,
      body: [
        "Ömer Bey merhaba,",
        "Yönetim kurulumuz örnek dairedeki ChefLine H70 ocak ve davlumbaz setini onayladı. 420 dairenin teslimini üç partiye bölmek istiyoruz; ilk parti 140 daire için Şubat başında gerekli.",
        "Teslim planına montaj ekibinin kat bazında çalışma takvimini de eklerseniz sözleşme taslağını hazırlatacağız.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Vadesi geçmiş bakiyeler ve kredi limiti güncellemesi",
      at: { days: 4, time: "14:05" },
      flagged: true,
      important: true,
      body: [
        "Ömer,",
        `Açık cari bakiyemiz ${KPI.openReceivable} M₺; bunun ${KPI.overdue} M₺'si vadesi geçmiş durumda. Gecikmenin 1,6 M₺'si Anadolu Ev Aletleri'nde, 0,7 M₺'si Trakya Ev Gereçleri'nde, 0,5 M₺'si Karadeniz Beyaz Eşya'da, kalan 0,3 M₺'si Ege Ev'de.`,
        "Vadesi geçmiş bakiyesi olan bayilerin yeni kampanya siparişi ödeme planı netleşmeden sevk edilmeyecek. İlk üç bayi için görüşme tarihlerini satış tarafından rica ediyorum.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Garanti talepleri ve servis SLA özeti — Ekim",
      at: { days: 4, time: "11:40" },
      body: [
        "Ömer Bey merhaba,",
        `Ekim'de 1.420 servis talebi açıldı; SLA içinde kapanış oranı %${KPI.sla}, bayi kaynaklı iade oranı %${KPI.returnRate} oldu. En sık tekrar eden arızalar SilentWash D14'te drenaj pompası ve AquaPure W9'da kapak kilidi.`,
        "Yedek parça bekleme süresi ortalama 3,2 gün. Yuvam'ın istediği 3 yıl garanti için ünite başı maliyet çalışmasını bu hafta tamamlayıp Mert Bey'e göndereceğim.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "Anadolu Ev Aletleri stok eritme planı taslağı",
      at: { days: 5, time: "16:20" },
      body: [
        "Ömer Bey,",
        "Gülşen Hanım'la konuştuğum taslak şöyle: bulaşık makinesinde SilentWash D14 için kampanya döneminde ek %2 destek, çamaşır makinesinde üçlü bayi paketi. Hedef stok devrini 52 günden 45 günün altına çekmek.",
        "Kota düşürme talebini (520 → 440 adet) bu plana bağlı kabul etmeyi öneriyorum; onayınızı alırsam bayiye yazılı olarak iletirim.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: "Evim çerçeve anlaşma — hukuk görüşü ve iade maddesi",
      at: { days: 6, time: "10:15" },
      body: [
        "Ömer Bey merhaba,",
        "Evim sözleşmesi için hukuk ekibinin görüşü geldi: fiyat koruma maddesi 60 günle sınırlanırsa kabul edilebilir; iade maddesinde ise teşhir ürünleri kapsam dışında bırakılmalı. Revize taslağı paylaşılan klasöre yükledim.",
        "Müzakerede prim kademelerine geçmeden önce bu iki maddeyi netleştirmeyi öneririm.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "NovaCool 640 Plus ilk parti kabul planı",
      at: { days: 7, time: "10:50" },
      flagged: true,
      body: [
        "Ömer,",
        `14 Kasım'da fabrikadan çıkacak ilk parti 1.600 adet. Bayilerden gelen ön sipariş ${KPI.plusPreorder} adet; kalan 220 adedi kampanya başlangıcında gelecek taleplere ayırmayı öneriyorum.`,
        "Kabul ve etiketleme için ek vardiya planladım; sevkiyat sırasını Kervan, Evim, Ege Ev şeklinde sabitlersek depo akışı rahat ilerler.",
      ],
    },
    {
      from: "Ayşe Demir",
      subject: "Bayi yönetimi eğitimi — katılımcı listesi",
      at: { days: 8, time: "15:25" },
      body: [
        "Ömer Bey merhaba,",
        "Bayi yönetimi eğitiminin katılımcı listesi hazır: ekibinizden Kaan ve Gizem kayıtlı; Onur'un talebi onayınızı bekliyor, Zeynep ise bekleme listesinde. Eğitim öncesi okuma dokümanı bir gün önceden gönderilecek.",
        "Eğitim sonrası memnuniyet formunu ekibinize iletmenizi rica ederiz.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: "Rakip fiyat endeksi — Kasım ikinci hafta özeti",
      at: { days: 9, time: "13:45" },
      body: [
        "Ömer,",
        "Rakip kampanya fiyatlarının ikinci hafta taramasını tamamladım: segment ortalamasına göre NovaCool 640 endeksi 103, AquaPure W9 98, SilentWash D14 104, ChefLine F60 97. Bulaşık makinesinde bizi pahalı konumlandıran bir tablo var; rakipler ortalama %10 indirim ilan etti.",
        "Sunumlarda SilentWash D14 için servis ağı ve garanti farkını öne çıkarmayı öneririm; ayrıntılı tablo paylaşılan klasörde.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Mağaza içi vitrin ve QR kodlu enerji etiketi çalışması",
      at: { days: 10, time: "14:25" },
      body: [
        "Ömer merhaba,",
        "Evim ve Pusula mağazaları için hazırladığımız vitrin düzeni ile QR kodlu enerji etiketi çalışmasının ilk tasarımları hazır. QR kod müşteriyi ürün sayfasındaki enerji karşılaştırma tablosuna götürüyor.",
        "Satış tarafının onaylayacağı ürün adı ve enerji sınıfı listesini ek dosyada işaretledim; iki gün içinde dönüş alabilirsem baskıyı bu ay bitirebiliriz.",
      ],
    },
    {
      from: `Tolga Erdem (${EGE})`,
      subject: "Q3 prim hesabı fatura mutabakatı",
      at: { days: 10, time: "14:00" },
      body: [
        "Merhaba Ömer Bey,",
        "Q3 prim hesabınızı kendi kayıtlarımızla karşılaştırdık; iki fatura arasında toplam 42.000 ₺'lik iade kesintisi farkı çıktı. Düzeltilmiş döküm ekte.",
        "Mutabakat belgesini bu ay içinde imzalayıp kota görüşmesine temiz bir tabloyla girmek isteriz.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "2027 bayi modeli çalıştayı için ön okuma",
      at: { days: 11, time: "09:40" },
      body: [
        "Ömer merhaba,",
        "Çalıştay öncesi iki sayfalık ön okumayı ekledim: iskonto yapısının sadeleştirilmesi, e-ticaret ile fiziksel bayi kanalı arasındaki fiyat dengesi ve proje satışları için ayrı bir kota modeli.",
        "Bölgenden gördüğün üç sorunu toplantıdan önce yazıp bana gönderirsen çalıştayda onlardan başlarız.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "Bornova şubesi stok sayımı notları",
      at: { days: 12, time: "17:30" },
      body: [
        "Ömer Bey, Ege Ev Bornova şubesinde yapılan sayımın notlarını ekledim: teşhir ürünlerinde 14 adet fark var, depoda ise SilentWash D14 stoğu kayıtlardan 22 adet fazla çıktı. Tolga Bey şubenin sayımı düzeltip sonuçları bize iletecek.",
        "İzmir ziyaretinde bu farkları gösterip kampanya öncesi sayım rutini önermeyi planlıyorum.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "Ekim kapanışı: bayi cari mutabakat listesi",
      at: { days: 13, time: "09:15" },
      body: [
        "Merhaba Ömer Bey,",
        "Ekim kapanışı için bayi cari mutabakat listesi hazır: altı bayi mutabakat formunu imzalamış, Anadolu Ev Aletleri ile Trakya Ev Gereçleri'nin formları bekleniyor. Eksik formlar için bayilere hatırlatma gönderdim.",
        "Liste Finans ile paylaşıldı; imzasız bayilerin kampanya siparişleri için Can Bey ayrıca bilgilendirildi.",
      ],
    },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları: beyaz eşya grubunda rekor adet", at: { days: 1, time: "09:05" }, body: ["Üçüncü çeyrekte toplam satış adedimiz geçen yılın aynı dönemine göre %14, cirosu %21 arttı. Büyümenin itici gücü A enerji sınıfı buzdolapları ve ısı pompalı kurutma makineleri oldu.", "Yıl sonu bayi primi ve kotası programı Kasım başında bayilerle paylaşıldı. Tüm satış, lojistik ve servis ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "NovaCool 640 serisi genişliyor: Plus modelleri 14 Kasım'da sevkiyata çıkıyor", at: { days: 4, time: "10:20" }, body: ["Talebin yüksek olduğu NovaCool 640 serisine Plus modelleri ekleniyor. A enerji sınıfındaki yeni modeller eski seriye göre %32 daha az enerji tüketiyor ve 10 yıl kompresör garantisiyle geliyor.", "İlk parti 14 Kasım'da fabrikadan çıkacak; bayi ve zincir mağaza raflarında Kasım indirim günlerinde yer alacak."] },
    { feed: "haberler", subject: "Gebze dağıtım merkezinde yeni raf sistemi devrede", at: { days: 8, time: "11:00" }, body: ["Yeni yüksek raf sistemiyle depo kapasitesi %18 arttı. Sipariş hazırlama süresi ortalama 36 saatten 24 saate indi.", "Kasım indirim günlerinde bayi siparişlerinin tamamı 48 saat içinde sevkiyata çıkarılacak."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: Bayi Portalı cumartesi 02:00–04:00 arası kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–04:00 arasında altyapı bakımı yapılacak. Bu sürede Bayi Portalı ve sipariş ekranları kullanılamayacak; e-posta ve Teams açık kalacak."] },
    { feed: "duyuru", subject: "Kasım indirim günleri fiyat listesi yayında", at: { days: 6, time: "09:00" }, important: true, body: ["Kasım indirim günleri 20–30 Kasım arasında. Güncel kampanya fiyat listesi ve bayi iskonto tablosu paylaşılan klasörde. Bayi sell-in siparişleri 13 Kasım'a kadar alınacak.", "Ek iskonto: buzdolabı, çamaşır ve bulaşık makinesinde %6; fırın, ocak ve ankastre ürünlerde %4; klimada %3. %8 üzeri talepler Satış Direktörlüğü onayına tabidir."] },
    { feed: "duyuru", subject: "Kasım indirim günlerinde depo vardiyası uzatılıyor", at: { days: 11, time: "14:30" }, body: ["20–30 Kasım arasında Gebze dağıtım merkezi 06:00–22:00 arası çalışacak. Acil sevkiyat talepleri için Operasyon'a en geç 16:00'ya kadar bildirim yapılmalı."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Burcu Yalçın", at: { days: 3, time: "09:30" }, body: ["Bayi Operasyon Uzmanı olarak satış operasyon ekibimize katılan Burcu Yalçın'a hoş geldin diyoruz. Burcu, bayi siparişleri ve cari takip süreçlerinden sorumlu olacak.", "Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan bölge satış ekibimizden Kaan Özdemir'e ve depo ekibimizden Hüseyin Taşkın'a iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "Kasım indirim günlerinde izin düzeni ve 2027 izin planlaması", at: { days: 9, time: "10:00" }, body: ["20–30 Kasım arasında satış, lojistik ve servis ekiplerinde yıllık izin kullanılamaz. İzin talepleriniz bu tarihler dışında normal akışla onaylanır.", "2027 yıllık izin planlarınızı 30 Kasım'a kadar yöneticinizle birlikte girmenizi rica ederiz."] },
    { feed: "egitim", subject: "Bayi yönetimi eğitimi: stok devir hızı ve sipariş planlama", at: { days: 5, time: "11:15" }, body: ["Bayi yönetimi eğitimi davetiniz takviminize eklendi. Konular: güvenli stok hesabı, stok devir hızı yorumlama, sell-in ve sell-out dengesi.", "Kontenjan 20 kişidir; katılamayacaksanız İK'ya haber vermeniz yeterli."] },
    { feed: "egitim", subject: "Zorunlu eğitim: ürün güvenliği ve garanti koşulları", at: { days: 12, time: "09:20" }, body: ["Ürün güvenliği ve garanti koşulları eğitimini bu ay sonuna kadar tamamlamanız gerekiyor. Eğitim 45 dakikadır ve çevrimiçi tamamlanır."] },
    { feed: "akademi", subject: "Yeni modül: Enerji etiketi ve enerji sınıfları", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: yeni enerji etiketi nasıl okunur, sınıflar arasındaki fark müşteriye rakamla nasıl anlatılır? 20 dakikalık video ve karşılaştırma tablosu."] },
    { feed: "akademi", subject: "Yeni video serisi: tyroInsight ile sell-out analizi", at: { days: 13, time: "11:00" }, body: ["tyroInsight ile bayi bazlı sell-out nasıl okunur? Üç bölümlük seride veri kaynakları, stok devir hızı yorumlama ve kampanya sonrası analiz anlatılıyor."] },
    { feed: "kulup", subject: "Cuma akşamı kulüp buluşması: Mutfak atölyesi", at: { days: 3, time: "12:30" }, body: ["Mutfak kulübü Cuma akşamı ofis mutfağında buluşuyor. Bu kez şefimiz yeni ankastre fırın serimizle ev yapımı ekmek ve tatlı yapacak. Katılmak isteyen herkes davetlidir."] },
    { feed: "kulup", subject: "Eski cihaz toplama günü: geri dönüşüm kampanyası", at: { days: 10, time: "13:00" }, body: ["Kullanmadığınız küçük ev aletlerini 25 Kasım'a kadar lobideki toplama noktasına bırakabilirsiniz. Cihazlar yetkili geri dönüşüm firmasına teslim edilecek; toplanan her cihaz için fidan bağışı yapılacak."] },
    { feed: "haberler", subject: "Gebze fabrikamız enerji yönetimi belgesini aldı", at: { days: 6, time: "10:15" }, body: ["Gebze üretim tesisimiz bağımsız denetim sonucunda enerji yönetim sistemi belgesine hak kazandı. Son iki yılda üretilen cihaz başına enerji tüketimi %9 azaldı.", "Belge, A enerji sınıfı ürün gamımızın kurumsal müşteri ve proje tekliflerinde güvenilirlik referansı olarak kullanılacak."] },
    { feed: "haberler", subject: "Bayi memnuniyet anketi: genel memnuniyet %87'ye çıktı", at: { days: 10, time: "09:40" }, body: ["Eylül'de yapılan bayi memnuniyet anketine 142 bayi katıldı. Genel memnuniyet geçen yılın %81 seviyesinden %87'ye yükseldi; en yüksek puanı sevkiyat hızı ve Bayi Portalı aldı.", "Gelişim alanları yedek parça bekleme süresi ve garanti taleplerinde geri bildirim hızı oldu. Aksiyon planı Aralık ayında paylaşılacak."] },
    { feed: "haberler", subject: "Isı pompalı kurutma makinesi ailesine yeni üye: TermoDry H10", at: { days: 12, time: "11:20" }, body: ["Isı pompalı kurutma makinesi ailemize yeni 10 kg'lık TermoDry H10 katılıyor. Geleneksel kurutma makinelerine göre %55 daha az enerji tüketen model, Kasım indirim günlerinde bayi ve zincir mağaza raflarında olacak.", "Ürün eğitimi ve satış sunumu Akademi'de yayında; ön sipariş veren bayilerin listesi Satış Operasyon'da."] },
    { feed: "duyuru", subject: "Bayi Portalı'nda yenilenen sipariş ekranı yayında", at: { days: 3, time: "13:10" }, body: ["Bayi Portalı'nın yenilenen sipariş ekranı yayına alındı. Model bazında stok görünürlüğü, kampanya iskontosunun otomatik uygulanması ve sipariş taslağını Excel'e aktarma özellikleri eklendi.", "Kampanya dönemi öncesinde bayilere kısa bir kullanım videosu gönderilecek; sorularınız için Satış Operasyon ekibine ulaşabilirsiniz."] },
    { feed: "duyuru", subject: "Kasım indirim günlerinde servis hattı mesai saatleri uzatıldı", at: { days: 7, time: "16:05" }, body: ["20–30 Kasım arasında yetkili servis çağrı merkezi 08:00–22:00 saatleri arasında hizmet verecek. Hafta sonu randevu kapasitesi %40 artırıldı.", "Bayiler servis taleplerini Bayi Portalı üzerinden açmaya devam edecek; 48 saat ilk müdahale hedefi korunuyor."] },
    { feed: "duyuru", subject: "Yıl sonu stok sayımı takvimi açıklandı", at: { days: 13, time: "10:30" }, body: ["Gebze dağıtım merkezinde yıl sonu stok sayımı 29–30 Aralık'ta yapılacak. Bu tarihlerde sevkiyat yapılmayacağı için bayi siparişlerinin 24 Aralık'a kadar verilmesi önerilir.", "Bayi kodlarına bağlı konsinye stoklar için sayım formları Aralık ortasında paylaşılacak."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Tuğba Eren", at: { days: 6, time: "09:20" }, body: ["Servis Planlama Uzmanı olarak operasyon ekibimize katılan Tuğba Eren'e hoş geldin diyoruz. Tuğba, yetkili servis kapasite planlaması ve yedek parça siparişlerini yürütecek.", "İlk günlerinde satış ve servis ekipleriyle tanışma görüşmeleri yapacak. Kendisine başarılar dileriz."] },
    { feed: "ik", subject: "Kasım ayı doğum günleri", at: { days: 12, time: "08:50" }, body: ["Kasım ayında doğum günü olan lojistik ekibimizden Cengiz Bal'a, servis ekibimizden Sibel Kurt'a ve satış ekibimizden Gizem Tunç'a iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "Yıl sonu performans değerlendirme takvimi", at: { days: 11, time: "14:10" }, body: ["Yıl sonu performans değerlendirmeleri 7–18 Aralık arasında yapılacak. Öz değerlendirme formlarınızı 4 Aralık'a kadar İK portalından tamamlamanız gerekiyor.", "Satış ekiplerinde Q4 hedef gerçekleşmesi, bayi memnuniyeti ve yeni müşteri kazanımı göstergeleri değerlendirmeye dahildir."] },
    { feed: "egitim", subject: "Yeni eğitim: konut ve otel projelerinde teklif hazırlama", at: { days: 4, time: "10:45" }, body: ["Proje satışları için hazırlanan yarım günlük eğitim Aralık'ta iki oturum olarak açılıyor. Konular: şartname okuma, teslimat partisi planlama, garanti ve montaj şartlarının tekliflendirilmesi.", "Kontenjan oturum başına 15 kişidir; kayıt için İK portalındaki eğitim takvimini kullanabilirsiniz."] },
    { feed: "egitim", subject: "Atölye: bayi sunumunda ikna edici anlatım", at: { days: 8, time: "13:30" }, body: ["Sunum becerileri atölyesi bayi ve zincir mağaza görüşmeleri için tasarlandı. Rakamla konuşmak, itirazlara yanıt vermek ve 10 dakikalık özet sunum hazırlamak uygulamalı olarak çalışılacak.", "Atölye 3 saat sürüyor; katılımcılardan kendi bayi sunumlarından birini getirmeleri isteniyor."] },
    { feed: "egitim", subject: "Çevrimiçi eğitim: kredi limiti ve tahsilat temelleri", at: { days: 10, time: "09:50" }, body: ["Satış ekipleri için hazırlanan 40 dakikalık çevrimiçi eğitim yayında. Vade, kredi limiti, teminat ve gecikme faizi kavramları kampanya dönemi örnekleriyle anlatılıyor.", "Bayi bakiyesi takip eden tüm satış temsilcilerinin Aralık ortasına kadar tamamlaması bekleniyor."] },
    { feed: "akademi", subject: "Yeni içerik: ısı pompalı kurutma makinelerinde verimlilik", at: { days: 2, time: "15:20" }, body: ["Isı pompalı teknoloji nasıl çalışır, enerji tasarrufu müşteriye yıllık ₺ olarak nasıl anlatılır? 15 dakikalık video ve hesap tablosu Akademi'de yayında."] },
    { feed: "akademi", subject: "Yeni modül: konut projelerinde ankastre set şartnamesi", at: { days: 9, time: "16:40" }, body: ["Konut projelerinde şartname nasıl okunur, ankastre set ve montaj nişi ölçüleri nasıl kontrol edilir? Modül; örnek şartname, ölçü kontrol listesi ve 12 soruluk kısa bir sınav içeriyor."] },
    { feed: "akademi", subject: "Uygulamalı örnek: tyroForecast ile kampanya talep tahmini", at: { days: 11, time: "10:05" }, body: ["tyroForecast ile kampanya dönemi talep tahmini nasıl hazırlanır? Geçmiş kampanya verisi, mevsimsellik ve stok kısıtı birlikte değerlendirilerek model bazlı sipariş önerisi çıkarılıyor. 25 dakikalık video ve örnek veri seti hazır."] },
    { feed: "kulup", subject: "Fotoğraf kulübü: Maslak'ta sonbahar yürüyüşü", at: { days: 4, time: "12:15" }, body: ["Fotoğraf kulübü bu ay Maslak çevresinde sonbahar renklerini çekiyor. Öğle arasında 45 dakikalık bir yürüyüş yapılacak; telefonla çekenler de katılabilir. Seçilen kareler lobideki panoda sergilenecek."] },
    { feed: "kulup", subject: "Kitap kulübü: Kasım seçkisi ve buluşma", at: { days: 6, time: "14:50" }, body: ["Kitap kulübünün Kasım kitabı bir iş dünyası romanı olarak seçildi. Buluşma ayın son haftasında öğle arasında 4. kat toplantı salonunda olacak; kitabı bitirememiş olanlar da sohbete katılabilir."] },
    { feed: "kulup", subject: "Halı saha turnuvası takım kayıtları başladı", at: { days: 8, time: "11:50" }, body: ["Satış, lojistik ve servis takımlarının katılacağı halı saha turnuvası Aralık'ın ilk yarısında oynanacak. Takım kayıtları 24 Kasım'a kadar açık; her takım 7 kişiden oluşuyor."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${YUVAM} ankastre set teklifini güncelle ve gönder`, due: 0, importance: "high", steps: ["Birim fiyat ve iskonto tablosunu doğrula", "3 yıl garanti için Mert'ten onay al", "Teklifi PDF olarak gönder"], note: "1.200 daire; teslimat dört parti halinde planlanacak. İlk parti Ocak başında 300 daire." },
          { title: `${KERVAN} ek iskonto talebini Selin'e ilet`, due: 0, importance: "high", note: "%9 ek iskonto ve 90 gün vade talebi; standart kampanya iskontosu %6. %8 üzeri Selin Aydın onayında." },
          { title: `${EVIM} çerçeve anlaşma maddelerini gözden geçir`, due: 1, importance: "high", steps: ["Adet taahhüdü ve prim kademeleri", "Ödeme vadesi", "Fiyat koruma ve iade maddesi"] },
          { title: "Q4 hedef ve stok değerlendirme sunumunu hazırla", due: 2, steps: ["Rakamları Derya'dan al", "Riskli fırsatlar slaytı", "Kritik model stokları için Mert ile netleş", "Selin ile prova yap"] },
          { title: "Haftalık sell-in ve sell-out raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: "Bayilerden Kasım indirim günleri sell-in siparişlerini topla", due: 4, importance: "high", note: "Sipariş son tarihi 13 Kasım. Teslimatlar 19 Kasım'a kadar tamamlanacak." },
          { title: `${EGE} yıl sonu kota ve prim tablosunu hazırla`, due: 3, steps: ["Alt bayi bazında kota gerçekleşmesi", "Prim kademesi simülasyonu (tyroPricing)"] },
          { title: "Kampanya broşürünü ve fiyat listesini bayilere gönder", due: 1, steps: ["Fiyat ve tarih bilgilerini doğrula", "Bayi e-postasını yaz"] },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: `${MTP} yeni seri listeleme teklifini gönder`, due: 2, note: "Liste fiyatı ve iade koşulları yazılı istendi." },
          { title: `${AKSU} için dar nişe uygun çamaşır makinesi alternatifi sor`, due: 3, importance: "low" },
          { title: `${LACI} otel projesi için ürün listesi taslağı çıkar`, due: 6 },
          { title: "Bölge bayi ziyaret planlarını onayla", due: 5, steps: ["İzmir randevuları", "Manisa alt bayi randevuları"] },
          { title: "Rakip kampanya fiyatlarını sell-out verisiyle karşılaştır", due: 7, importance: "low" },
          { title: `${AKSU} saha keşfi notlarını paylaş`, completedDaysAgo: 1 },
          { title: `${ANAD} kota taslağını gönder`, completedDaysAgo: 2 },
          { title: "Kasım kampanya fiyat listesini onayla", completedDaysAgo: 3 },
          { title: "Tolga Erdem'in %95 şartlı prim talebine yanıt ver", due: 0, importance: "high", note: "Tolga Erdem (Ege Ev), %2,5 yıl sonu priminin kota gerçekleşmesi %95'e ulaşınca devreye girmesi şartıyla 760 adetlik Q4 kotasını teyit etmeye hazır." },
          { title: `${KERVAN} 840 adetlik sipariş için teslimat planını gönder`, due: 2, steps: ["Buzdolabı partisini kabul penceresinin ilk gününe al", "Mert'ten depo çıkış sırasını doğrula", "Barış Tekin'e plan e-postasını yaz"] },
          { title: `${SEDIR} onay tutanağını ve teslim planını hazırla`, due: 4, steps: ["Üç parti teslim takvimi", "Kat bazında montaj ekibi planı", "Sözleşme taslağı için hukuk görüşü"] },
          { title: `${PUSULA} raf planı ve liste fiyatı teklifini hazırla`, due: 5, importance: "high", steps: ["86 mağaza için ürün ve demo cihaz listesi", "NovaCool 640 Plus ve TermoDry H10 liste fiyatı", "İade koşulları ve teşhir ürünü maddesi"] },
          { title: `${MAVI} klima ve minibar teklifini çıkar`, due: 6, steps: ["310 oda için ürün listesi", "Montaj ve ilk bakım ziyareti maliyeti", "Garanti ve kış kapanışı takvimi"] },
          { title: `${MTP} iade koşulları için Mert'le ortak yanıt hazırla`, due: -2, status: "inProgress", note: "Serkan Yücel liste fiyatı ve iade koşullarını yazılı olarak bekliyor." },
          { title: "Evim hukuk görüşünü Zeynep'le değerlendir", due: 1 },
          { title: `${EVIM} satın alma ekibine ön teklifi gönder`, completedDaysAgo: 4 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile hedef toplantısı", due: 3 },
          { title: "Onur için bayi yönetimi eğitim planı hazırla", due: 8 },
          { title: "Gizem'in garanti ve servis sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın İzmir ziyaret raporunu oku", due: 9, importance: "low" },
          { title: "Derya ile Kasım sipariş akışı ve rapor otomasyonunu gözden geçir", due: 2 },
          { title: "Gizem ile garanti uzatma maliyet çalışmasını tamamla", due: 5, steps: ["3 yıl garanti için ünite başı maliyet", "Mert Aksoy'a sunulacak tek sayfa özet"] },
          { title: "Onur'un Anadolu Ev stok eritme planını onayla", due: 1, importance: "high" },
          { title: "Ekip Q4 ara değerlendirme notlarını paylaş", completedDaysAgo: 3 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Kış lastiği değişimi için randevu al", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Araç muayene randevusu al", due: 11, importance: "low" },
          { title: "Kitap kulübü Kasım kitabını bitir", due: 12, importance: "low" },
        ],
      },
      {
        name: "Bayi Takibi",
        tasks: [
          { title: "Anadolu Ev Aletleri stok eritme planını Gülşen Kara'ya ilet", due: 1, importance: "high", steps: ["Onur'un taslağını gözden geçir", "SilentWash D14 ek destek oranını Selin'le teyit et", "Kota düşürme talebine yazılı yanıt ekle"] },
          { title: "Vadesi geçmiş bayi bakiyeleri için ödeme planı görüşmelerini ayarla", due: 1, importance: "high", note: `Vadesi geçmiş toplam ${KPI.overdue} M₺: Anadolu 1,6; Trakya 0,7; Karadeniz 0,5; Ege Ev 0,3.` },
          { title: "Anadolu Ev'den eksik cari mutabakat formunu iste", due: -3, status: "inProgress", importance: "high" },
          { title: `${KARA} yeni sezon stok planını hazırla`, due: 2, steps: ["FrostLine 480 sipariş miktarı", "AquaPure W7 Slim dar niş talebi", "Mevcut 0,5 M₺ bakiye için ödeme takvimi"] },
          { title: `${DORUK} minimum fiyat ihlali listesini kontrol et`, due: 3, importance: "high", note: "SilentWash D14 ve ChefLine F60 sayfalarında üçüncü taraf satıcılar kampanya fiyatının altında." },
          { title: `${PUSULA} mağaza listesini al ve büyük format mağazaları işaretle`, due: 4 },
          { title: `${EVIM} mağaza bazlı teslimat takvimini doğrula`, due: 6 },
          { title: "Ege Ev alt bayilerine kampanya bilgilendirme e-postasını gönder", due: 3, importance: "low" },
          { title: "Bayi Portalı yeni sipariş ekranı geri bildirimlerini topla", due: 7, importance: "low" },
          { title: `${KARA} görüşme notlarını gönder`, completedDaysAgo: 2 },
          { title: `${KERVAN} cari bakiye mutabakatını tamamla`, completedDaysAgo: 4 },
          { title: "Bayi kampanya SMS metnini onayla", completedDaysAgo: 1 },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Kota ve Gerçekleşme.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${YUVAM} — Ankastre Set Teklifi v3.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${EVIM} Çerçeve Anlaşma Taslağı.docx`, folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Sell-in ve Sell-out Raporu — Kasım.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 2 },
    { name: "Bayi Yıl Sonu Prim Simülasyonu.xlsx", folder: "Bayiler", by: "Onur Polat", daysAgo: 3 },
    { name: "Depo Stok ve Devir Hızı — Haftalık.csv", folder: "Stok ve Lojistik", by: "Mert Aksoy", daysAgo: 3 },
    { name: "Kasım İndirim Günleri Fiyat Listesi.xlsx", folder: "Kampanyalar", by: "Emre Şahin", daysAgo: 4 },
    { name: "Kasım Kampanya Broşürü.pdf", folder: "Kampanyalar", by: "Emre Şahin", daysAgo: 5 },
    { name: "Bölge Bayi Ziyaret Planı.xlsx", folder: "Bayiler", by: "Kaan Özdemir", daysAgo: 5 },
    { name: "NovaCool 640 Ürün Kataloğu.pdf", folder: "Teklifler", by: "Deniz Arslan", daysAgo: 6 },
    { name: "Ekip Performans Özeti.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 7 },
    { name: "Servis ve Garanti Şartları.docx", folder: "Sözleşmeler", by: "Gizem Tunç", daysAgo: 8 },
    { name: "Bayi Yönetimi Eğitim Sunumu.pptx", folder: "Satış", by: "Ayşe Demir", daysAgo: 9 },
    { name: "Kategori Bazlı Satış Raporu — Q4.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 1 },
    { name: "Vadesi Geçmiş Bakiye ve Kredi Limitleri.xlsx", folder: "Finans ve Tahsilat", by: "Can Yıldız", daysAgo: 2 },
    { name: `${DORUK} Kampanya Sözleşmesi.docx`, folder: "Sözleşmeler", by: "Ömer Gümüş", daysAgo: 2 },
    { name: "Kampanya Stok Rezervasyon Planı.xlsx", folder: "Stok ve Lojistik", by: "Mert Aksoy", daysAgo: 2 },
    { name: `${KARA} — Stok Planı.xlsx`, folder: "Bayiler", by: "Onur Polat", daysAgo: 3 },
    { name: "E-ticaret Kanal Fiyat ve Stok Senkronizasyonu.xlsx", folder: "Kampanyalar", by: "Derya Çelik", daysAgo: 3 },
    { name: `${PUSULA} Raf Planı Teklifi.pptx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 3 },
    { name: `${MAVI} — Klima ve Minibar Teklifi.docx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 4 },
    { name: "Servis SLA ve Garanti Talepleri — Ekim.xlsx", folder: "Servis ve Garanti", by: "Gizem Tunç", daysAgo: 4 },
    { name: "Yedek Parça Stok ve Bekleme Süreleri.csv", folder: "Servis ve Garanti", by: "Mert Aksoy", daysAgo: 5 },
    { name: "NovaCool 640 Plus Teknik Özellik Tablosu.pdf", folder: "Teklifler", by: "Deniz Arslan", daysAgo: 5 },
    { name: `${SEDIR} Örnek Daire Ürün Seçimi.pdf`, folder: "Teklifler", by: "Deniz Arslan", daysAgo: 6 },
    { name: "Rakip Fiyat Endeksi — Kasım 2. Hafta.xlsx", folder: "Raporlar", by: "Deniz Arslan", daysAgo: 6 },
    { name: "2027 Bayi Modeli Çalıştay Sunumu.pptx", folder: "Satış", by: "Selin Aydın", daysAgo: 7 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${YUVAM} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma müdürü ve proje teknik koordinatörü.", "İstekler: ankastre set birim fiyatında 800 ₺ indirim, garantiyi 3 yıla çıkarma, dört parti teslimat.", "Risk: rakip teklifi daha düşük fiyatlı ama servis ağı zayıf; bunu sunumda öne çıkaracağız.", "Sonraki adım: güncellenmiş teklif ve örnek daire teslim tutanağı."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Kasım indirim günleri için bayi sipariş son tarihi 13 Kasım olarak netleşti.", "Anadolu Ev Aletleri'nde stok eritme planı Onur'da; yeni sell-in stok devri 45 günün altına inmeden açılmayacak.", "Broşür ve raf etiketi onayı hafta sonuna kadar tamamlanacak."] },
    { title: `${EGE} kota görüşmesi hazırlığı`, notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: Q3 sell-out performansı ve yeni NovaCool 640 Plus modelleri.", "Esneklik alanı: prim kademesinin kota gerçekleşmesi %95'te başlaması, alt bayilere ek kampanya vadesi.", "Sınır: ek iskonto %6'yı geçmez; %8 üzeri Selin'in onayı olmadan verilmez."] },
    { title: "Kasım indirim günleri hazırlık listesi", notebook: "Satış", section: "Kampanya", daysAgo: 2, body: ["Fiyat listesi ve bayi iskonto tablosu yayında; broşür ve raf etiketi baskıya gidecek.", "Sipariş son tarihi 13 Kasım, teslimat son tarihi 19 Kasım. NovaCool 640 Plus ilk parti 14 Kasım.", "Depo vardiyası 20–30 Kasım arası 06:00–22:00; acil sevkiyat talepleri 16:00'ya kadar.", "Kampanya sonrası sell-out analizi için tyroInsight raporu Aralık başında hazırlanacak."] },
    { title: `${PUSULA} tanışma notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: kategori müdürü Cem Altınbaş ve satın alma direktörü. 86 mağazanın 24'ü büyük format; raf planı Ocak'ta yenileniyor.", "İlgi alanı: NovaCool 640 Plus (enerji sınıfı farkı) ve TermoDry H10. Beklenti: iade ve teşhir ürünü koşullarının yazılı olması, büyük format mağazalarda demo cihaz desteği.", "Risk: zincir ilk yıl düşük iskontoyla başlamak istiyor; bir rakip marka %3 fazla destek veriyor. Önerim sabit iskonto yerine adet bazlı prim kademesi.", "Sonraki adım: raf planı görüşmesi öncesi liste fiyatı ve iade koşulları teklifi."] },
    { title: "Tahsilat ve kredi limiti toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 4, body: [`Açık cari bakiye ${KPI.openReceivable} M₺; vadesi geçmiş ${KPI.overdue} M₺ (Anadolu 1,6; Trakya 0,7; Karadeniz 0,5; Ege Ev 0,3).`, "Karar: vadesi geçmiş bakiyesi olan bayilerin yeni kampanya siparişi ödeme planı netleşmeden sevk edilmeyecek. Anadolu'nun kota düşürme talebi stok eritme planıyla birlikte ele alınacak.", "Evim çerçeve anlaşması için kredi limiti artışı (14 M₺ → 24 M₺) Finans'a iletilecek; Kervan limiti yeterli (30 M₺, kullanım %16)."] },
    { title: `${SEDIR} örnek daire notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 7, body: ["Örnek dairede ChefLine H70 ocak ve davlumbaz seti kuruldu; yönetim kurulundan iki üye ve teknik danışman katıldı.", "Notlar: davlumbaz çıkış borusu mutfak penceresine gereğinden yakın, montaj ekibi boru yönünü değiştirecek. Ocak elektrik bağlantı noktası standart.", "Beklenti: 420 daire üç partide, ilk parti Şubat başında; 2 yıl standart garanti ve ek 1 yıl seçeneği."] },
    { title: "Servis ve garanti toplantısı — aksiyonlar", notebook: "Satış", section: "Servis ve Garanti", daysAgo: 4, body: [`Ekim'de SLA içinde kapanış %${KPI.sla}, bayi kaynaklı iade oranı %${KPI.returnRate}. Tekrarlayan arızalar: SilentWash D14 drenaj pompası, AquaPure W9 kapak kilidi.`, "Aksiyon: kampanya öncesi kritik parçalarda üç haftalık ek stok (Mert). Yuvam için 3 yıl garanti maliyet çalışması (Gizem).", "Yetkili servis çağrı merkezi mesaisi Kasım indirim günlerinde 22:00'ye uzatılacak; duyuru Keşfet'te yayında."] },
    { title: "E-ticaret kanalı kampanya kuralları", notebook: "Satış", section: "Kampanya", daysAgo: 3, body: ["Kampanya fiyatları pazaryeri sayfalarına her sabah 06:00'da akacak; minimum satış fiyatı kuralı Dorukhan sözleşmesinde yer alıyor.", `Kanalın sell-in'i ${KPI.ecomSellIn} M₺ ve Q4 cirosunun %${KPI.ecomPct}'si. İade oranı bayi kanalından yüksek (%2,8), ana neden nakliye hasarı.`, "Takip: üçüncü taraf satıcı fiyat ihlalleri listesi her sabah Derya'ya düşecek; haftalık e-ticaret kontrolünde gözden geçirilecek."] },
    { title: "Otel projeleri karşılaştırması: Lacivert Koy ve Mavi Liman", notebook: "Satış", section: "Planlama", daysAgo: 5, body: ["Lacivert Koy: 6 otel, 640 oda, 9,6 M₺. Mavi Liman: 3 otel, 310 oda, tahmini 4,0 M₺. İkisi de sezon dışında montaj istiyor.", "Ortak ihtiyaç: inverter klima, minibar tipi buzdolabı ve montaj sonrası ilk bakım ziyareti. Lacivert'te ayrıca çamaşırhane ekipmanı var.", "Yaklaşım: ürün listesini oda tipine göre sadeleştirip iki projede aynı garanti paketini sunmak; kış kapanışı takvimi teklife yazılı eklenecek."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Bayi ziyaretleri ve kampanya haftası programın için de hazırım.",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Kota ve sell-out durumun, bayi ve proje fırsatların, stok ile kampanya fiyatları hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Haftalık satış özeti hazırla", "Bayi performansını göster", "Stok durumu nasıl?"],
    },
    answers: [
      // Özel kalıplar genel olanlardan önce gelir: ilk eşleşen cevap kazanır.
      {
        match: "kampanya sto|kampanya için stok|ayrılan stok|rezerv|yeter mi|yetecek mi",
        steps: ["Kampanya talep tahmini okunuyor…", "Stok ve gelen partiler karşılaştırılıyor…"],
        text: `**Kasım indirim günleri stok yeterliliği (20–30 Kasım)**\n\n| Model | Talep tahmini | Stok + gelen parti | Durum |\n|---|---|---|---|\n| NovaCool 640 / Plus | 3.400 | 2.150 + 1.600 | Sınırda (fark %10) |\n| AquaPure W9 | 2.100 | 3.480 | Yeterli |\n| SilentWash D14 | 1.350 | 2.960 | Fazla stok |\n| ChefLine F60 | 980 | 1.720 | Yeterli |\n| TermoDry H10 | 560 | 980 | Yeterli |\n| AirBreeze S18 | 420 | 4.900 | Mevsim dışı, eritilemez |\n\nTalep tahmini *tyroForecast* ile geçmiş kampanya verisinden çıkarıldı. Evim (1.150), Kervan (840) ve Ege Ev (760) siparişleri için **2.750 adet** stok rezerve edildi; kalan serbest stok bayi ön siparişlerine göre dağıtılacak.\n\nEn büyük risk NovaCool 640'ın ilk günleri: Plus partisi 14 Kasım'da fabrikadan çıksa da depoya kabul ve etiketleme sevkiyatı bir iki gün geciktirebilir. Toplam stok ${KPI.stok} adet, depo doluluğu %${KPI.doluluk}.`,
        chips: ["Kasım kampanyası nasıl işliyor?", "Stok durumu nasıl?"],
      },
      {
        match: "tahsilat|vade|kredi limit|açık hesap|teminat|cari bakiye",
        steps: ["Cari bakiye ve vade kayıtları okunuyor…", "Kredi limiti kullanımı hesaplanıyor…"],
        text: `**Tahsilat ve vade durumu**\n\nAçık cari bakiye **${KPI.openReceivable} M₺**; bunun **${KPI.overdue} M₺**'si vadesi geçmiş (%11).\n\n| Bayi | Açık bakiye | Vadesi geçmiş | Limit kullanımı |\n|---|---|---|---|\n| Evim Elektronik Mağazaları | 7,4 M₺ | – | %53 |\n| Ege Ev Bayileri A.Ş. | 5,2 M₺ | 0,3 M₺ | %69 |\n| Kervan Pazaryeri A.Ş. | 4,8 M₺ | – | %16 |\n| Anadolu Ev Aletleri Dağıtım | 4,3 M₺ | 1,6 M₺ | %86 |\n| Karadeniz Beyaz Eşya Pazarlama | 2,1 M₺ | 0,5 M₺ | %70 |\n| Trakya Ev Gereçleri Bayilik | 1,6 M₺ | 0,7 M₺ | %80 |\n\nDorukhan Dijital'de 1,0 M₺, diğer küçük bayilerde 1,2 M₺ açık bakiye var; ikisi de vadesi içinde.\n\nStandart vade 60 gün, kampanya vadesi 90 güne kadar (Finans onayı: Can Yıldız). Vadesi geçmiş bakiyesi olan bayilerin yeni kampanya siparişi ödeme planı netleşmeden sevk edilmeyecek. Evim'in çerçeve anlaşması için limit artışı (14 → 24 M₺) Finans onayında; Kervan'ın 90 gün vade talebi limit açısından uygun.`,
        chips: ["Bayi performansını göster", "Kasım kampanyası nasıl işliyor?"],
      },
      {
        match: "rakip|pazar payı|fiyat endeksi|rekabet",
        steps: ["Rakip fiyat taraması okunuyor…", "Fiyat endeksi hesaplanıyor…"],
        text: "**Rakip fiyat ve pazar konumu (tyroInsight)**\n\n| Model | TYRO fiyat endeksi* | Rakip kampanya indirimi | Yorum |\n|---|---|---|---|\n| NovaCool 640 | 103 | %11 | Enerji sınıfı ve 10 yıl kompresör garantisi farkı koruyor |\n| AquaPure W9 | 98 | %9 | Rekabetçi |\n| SilentWash D14 | 104 | %10 | Pahalı konumda, servis ağı öne çıkarılmalı |\n| ChefLine F60 | 97 | %7 | Proje tekliflerinde avantajlı |\n| AirBreeze S18 | 95 | %6 | Mevsim dışı, fiyat avantajı talebi artırmıyor |\n\n*Segment ortalaması = 100. Rakip markalar Kasım indirim günlerinde en sert fiyat kırmayı buzdolabı ve bulaşık makinesinde yapıyor.\n\nSilentWash D14 için ek iskonto yerine garanti ve servis farkıyla konumlanmayı, Anadolu Ev Aletleri'ndeki stok eritme planıyla birlikte ele almayı öneriyorum.",
        chips: ["Kasım kampanyası nasıl işliyor?", "Kategori bazında satışlar nasıl?"],
      },
      {
        match: "stok|depo|devir hızı|sevkiyat|teslimat|lojistik",
        steps: ["Depo stok verileri okunuyor…"],
        text: "**Stok ve sevkiyat durumu (Gebze dağıtım merkezi)**\n\n| Model | Grup | Stok | Yeterlilik |\n|---|---|---|---|\n| NovaCool 640 | Buzdolabı | 2.150 | 11 gün (kritik) |\n| AquaPure W9 | Çamaşır makinesi | 3.480 | 19 gün |\n| SilentWash D14 | Bulaşık makinesi | 2.960 | 52 gün (fazla) |\n| ChefLine F60 | Ankastre fırın | 1.720 | 33 gün |\n| AirBreeze S18 | Klima | 4.900 | 118 gün (mevsim dışı) |\n\nToplam stok **18.400 adet**; ortalama stok devir hızı **41 gün** (hedef 38 gün), depo doluluğu **%91**.\n\nNovaCool 640 Plus ilk partisi 14 Kasım'da geliyor; o zamana kadar Kervan, Evim ve Ege Ev siparişleri öncelik kuyruğunda.",
        chips: ["Bayi performansını göster", "Kasım kampanyası nasıl işliyor?"],
      },
      {
        match: "novacool|plus model|enerji etiketi|enerji sınıfı|yeni seri",
        steps: ["Ürün ve ön sipariş kayıtları okunuyor…"],
        text: `**NovaCool 640 Plus lansmanı**\n\n- İlk parti **1.600 adet**, 14 Kasım'da fabrikadan çıkıyor; bayi ön siparişi **${KPI.plusPreorder} adet** (Evim 420, Kervan 380, Ege Ev 300, Dorukhan Dijital 180, Trakya Ev Gereçleri 100).\n- Eski seriye göre **%32 daha az enerji** tüketiyor; 10 yıl kompresör garantisi var.\n- Liste fiyatı eski seriden %6 yüksek; kampanya fiyatında fark %3'e iniyor.\n- Marmara Teknoloji (Ocak raf planı) ve Pusula Perakende için yazılı teklifler bekleniyor.\n\nKalan 220 adet kampanya başlangıcında gelecek taleplere ayrıldı. Plus'ın enerji tasarrufunu müşteriye yıllık ₺ olarak anlatmak için Akademi'deki enerji etiketi modülünü kullanabilirsin.`,
        chips: ["Stok durumu nasıl?", "Kasım kampanyası nasıl işliyor?"],
      },
      {
        match: "e-?ticaret|pazaryeri|online|dijital kanal|kervan|dorukhan",
        steps: ["Pazaryeri verileri okunuyor…", "Fiyat uyumu kontrol ediliyor…"],
        text: `**E-ticaret ve pazaryeri kanalı**\n\n| Kanal | Sell-in | Sell-out | Sell-out oranı | Stok devri |\n|---|---|---|---|---|\n| Kervan Pazaryeri A.Ş. | 9,7 M₺ | 9,5 M₺ | %98 | 21 gün |\n| Dorukhan Dijital Pazar A.Ş. | 6,8 M₺ | 6,3 M₺ | %93 | 24 gün |\n\nKanalın toplam sell-in'i **${KPI.ecomSellIn} M₺**; Q4 cirosunun **%${KPI.ecomPct}**'si.\n\n- Kampanya fiyatları pazaryeri sayfalarına her sabah 06:00'da akıyor; minimum satış fiyatı kuralı Dorukhan sözleşmesinde yer alıyor.\n- Üçüncü taraf satıcılar SilentWash D14 ve ChefLine F60'ı kampanya fiyatının altına çekmiş; Emir Tuncer satıcı listesini paylaştı.\n- E-ticaret iade oranı %2,8 (bayi kanalında %${KPI.returnRate}); en büyük neden nakliye hasarı.\n- Kervan'ın %9 ek iskonto talebi Selin Aydın onayında bekliyor.\n\nPazaryeri fiyat ve stok uyumu e-ticaret kanalı haftalık kontrol toplantısında izleniyor.`,
        chips: ["Kasım kampanyası nasıl işliyor?", "Tahsilat ve vade durumu nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat|indirim",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kasım indirim günleri (20–30 Kasım)**\n\n- Standart bayi iskontosu **%14**; kampanya dönemi ek iskonto: buzdolabı, çamaşır ve bulaşık makinesinde **%6**, fırın/ocak/ankastrede **%4**, klimada **%3**.\n- Kampanya vadesi 90 güne kadar (Finans onayı: Can Yıldız).\n- %8 ve üzeri ek iskonto talepleri Selin Aydın'ın onayında; bekleyen talep: Kervan Pazaryeri (%9).\n- Bayi sell-in siparişleri **13 Kasım'a** kadar, teslimatlar 19 Kasım'a kadar.\n\nMarj etkisini görmek için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle", "Stok durumu nasıl?"],
      },
      {
        match: "alt bayi|bölge bazlı|bölge bazında|bölgesel|karadeniz|trakya|pusula|zincir mağaza",
        steps: ["Bölge ve yeni sezon bayi verileri okunuyor…"],
        text: "**Bölge ve yeni sezon bayi performansı (Q4 şu ana kadar)**\n\n| Bayi | Sell-in | Sell-out | Sell-out oranı | Stok devri |\n|---|---|---|---|---|\n| Karadeniz Beyaz Eşya Pazarlama A.Ş. | 6,1 M₺ | 5,4 M₺ | %89 | 39 gün |\n| Trakya Ev Gereçleri Bayilik | 4,3 M₺ | 3,6 M₺ | %84 | 46 gün |\n\n- Karadeniz'de dokuz mağazada buzdolabı satışı güçlü; dar daire projeleri nedeniyle AquaPure W7 Slim talebi artıyor. Vadesi geçmiş 0,5 M₺ bakiye için ödeme takvimi görüşülecek (Onur Polat).\n- Trakya'da bulaşık makinesi stoğu yavaş dönüyor; 0,7 M₺ vadesi geçmiş bakiye var, Edirne–Çorlu–Tekirdağ ziyareti planlı.\n- Ege Ev'in Manisa alt bayilerinde çamaşır makinesi stoğu 40 günü aşıyor; Bornova şubesinde sayım farkı çıktı (Kaan Özdemir).\n- Pusula Perakende Zinciri (86 mağaza) henüz sell-in yapmadı; Ocak raf planı görüşmesi öncesi teklif hazırlanıyor.",
        chips: ["Bayi performansını göster", "Tahsilat ve vade durumu nedir?"],
      },
      {
        match: "model bazında|model bazlı|kategori|ürün grubu|en çok satan|hangi model",
        steps: ["Satış kayıtları kategoriye göre gruplanıyor…"],
        text: `**Kategori bazında Q4 satışları**\n\n| Kategori | Ciro | Adet | Ciro payı |\n|---|---|---|---|\n| Buzdolabı | 30,6 M₺ | 1.340 | %38 |\n| Çamaşır makinesi | 15,8 M₺ | 910 | %19 |\n| Fırın, ocak ve ankastre | 11,6 M₺ | 466 | %14 |\n| Bulaşık makinesi | 10,2 M₺ | 548 | %13 |\n| Kurutma makinesi | 7,0 M₺ | 228 | %9 |\n| Klima | 6,0 M₺ | 220 | %7 |\n\nToplam **${KPI.achieved} M₺ / ${KPI.achievedAdet} adet**. En hızlı büyüyen kategori ısı pompalı kurutma makinesi; en yavaş kategori mevsim gereği klima (stoğu 118 günlük).\n\nModel bazında öne çıkanlar: NovaCool 640 (buzdolabı cirosunun %58'i), AquaPure W9 (çamaşır makinesi cirosunun %64'ü) ve ChefLine F60. Kampanyada en büyük artışı buzdolabı ve çamaşır makinesinde bekliyoruz.`,
        chips: ["Kampanya stoğu yeter mi?", "Bayi performansını göster"],
      },
      {
        match: "bayi|sell-?out|sell out|sell-?in",
        steps: ["Bayi ve kanal verileri okunuyor…", "Sell-out oranları hesaplanıyor…"],
        text: "**Bayi ve kanal performansı (Q4 şu ana kadar)**\n\n| Bayi / kanal | Sell-in | Sell-out | Sell-out oranı | Stok devri |\n|---|---|---|---|---|\n| Kervan Pazaryeri A.Ş. | 9,7 M₺ | 9,5 M₺ | %98 | 21 gün |\n| Ege Ev Bayileri A.Ş. | 11,4 M₺ | 10,8 M₺ | %95 | 36 gün |\n| Evim Elektronik Mağazaları | 14,2 M₺ | 13,1 M₺ | %92 | 33 gün |\n| Anadolu Ev Aletleri Dağıtım | 8,1 M₺ | 6,2 M₺ | %77 | 52 gün |\n\nAnadolu Ev Aletleri'nde stok birikiyor; yeni sell-in öncesi stok eritme planı gerekli (Onur Polat'la görüşülecek).\n\nYıl sonu bayi primi: kota gerçekleşmesi %100'de **%2,5**, %115'te **%3,5**. Ege Ev kademenin %95'te başlamasını istiyor.",
        chips: ["Stok durumu nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "yedek parça|garanti uzat|3 yıl garanti|ilk müdahale|arıza oranı|\\bsla\\b",
        steps: ["Servis talepleri okunuyor…", "Yedek parça bekleme süreleri hesaplanıyor…"],
        text: `**Yedek parça ve garanti uzatma**\n\n- Ekim'de **1.420** servis talebi açıldı; SLA içinde kapanış **%${KPI.sla}**, bayi kaynaklı iade oranı **%${KPI.returnRate}**.\n- Yedek parça bekleme süresi ortalama **3,2 gün**; en uzun bekleyen kalem SilentWash D14 drenaj pompası (6,5 gün).\n- En sık tekrarlayan arızalar: SilentWash D14'te drenaj pompası, AquaPure W9'da kapak kilidi.\n- Yuvam Konut'un istediği 3 yıl garanti için ünite başı tahmini maliyet **310 ₺**; 1.200 set için yaklaşık **0,37 M₺**. Mert Aksoy onayı bekleniyor.\n- Kampanya öncesi kritik parçalarda üç haftalık ek stok ayrıldı.\n\nTekrarlayan arıza nedenleri aylık servis ve garanti kalite toplantısında *tyroService* verisiyle birlikte incelenecek.`,
        chips: ["Servis ve garanti şartları neler?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "otel|lacivert|mavi liman|minibar|çamaşırhane|oda sayısı",
        steps: ["Otel projesi kayıtları okunuyor…"],
        text: "**Otel projeleri**\n\n| Proje | Kapsam | Tutar | Durum |\n|---|---|---|---|\n| Lacivert Koy Otelleri | 6 otel, 640 oda | 9,6 M₺ | Keşif görüşmesi planlı |\n| Mavi Liman Otelcilik | 3 otel, 310 oda | 4,0 M₺ (tahmini) | Teklif talebi geldi, pipeline'a alınmadı |\n\n**Lacivert Koy** kalemleri: 640 oda için inverter klima (6,9 M₺), 640 minibar tipi buzdolabı (1,6 M₺), çamaşırhane için 12 çamaşır ve 6 kurutma makinesi (1,1 M₺). Montaj sezon kapanışına denk gelen Ocak'ta planlanıyor.\n\n**Mavi Liman**: 310 oda için klima (3,2 M₺) ve minibar (0,8 M₺); montaj Aralık sonu ile Şubat başı arasına yayılacak. Teklif sunumu planlı; garanti ve montaj sonrası ilk bakım ziyareti teklife eklenecek.",
        chips: ["Servis ve garanti şartları neler?", "Aksu ve Sedir konut projeleri nasıl?"],
      },
      {
        match: "aksu|sedir|toplu konut|kooperatif|dar niş",
        steps: ["Konut projesi kayıtları okunuyor…"],
        text: "**Konut projeleri: Aksu ve Sedir**\n\n| Proje | Kapsam | Tutar | Durum |\n|---|---|---|---|\n| Aksu Toplu Konut Geliştirme | 680 daire, çamaşır ve bulaşık makinesi | 7,9 M₺ | Saha keşfi tamamlandı |\n| Sedir Yapı Kooperatifi | 420 daire, ChefLine H70 ocak ve davlumbaz seti | 3,9 M₺ (tahmini) | Örnek daire onaylandı, sözleşme hazırlığı |\n\n- Aksu'da 680 dairenin 240'ında çamaşır makinesi nişi dar; çözüm olarak 8 kg'lık AquaPure W7 Slim öneriliyor. Teslimat partileri kat sırasına göre planlanacak (Pınar Ersoy).\n- Sedir'de ilk parti 140 daire için Şubat başında gerekli; üç partide teslim, 2 yıl standart garanti ve ek 1 yıl seçeneği isteniyor (Aylin Korkmaz).\n- Davlumbaz çıkış borusunun yönü örnek dairede değiştirilecek; montaj ekipleri kat bazında planlanıyor.",
        chips: ["Servis ve garanti şartları neler?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "proje|konut|otel|ankastre|yuvam|lacivert|aksu",
        steps: ["Proje fırsatları okunuyor…"],
        text: `**Proje satışları**\n\n| Proje | Kapsam | Tutar | Durum |\n|---|---|---|---|\n| ${YUVAM} | 1.200 daire ankastre set | 21,8 M₺ | Bugün 14:00 son sunum |\n| ${LACI} | 6 otel, 640 oda: klima, buzdolabı, çamaşırhane | 9,6 M₺ | Keşif görüşmesi planlı |\n| ${AKSU} | 680 daire, çamaşır ve bulaşık makinesi | 7,9 M₺ | Saha keşfi tamamlandı, montaj soruları var |\n\nProje fırsatları toplam 39,3 M₺ ile pipeline'ın yaklaşık %27'si. Yuvam'da 3 yıl garanti ve 800 ₺ birim fiyat indirimi talebi açık.`,
        chips: ["Servis ve garanti şartları neler?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "servis|garanti|arıza|iade",
        steps: ["Servis ve garanti kayıtları okunuyor…"],
        text: "**Servis ve garanti**\n\n- Standart garanti 2 yıl; kompresör ve motorda 10 yıl.\n- Yetkili servis ilk müdahale süresi: 48 saat; son 30 günde SLA içinde kapanış %94.\n- Bayi kaynaklı iade oranı %1,4 (hedef %1,5).\n- Açık talepler: Yuvam Konut için 3 yıl garanti uzatması (Mert Aksoy onayı bekliyor), Marmara Teknoloji için iade koşulları.",
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nCiro: **${KPI.achieved} M₺** / hedef ${KPI.quota} M₺ (**%${KPI.achievedPct}**)\nAdet: **${KPI.achievedAdet}** / ${KPI.quotaAdet} (%${KPI.achievedPct})\n\n- Kalan fark: ${KPI.gap} M₺ (${KPI.gapAdet} adet)\n- Açık pipeline: ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat), olasılık ağırlıklı yaklaşık ${KPI.weighted} M₺\n- Kazanma oranı: %${KPI.winRate}\n- Son 30 günde kapanan: ${KPI.closed30} M₺\n\nFarkı kapatmanın ana kaynağı Kasım indirim günleri sell-in siparişleri; en kritik üç fırsat Evim Elektronik (24,6 M₺), Yuvam Konut (21,8 M₺) ve Kervan Pazaryeri (18,4 M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Kapsam | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${EVIM} | Kampanya dönemi çerçeve anlaşma (1.150 adet) | 24,6 M₺ | Teklif | %55 |\n| ${YUVAM} | 1.200 daire ankastre set | 21,8 M₺ | Teklif | %60 |\n| ${KERVAN} | Kampanya sell-in paketi (840 adet) | 18,4 M₺ | Müzakere | %70 |\n| ${EGE} | Yıl sonu bayi kotası (760 adet) | 16,2 M₺ | Müzakere | %65 |\n| ${MTP} | NovaCool 640 serisi listeleme | 14,7 M₺ | Değerlendirme | %40 |\n| ${ANAD} | Q4 kota revizyonu (520 adet) | 11,3 M₺ | Teklif | %60 |\n\nİlk altı fırsat 107,0 M₺; Lacivert Koy ve Aksu dahil diğer 13 fırsat 41,0 M₺. Toplam açık pipeline **${KPI.pipeline} M₺**.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:10 Sabah stok ve sevkiyat turu\n- 14:00 ${YUVAM} — ankastre set teklif sunumu\n\nBu hafta ayrıca Evim Elektronik çerçeve anlaşma müzakeresi, Kasım kampanya planlaması, Kervan sell-in toplantısı ve Q4 hedef ve stok değerlendirmesi var. Yanıt bekleyen bir davetin var: 2027 bayi modeli çalıştayı.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Son 30 günde ${KPI.closed30} M₺ kapanış, kazanma oranı %${KPI.winRate}; Q4 hedefin %${KPI.achievedPct}'i tamamlandı.\n- Bugün Yuvam Konut ankastre set sunumu (14:00); bu hafta Evim çerçeve anlaşma müzakeresi ve Kervan sell-in toplantısı.\n- Kritik: NovaCool 640 stoğu 11 günlük; Anadolu Ev Aletleri'nde stok devri 52 gün.\n- Bekleyen karar: Kervan'ın %9 ek iskonto talebi (Selin Aydın onayı) ve Yuvam'ın 3 yıl garanti talebi.\n- Riskli fırsatlar: Marmara Teknoloji (liste fiyatı ve iade koşulu), Anadolu Ev Aletleri (kota düşürme talebi).`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Q4 hedefi | Gerçekleşen | İlerleme |\n|---|---|---|---|\n| Zeynep Acar | 42,0 M₺ | 26,9 M₺ | %64 |\n| Onur Polat | 34,0 M₺ | 20,4 M₺ | %60 |\n| Kaan Özdemir | 28,0 M₺ | 16,0 M₺ | %57 |\n| Gizem Tunç | 24,0 M₺ | 12,0 M₺ | %50 |\n| Derya Çelik | 12,0 M₺ | 5,9 M₺ | %49 |\n\nZeynep proje fırsatlarıyla öne çıkıyor; Gizem ve Derya'nın pipeline'ında Kasım siparişlerine bağlı iki büyük fırsat var.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 22 gün, kullandığın 9 gün; **kalan 13 gün**. 2 gün onaylı izin planın var.\n\nHatırlatma: 20–30 Kasım arasında satış ekiplerinde izin kullanılamıyor; yeni talepleri bu tarihler dışında girmelisin. 2027 izin planı için son tarih 30 Kasım.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori (yol, konaklama, yemek), tutar ve fişi ekle; fiş okuyucu tutarı kendisi çıkarır\n3. Gönder; yöneticin onaylar.\n\nBayi ziyaretlerinde yol ve konaklama masraflarını ziyaret tarihiyle birlikte girmen yeterli. Şu an onay bekleyen bir masraf raporun var (HRMS-063871).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **3 onayın** var: Kervan Pazaryeri %9 ek iskonto talebi (Selin Aydın'a iletilecek), Yuvam Konut 3 yıl garanti uzatması ve Onur Polat'ın bayi yönetimi eğitim talebi.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Kota ve hedefin, bayi ve proje fırsatların, stok durumu, kampanya fiyatları, takvimin ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

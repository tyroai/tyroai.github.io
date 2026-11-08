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
}

const EY = "Ege Yetkili Servis Grubu"
const AP = "Anka Parça Toptan A.Ş."
const BF = "Boğaz Filo Kiralama"
const TL = "Trakya Lojistik Filosu"
const KY = "Kuzey Yan Sanayi A.Ş."
const SD = "Sepetpark Dijital Ticaret"
const HO = "Hazar Oto Dağıtım"
const TS = "Toros Servis Zinciri"

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
    { name: "Servis Ağı Portalı", type: "business", description: "Yetkili servis siparişleri ve stok görünümü", url: "#", icon: "Package01Icon" },
    { name: "Sevkiyat Takip", type: "business", description: "Depo çıkışları ve teslimat durumu", url: "#", icon: "CargoShipIcon" },
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
    { title: "Bölge servis ziyareti — İzmir", day: 8, allDay: true, where: "İzmir", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "İzmir, Manisa ve Aydın'daki yetkili servis ziyaretleri." },
    { title: "Yedek Parça Tedarik Zirvesi", day: 10, allDay: true, span: 2, where: "İstanbul", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Emre Şahin", "Mert Aksoy"], body: "İki günlük sektör buluşması: tedarikçi görüşmeleri ve stant ziyaretleri." },
    // geçmiş
    { title: `${BF} — filo envanter çalışması`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Barış Tekin (${BF})`, "Zeynep Acar"], body: "2.400 aracın marka–model dağılımı ve bakım periyotlarının netleştirilmesi." },
    { title: `${TL} — bakım planı toplantısı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nalan Erdem (${TL})`, "Deniz Arslan"], body: "620 araçlık filo için periyodik bakım ve kış lastiği değişim takvimi." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "İade (RMA) süreçleri, müşteri şikâyetleri ve gelişim planı." },
    { title: `${TS} — akü kampanyası başlangıcı`, day: -4, time: "10:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Melis Gündoğdu (${TS})`, "Onur Polat"], body: "86 servis noktası için akü kampanyasının sipariş ve teslimat akışı." },
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
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Boğaz Filo müzakere stratejisini konuş", due: 1 },
          { title: "Onur için kanal eğitim planı hazırla", due: 8 },
          { title: "Gizem'in garanti ve iade süreci sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan ile İzmir ziyaretleri öncesi hazırlık yap", due: 7 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Aracın kış lastiklerini taktır", due: 2, importance: "low" },
          { title: "Spor salonu üyeliğini yenile", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
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
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${BF} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: filo operasyon müdürü ve finans direktörü. Teknik değerlendirmeyi servis planlama ekibi yürütüyor.", "İstekler: araç başına aylık bakım bedelinin 36 ay sabitlenmesi, fiyat güncellemesinin yılda iki kez yapılması, 2.400 araç için 48 saat içinde parça teslimi taahhüdü.", "Sonraki adım: güncellenmiş sözleşme taslağı ve Can Yıldız ile birlikte fiyat güncelleme formülü."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Riskli üç fırsat için aksiyon sahipleri belirlendi: Kuzey Yan Sanayi (numune), Hazar Oto Dağıtım (ihracat belgeleri), Sepetpark (komisyon oranı).", "Kış kampanyası broşürü bu hafta onaylanacak; bayi iskonto matrisi Derya'da.", "Kış lastiği teslim gecikmesi için Mert ile ek sipariş planı çıkarılacak."] },
    { title: "Kış sezonu stok planı", notebook: "Satış", section: "Planlama", daysAgo: 5, body: [`Hedef servis seviyesi %${KPI.serviceTarget}; mevcut %${KPI.serviceLevel}. Açık nokta: 205/55 R16 ve 195/65 R15 kış lastikleri ile 70 Ah akü.`, "Önlem: alternatif tedarikçiden 4.000 adetlik ek parti; sezon sonu iade penceresi 30 gün.", "Kritik tarih: 20 Kasım — ilk soğuk hava dalgası öncesi servis zincirlerine stok taahhüdü teyidi."] },
    { title: "Müzakere hazırlığı — filo sözleşmesi", notebook: "Satış", section: "Toplantı Notları", daysAgo: 6, body: ["Açılış: toplam sahip olma maliyeti ve 2.400 araçta öngörülebilir bakım bütçesi.", "Esneklik alanları: ödeme vadesi (45 günden 60 güne), fiyat güncelleme periyodu.", "Sınır: bayi iskontosu dahil toplam marj %9'un altına inmez; parça teslim SLA'sı 48 saatten uzun olamaz."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, parça ve filo fırsatların, stok durumu ve servis ağın hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Stok durumu nasıl?", "Filo sözleşmeleri ne durumda?", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?"],
    },
    answers: [
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

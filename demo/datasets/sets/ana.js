// ANA veri seti — karma, genel B2B satış çalışma alanı. TYRO Tech'in kurumsal yazılım ve yapay zekâ
// çözümlerini farklı sektörlerdeki müşterilere sattığı bir satış yöneticisi haftası.
// Tüm kişi, firma ve rakamlar KURGUSALDIR. Sektör setleri bu dosyayı şablon alır.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: "18,0", // Q4 hedefi (milyon TL)
  achieved: "11,7", // gerçekleşen
  achievedPct: 65,
  pipeline: "34,2", // açık pipeline (milyon TL)
  openDeals: 23,
  winRate: 31,
  closedThisMonth: "4,6",
  gap: "6,3", // hedefe kalan (milyon TL)
  commit: "4,2", // çeyrek sonu senaryoları: ek kapanış (milyon TL)
  likely: "5,6",
  best: "6,9",
  forecast: "17,3", // en olası senaryoda çeyrek sonu toplamı
  forecastPct: 96,
  atRisk: "6,5", // riskli üç fırsat: Ege Tekstil, Karadeniz Enerji, Toroslu Yapı
  atRiskPct: 19,
  renewals: "5,2", // 90 gün içinde yenilenen sözleşmelerin yıllık değeri (milyon TL)
  renewalCount: 7,
  overdue: "2,3", // vadesi geçen alacak (milyon TL)
  overdueCount: 4,
  nps: 46,
  winRateComp: 22, // rakipli fırsatlarda kazanma oranı
  winRateSolo: 45, // rakipsiz fırsatlarda
}

const M = "Marmara Gıda Holding"
const AL = "Anadolu Lojistik A.Ş."
const ET = "Ege Tekstil Sanayi"
const KE = "Karadeniz Enerji"
const AP = "Akdeniz Perakende Grubu"
const KZ = "Kızılırmak Kimya"
const TY = "Toroslu Yapı"
const TA = "Trakya Ambalaj"
const MM = "Meriç Medikal"
const IA = "İç Anadolu Sağlık Grubu"
const VG = "Van Gölü Turizm"

export default defineDataset({
  id: "ana",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Satış hedefi, fırsat ve müşteri sorularını yanıtlar; haftalık özet hazırlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Satış tahmini ve fırsat olasılıkları.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Teklif ve sözleşmeler için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Fiyat ve iskonto simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Müşteri içgörüleri ve hesap özetleri.", icon: "Telescope02Icon" },
    { name: "tyroOffer", type: "ai", description: "Teklif ve sunum taslaklarını müşteri geçmişinden otomatik hazırlar.", icon: "DocumentValidationIcon" },
    { name: "tyroVoice", type: "ai", description: "Müşteri görüşmelerinden özet, karar ve aksiyon maddeleri çıkarır.", icon: "AiBrain02Icon" },
    { name: "tyroRadar", type: "ai", description: "Rakip hamlelerini ve pazar sinyallerini izler, satış ekibini uyarır.", icon: "ArtificialIntelligenceIcon" },
    { name: "tyroRenew", type: "ai", description: "Yenileme riskini ve müşteri sağlık skorunu erken uyarıyla gösterir.", icon: "ChartHistogramIcon" },
    { name: "CRM", type: "business", description: "Müşteri ve fırsat kayıtları", url: "#", icon: "Target02Icon" },
    { name: "Teklif Portalı", type: "business", description: "Teklif şablonları, onay durumu ve sürüm geçmişi", url: "#", icon: "AddInvoiceIcon" },
    { name: "Sözleşme Arşivi", type: "business", description: "İmzalı sözleşmeler ve yenileme tarihleri", url: "#", icon: "DocumentValidationIcon" },
    { name: "Tahsilat Takibi", type: "business", description: "Fatura, vade ve ödeme planı durumu", url: "#", icon: "Analytics01Icon" },
    { name: "Sipariş Yönetimi", type: "business", description: "Sipariş, lisans aktivasyonu ve teslimat durumu", url: "#", icon: "Package01Icon" },
  ],

  weather: { now: "partlycloudy", base: 16, amp: 5 },
  market: { rates: { USD: 44.2, EUR: 51.3, GBP: 58.1, CHF: 54.7 }, bist: 11340 },

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
      body: "Geçen haftanın sonuçları, pipeline durumu ve bu haftanın öncelikleri. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Satış günlük 15 dk",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Kısa durum turu: dünün kapanışları, bugünün görüşmeleri, engeller.",
    },
    {
      title: "Pipeline gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık fırsatların aşama, olasılık ve kapanış tarihi kontrolü. Riskli fırsatlar için aksiyon belirlenir.",
    },
    { title: `${M} — teklif sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Hakan Öz (${M})`, "Zeynep Acar", "Deniz Arslan"], body: "Satın alma otomasyonu teklifinin son sunumu. Fiyat ve devreye alma takvimi konuşulacak." },
    { title: `${AL} — sözleşme müzakeresi`, day: 1, time: "10:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Selma Arıkan (${AL})`, "Zeynep Acar", "Can Yıldız"], body: "Filo takip platformu sözleşmesinin ödeme ve SLA maddeleri." },
    { title: "Q4 hedef değerlendirme", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Çeyrek sonu hedef gerçekleşme ve son altı haftanın aksiyon planı." },
    { title: "Strateji çalıştayı (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "2027 satış stratejisi çalıştayı. Katılımınızı bekliyoruz." },
    { title: `${ET} — ürün demosu`, day: 3, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Murat Kılınç (${ET})`, "Deniz Arslan", "Elif Kaya"], body: "Üretim planlama modülü canlı demo." },
    { title: "Müzakere teknikleri atölyesi", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat"], body: "TYRO Eğitim: satış ekipleri için müzakere teknikleri atölyesi." },
    { title: `${KE} — referans görüşmesi`, day: 6, time: "16:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pelin Yazıcı (${KE})`], body: "Yeni müşteri adayına referans olması için kısa görüşme." },
    { title: "İzmir bölge ofisi — iş gezisi", day: 10, allDay: true, span: 2, where: "İzmir", organizer: "Ömer Gümüş", with: ["Ömer Gümüş", "Selin Aydın", "Zeynep Acar"], body: "Uçuş: İstanbul → İzmir (sabah). Yeni bölge ofisinde kurulum toplantıları, bölge müşterileriyle yemek ve ofis alanı gezisi." },
    { title: "Bölge müşteri günü — Ankara", day: 8, allDay: true, where: "Ankara", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Ankara bölgesi müşteri ziyaretleri." },
    // geçmiş
    { title: `${KE} — başlangıç toplantısı`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pelin Yazıcı (${KE})`, "Zeynep Acar"], body: "Proje başlangıcı ve sorumluluk dağılımı." },
    { title: `${AP} — pilot kapsamı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nehir Sarı (${AP})`, "Deniz Arslan"], body: "Mağaza analitiği pilotunun kapsamı ve başarı ölçütleri." },
    { title: "Ekip 1:1 — Onur Polat", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Hedef, kanal pipeline'ı ve gelişim planı." },

    // ───── ek tekrarlı toplantılar ─────
    {
      title: "Teklif ve iskonto onay komitesi",
      recur: "weekly",
      weekday: 3,
      time: "10:30",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin", "Deniz Arslan"],
      body: "Bekleyen teklif ve iskonto talepleri tek oturumda karara bağlanır. Kampanya iskontosunu (%8) aşan talepler için Finans ve Pazarlama görüşü alınır.",
    },
    {
      title: "Müşteri başarı ve yenileme turu",
      recur: "weekly",
      weekday: 2,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Gizem Tunç",
      with: ["Ömer Gümüş", "Derya Çelik", "Mert Aksoy"],
      body: "90 gün içinde biten sözleşmeler, memnuniyet sinyalleri ve açık destek kayıtları. Yenileme riski taşıyan hesaplar için sahip ve tarih belirlenir.",
    },
    {
      title: "Ürün–satış senkronu",
      recur: "weekly",
      weekday: 5,
      time: "11:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Deniz Arslan",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Elif Kaya"],
      body: "Yol haritası değişiklikleri, müşterilerden gelen özellik talepleri ve demo ortamı ihtiyaçları. Satıştaki fırsatları etkileyen ürün riskleri burada açılır.",
    },
    {
      title: "Aylık müşteri sağlığı değerlendirmesi",
      recur: "monthly",
      dom: 10,
      time: "13:30",
      minutes: 60,
      where: "Maslak · Toplantı Odası 2",
      organizer: "Ömer Gümüş",
      with: ["Gizem Tunç", "Derya Çelik", "Mert Aksoy", "Deniz Arslan"],
      body: "Aktif müşterilerin kullanım, memnuniyet ve ödeme göstergeleri; sağlık skoru düşen hesaplar için aksiyon planı. Memnuniyet anketi sonuçları (NPS) birlikte okunur.",
    },
    {
      title: "Aylık satış–finans tahsilat toplantısı",
      recur: "monthly",
      dom: 26,
      time: "11:00",
      minutes: 45,
      where: "Microsoft Teams",
      organizer: "Can Yıldız",
      with: ["Ömer Gümüş", "Selin Aydın", "Derya Çelik"],
      body: "Vadesi geçen alacakların yaşlandırma tablosu, ödeme planı verilen müşteriler ve yıl sonu tahsilat tahmini.",
    },

    // ───── ek tek seferlik toplantılar: gelecek ─────
    { title: `${TA} — ödeme planı görüşmesi`, day: 1, time: "15:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Dilek Yaman (${TA})`, "Can Yıldız"], body: "Vadesi geçen 0,64 M₺'lik faturanın iki taksite bölünmesi talebi. Finans tarafından Can Yıldız da katılacak." },
    { title: `${M} — devreye alma planı çalışması`, day: 2, time: "11:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Hakan Öz (${M})`, "Mert Aksoy", "Zeynep Acar"], body: "Devreye alma süresinin 10 haftadan 8 haftaya çekilmesi için kaynak planı, pilot fabrika sırası ve kritik bağımlılıklar." },
    { title: `${MM} — yenileme görüşmesi`, day: 3, time: "15:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Barış Tekin (${MM})`, "Gizem Tunç"], body: "Yıllık lisans yenilemesi: kullanım raporu, çok yıllı sözleşme için indirim senaryosu ve destek paketi seçenekleri." },
    { title: `${KZ} — fiyat müzakeresi`, day: 4, time: "14:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Ceren Tuncer (${KZ})`, "Zeynep Acar", "Deniz Arslan"], body: "Talep tahmini çözümünde yıllık lisans bedeli ve 36 aylık taahhüt koşulları. Müşteri ilk yıl için ek iyileştirme bekliyor." },
    { title: "Ekip 1:1 — Zeynep Acar", day: 4, time: "09:45", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Hedefi aşan portföyün korunması, büyük hesaplar ve gelecek yıl için gelişim hedefleri." },
    { title: `${TY} — RFP sunumu`, day: 5, time: "15:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Aylin Doğan (${TY})`, "Zeynep Acar", "Deniz Arslan"], body: "Satın alma otomasyonu RFP'sinin son sunumu: ERP entegrasyonu, devreye alma yaklaşımı ve fiyat tablosu. Rakip teklifler de değerlendirmede." },
    { title: `${IA} — yapay zekâ asistanı keşif toplantısı`, day: 6, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Bozkurt (${IA})`, "Elif Kaya", "Deniz Arslan"], body: "Hasta iletişim merkezi için yapay zekâ asistanı pilotu: kapsam, veri güvenliği ve başarı ölçütleri." },
    { title: "Ekip 1:1 — Derya Çelik", day: 7, time: "16:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "Tahmin raporundaki tutarsızlıklar, CRM veri kalitesi ve rapor otomasyonu çalışması." },
    { title: "Müşteri başarı hikâyesi çekimi (davet)", day: 9, time: "14:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Emre Şahin", status: "notResponded", with: ["Ömer Gümüş", "Gizem Tunç", `Pelin Yazıcı (${KE})`], body: "Karadeniz Enerji projesi için kısa video ve yazılı başarı hikâyesi çekimi. Katılımınızı bekliyoruz." },
    { title: "Yıl sonu satış planlama günü", day: 12, allDay: true, where: "Maslak · Eğitim Salonu", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"], body: "Tüm gün: 2027 hesap planları, bölge dağılımı ve ekip hedeflerinin çalıştayı. Öğle yemeği ofiste." },
    { title: "2027 bütçe ve kota planı", day: 13, time: "10:00", minutes: 90, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Gelir hedefi, kota dağılımı ve kampanya bütçesinin bir araya getirildiği yıllık planlama oturumu." },

    // ───── ek tek seferlik toplantılar: geçmiş ─────
    { title: `${MM} — memnuniyet görüşmesi`, day: -1, time: "16:00", minutes: 30, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Barış Tekin (${MM})`, "Ömer Gümüş"], body: "Yıllık kullanım değerlendirmesi ve destek süreçlerinden memnuniyet. Müşteri yenileme öncesi iki talep iletti." },
    { title: `${KZ} — teknik değerlendirme`, day: -4, time: "14:00", minutes: 60, where: "Microsoft Teams", organizer: "Deniz Arslan", with: [`Ceren Tuncer (${KZ})`, "Elif Kaya", "Ömer Gümüş"], body: "Talep tahmini modelinin müşteri verisiyle ön sonuçları ve entegrasyon gereksinimleri." },
    { title: `${VG} — çeyrek değerlendirmesi`, day: -5, time: "10:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Tolga Erdem (${VG})`, "Gizem Tunç"], body: "Misafir analitiği kullanımı, üç otel için genişleme talebi ve açık fatura konusu." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -6, time: "14:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Müşteri ilişkileri sunumu geri bildirimi ve yenileme portföyünün devri." },
    { title: `${TA} — canlı kullanım değerlendirmesi`, day: -7, time: "11:00", minutes: 60, where: "Trakya · Çorlu tesisi", organizer: "Mert Aksoy", with: [`Dilek Yaman (${TA})`, "Ömer Gümüş"], body: "Üretim planlama modülünün pilot tesisteki sonuçları ve iki yeni tesise yayma planı." },
    { title: "Kasım kampanyası lansman toplantısı", day: -9, time: "13:30", minutes: 45, where: "Maslak · Eğitim Salonu", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"], body: "Kasım kampanyasının kuralları, hedef müşteri listesi ve iskonto onay akışı." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Hakan Öz (${M})`,
      subject: "Re: Satın alma otomasyonu teklifi",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Teklifinizi yönetim ekibiyle değerlendirdik. Genel çerçeve uygun; yalnızca devreye alma takvimini iki hafta öne çekebilir miyiz? Bugünkü sunumda bunu konuşalım.",
        "Ayrıca ikinci fabrika için opsiyonel lisans fiyatını da ayrı bir kalem olarak görmek isteriz.",
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
        `Yaklaşan değerlendirme toplantısı için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'indeyiz (${KPI.achieved} M₺ / ${KPI.quota} M₺); açık pipeline ${KPI.pipeline} M₺.`,
        "Riskli üç fırsatı ve gerekirse benden istediğin desteği not düş lütfen.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: `${AL} sözleşme taslağı`,
      at: { days: 1, time: "17:40" },
      unread: true,
      body: ["Ömer Bey merhaba,", "Anadolu Lojistik'ten gelen karşı taslağı ekte özetledim: ödeme vadesi 60 gün istiyorlar, SLA cezalarını %15'ten %10'a çekmek istiyorlar. Yarınki toplantıdan önce görüşebilir miyiz?"],
    },
    {
      from: "Can Yıldız",
      subject: `${KE} — fatura onayı`,
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: ["Merhaba Ömer,", "Karadeniz Enerji ilk dönem faturası için satış onayı bekliyor. İskonto oranını teyit eder misin? Onay gelince faturayı hemen keseceğim."],
    },
    {
      from: `Selma Arıkan (${AL})`,
      subject: "Müzakere toplantısı gündemi",
      at: { days: 1, time: "14:20" },
      body: ["Merhaba,", "Yarınki toplantı için gündem önerimiz: (1) ödeme planı, (2) SLA maddeleri, (3) devreye alma takvimi. Eklemek istediğiniz başlık varsa bildirin."],
    },
    {
      from: `Murat Kılınç (${ET})`,
      subject: "Demo için erişim bilgileri",
      at: { days: 2, time: "16:05" },
      body: ["Ömer Bey,", "Yaklaşan demoya BT ekibimizden iki kişi de katılacak. Bağlantı ve test verisi için kendilerine erişim açabilir misiniz?"],
    },
    {
      from: "Deniz Arslan",
      subject: "Yeni sürüm notları ve satış sunumu güncellemesi",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "3.4 sürümüyle gelen yeni özellikleri satış sunumuna ekledim. Özellikle tahmin doğruluğu ve onay akışı slaytlarını müşterilerle paylaşabilirsiniz."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 44. hafta",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: [`Merhaba Ömer Bey,`, `Bu hafta ${KPI.closedThisMonth} M₺ kapanış gerçekleşti; kazanma oranı %${KPI.winRate}. Rapor ekte ve paylaşılan klasörde.`],
    },
    {
      from: `Pelin Yazıcı (${KE})`,
      subject: "Referans müşteri görüşmesi",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "Bir iş ortağımız projemizi merak ediyor. Önümüzdeki hafta yarım saatlik bir görüşme ayarlayabilirsek memnun oluruz."],
    },
    {
      from: "Mert Aksoy",
      subject: "Teslimat takvimi — Aralık",
      at: { days: 5, time: "13:25" },
      body: ["Ömer,", "Aralık devreye alma planını güncelledim. İki proje aynı haftaya denk geliyor; öncelik sırasını satış tarafından netleştirebilir misin?"],
    },
    {
      from: `Nehir Sarı (${AP})`,
      subject: "Mağaza analitiği pilot kapsamı",
      at: { days: 6, time: "15:40" },
      important: true,
      body: ["Merhaba Ömer Bey,", "Pilot için üç şehirden on iki mağaza belirledik. Başlangıç tarihi olarak Aralık'ın ilk haftası uygun görünüyor."],
    },
    { from: "Kaan Özdemir", subject: "Bölge ziyaret planı", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, Ankara ve Eskişehir ziyaretlerini aynı gün altında topladım. Plan ekte; onayınızla randevuları sabitleyeceğim."] },
    { from: "Emre Şahin", subject: "Kasım kampanyası broşürü onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, kampanya broşürünün son hali ekte. Fiyat ve tarih bilgilerini bir kez de satış tarafı görsün istedik."] },
    { from: "Elif Kaya", subject: "Asistan demo ortamı hazır", at: { days: 9, time: "16:30" }, body: ["Ömer Bey, müşteri sunumlarında kullanabileceğiniz asistan demo ortamı hazır. Örnek sorular ve veriler yüklü."] },

    // ───── ek müşteri ve iç yazışmalar ─────
    {
      from: `Ceren Tuncer (${KZ})`,
      subject: "Talep tahmini teklifi — fiyat revizyonu talebi",
      at: { hoursAgo: 1 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Teknik değerlendirme sonuçları ekibimizde olumlu karşılandı. Finans direktörümüz, toplam 1,9 M₺'lik teklifte yıllık lisans bedelinde %6 iyileştirme bekliyor; karşılığında 36 aylık taahhüt verebiliriz.",
        "Fiyat görüşmesinden önce kapsamdaki kullanıcı sayısını ve destek seviyesini netleştirmek isteriz. Uygun olduğunuzda rakamları birlikte gözden geçirelim.",
        "İyi çalışmalar.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Vadesi geçen alacaklar — satış desteği gerekiyor",
      at: { minutesAgo: 40 },
      unread: true,
      flagged: true,
      body: [
        "Ömer,",
        `Vadesi geçen toplam alacak ${KPI.overdue} M₺'ye çıktı; ${KPI.overdueCount} müşteri var: Trakya Ambalaj (0,64 M₺, 47 gün), Van Gölü Turizm (0,71 M₺, 35 gün), İç Anadolu Sağlık Grubu (0,52 M₺, 14 gün) ve Meriç Medikal (0,41 M₺, 21 gün).`,
        "İlk aramayı satış ekibinden yapabilirsek ödeme planı görüşmesini ben yürütürüm. Aylık tahsilat toplantısında tabloyu birlikte açalım.",
      ],
    },
    {
      from: `Dilek Yaman (${TA})`,
      subject: "Ödeme planı talebi",
      at: { days: 1, time: "15:10" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Tesis yatırımlarımız nedeniyle nakit akışımız bu ay sıkıştı. Vadesi geçen 0,64 M₺'lik faturayı iki eşit taksitte, ilk taksit ay sonunda olmak üzere ödemek istiyoruz.",
        "Üretim planlama modülünü üç tesise yaymayı planladığımız için ilişkimizi bozmadan çözmek istiyoruz. Planlanan görüşmede bunu konuşabilir miyiz?",
      ],
    },
    {
      from: `Aylin Doğan (${TY})`,
      subject: "RFP soru listesi ve entegrasyon gereksinimleri",
      at: { days: 1, time: "12:25" },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "RFP kapsamındaki entegrasyon sorularımızı ekledik: 14 madde var, bunlardan beşi mevcut ERP sistemimizle veri alışverişi hakkında. Yanıtları sunumdan önce yazılı alırsak değerlendirme kurulunu bilgilendirebiliriz.",
        "Bilginiz olsun, iki rakip teklif de elimizde. Karşılaştırmada fiyat kadar devreye alma süresi ve yerel destek de ağırlıklı olacak.",
      ],
    },
    {
      from: `Serkan Bozkurt (${IA})`,
      subject: "Yapay zekâ asistanı — veri güvenliği ve KVKK soruları",
      at: { days: 2, time: "11:20" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Hasta iletişim merkezinde kullanacağımız asistan için bilgi güvenliği ekibimiz üç konuda yazılı bilgi istiyor: verilerin yurt içinde barındırılması, kişisel verilerin maskelenmesi ve verilerin model eğitiminde kullanılmaması.",
        "Bu yanıtlar olmadan pilot onayı yönetimimize çıkamıyor. Elif Hanım'ın hazırlayacağı kısa bir güvenlik özeti yeterli olacaktır.",
      ],
    },
    {
      from: `Barış Tekin (${MM})`,
      subject: "Lisans yenileme — çok yıllı sözleşme koşulları",
      at: { days: 2, time: "09:35" },
      body: [
        "Ömer Bey merhaba,",
        "Yıllık lisansımız (1,4 M₺) önümüzdeki iki ay içinde sona eriyor. İki ya da üç yıllık yenileme için ne tür bir indirim sunabileceğinizi öğrenmek isteriz.",
        "Ayrıca destek paketini 7/24 seviyesine çıkarmayı düşünüyoruz; fiyat farkını ayrı kalem olarak görebilirsek memnun oluruz.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "2027 kota planı taslağı — geri bildirim",
      at: { days: 3, time: "16:45" },
      flagged: true,
      body: [
        "Ömer merhaba,",
        "2027 kota dağılım taslağını paylaşılan klasöre koydum. Genel hedefi bu yıla göre %22 artırıyoruz; bölge dağılımında Ankara ve İzmir'in payı büyüyor.",
        "Ekibin kotalarını bu hafta içinde gözden geçirip gerçekçi bulmadığın yerleri gerekçesiyle yaz lütfen. Bütçe oturumuna taslağı bu notlarla götüreceğim.",
      ],
    },
    {
      from: `Tolga Erdem (${VG})`,
      subject: "Misafir analitiği — üç otel için genişleme",
      at: { days: 4, time: "16:20" },
      body: [
        "Merhaba Ömer Bey,",
        "Üç yeni otelimizi de misafir analitiği kapsamına almak istiyoruz. Tahmini ek bütçemiz 0,9 M₺; teklifi ve devreye alma süresini öğrenebilir miyiz?",
        "Muhasebe ekibimiz açık faturayı bir sonraki ödeme çalışmasında kapatacağını bildirdi. Yaşanan gecikme için özür dileriz.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Müşteri memnuniyet anketi sonuçları",
      at: { days: 4, time: "10:15" },
      body: [
        "Ömer Bey merhaba,",
        `Anket sonuçları çıktı: NPS ${KPI.nps}, yanıt oranı %38. Üç müşteri 6 ve altı puan verdi; ortak şikâyet devreye alma sürecinin uzunluğu ve destek kayıtlarına geç dönüş.`,
        "Düşük puan veren üç müşteriyi arayacağım; yenilemesi yakın olanlar için senin desteğini isteyeceğim. Özet rapor paylaşılan klasörde.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "CRM'de güncel olmayan fırsat kayıtları",
      at: { days: 5, time: "11:40" },
      body: [
        "Ömer Bey,",
        "Tahmin raporunu hazırlarken yedi fırsatın aşamasının 30 günden uzun süredir değişmediğini gördüm. Toplamları 3,1 M₺ ve tahmin doğruluğunu bozuyor.",
        "Sahiplerinden güncelleme istedim. Kapanış tarihi geçmiş iki kayıt için senin kararına ihtiyacım var: kapatalım mı, yoksa yeni tarih mi verelim?",
      ],
    },
    {
      from: `Hakan Öz (${M})`,
      subject: "Hukuk ekibimizin sözleşme notları",
      at: { days: 5, time: "12:30" },
      body: [
        "Merhaba Ömer Bey,",
        "Hukuk ekibimiz taslak sözleşmede üç maddeye not düştü: veri saklama süresi, fikri mülkiyet ve cezai şart tavanı. Notları ekte iletiyorum.",
        "Bu maddeler netleşirse yönetim onayına gitmeden önce teklif sürecini kapatabiliriz.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "İş ortağı proje kaydı çakışması",
      at: { days: 6, time: "14:05" },
      body: [
        "Ömer Bey,",
        "Altınova Entegrasyon ve bir diğer iş ortağı aynı müşteri için proje kaydı açmış. Kuralımız gereği ilk açılan kayıt korumada; ancak ikinci ortak itiraz ediyor.",
        "Karar vermeden önce sizinle 15 dakika konuşabilir miyiz? Kanal kuralları açısından emsal oluşturacak bir durum.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "İzmir ve Manisa ziyaret notları",
      at: { days: 6, time: "17:10" },
      body: [
        "Ömer Bey,",
        "İki günlük ziyaretten üç yeni fırsat çıktı: tekstil, gıda ve lojistik sektöründen, toplam 2,4 M₺. Notlar paylaşılan klasörde.",
        "İzmir'de bir müşteri bölge ofisinin açılış tarihini sordu; resmi duyuru çıkınca yazılı bilgi vereceğimi söyledim.",
      ],
    },
    {
      from: `Selma Arıkan (${AL})`,
      subject: "Filo veri entegrasyonu için teknik toplantı",
      at: { days: 7, time: "11:50" },
      body: [
        "Merhaba Ömer Bey,",
        "BT ekibimiz sözleşme imzalanmadan önce filo verisi entegrasyonunu teknik olarak görmek istiyor. Bir saatlik bir oturum yeterli olacaktır.",
        "Zeynep Hanım ve Elif Hanım'ın katılabileceği iki uygun zaman önerirseniz BT ekibini ona göre toplarım.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Karadeniz Enerji başarı hikâyesi için onay",
      at: { days: 7, time: "13:40" },
      body: [
        "Ömer merhaba,",
        "Başarı hikâyesi metnini hazırladık. Müşteriye göndermeden önce proje rakamlarının doğruluğunu satış tarafından teyit eder misin?",
        "Pelin Hanım yayın iznini sözlü olarak verdi; yazılı onayı da alacağız.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Marmara Gıda devreye alma için ek kaynak",
      at: { days: 8, time: "10:05" },
      important: true,
      flagged: true,
      body: [
        "Ömer,",
        "Marmara Gıda'nın istediği 8 haftalık takvim için iki ek danışman gerekiyor; ek maliyet yaklaşık 0,18 M₺. Bunu fiyata yansıtmazsak projenin marjı düşecek.",
        "Kararını verirsen kaynak talebini hemen açacağım.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: "Rakip karşılaştırma kartı güncellendi",
      at: { days: 8, time: "15:30" },
      body: [
        "Ömer,",
        "Pusula Yazılım ve Kuzgun Teknoloji için karşılaştırma kartını yeniledim. Pusula'nın liste fiyatı yaklaşık %12 daha düşük, ancak yerel destek ve entegrasyon tarafında zayıf kaldıkları görülüyor.",
        "Toroslu Yapı sunumunda kullanılabilecek üç kanıt noktası da ekledim.",
      ],
    },
    {
      from: `Murat Kılınç (${ET})`,
      subject: "Ekibimizdeki değişiklik hakkında",
      at: { days: 9, time: "17:00" },
      body: [
        "Ömer Bey,",
        "Üretim planlama projemizin sponsoru olan genel müdür yardımcımız görevinden ayrıldı; yerine gelecek yönetici projeyi baştan değerlendirmek istiyor.",
        "Süreç sizin için gecikme yaratabilir; ancak demo çok iyi geçti, yeni yöneticiyle tanışma toplantısı ayarlayabiliriz.",
      ],
    },
    {
      from: `Pelin Yazıcı (${KE})`,
      subject: "Ek modül bütçe onayı süreci",
      at: { days: 11, time: "10:30" },
      body: [
        "Merhaba Ömer Bey,",
        "Raporlama paketine ek modül için bütçe talebimiz yönetim kurulu gündeminde; karar ay sonuna doğru çıkacak. Onay gelir gelmez size yazacağım.",
        "Bu arada ilk dönem faturaya ilişkin mali işler ekibimizin soruları Can Bey'e iletildi.",
      ],
    },
    {
      from: "Ayşe Demir",
      subject: "Satış ekibi için yıllık izin planı hatırlatması",
      at: { days: 12, time: "09:50" },
      body: [
        "Merhaba Ömer Bey,",
        "Ekibinizden izin planını henüz girmeyen üç kişi var. Planlar 30 Kasım'a kadar tamamlanmazsa yıl sonu yoğunluğunda izin çakışmaları oluşabilir.",
        "İsterseniz ekip bazında bir takvim görünümü hazırlayıp paylaşabilirim.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Yıl sonu fatura kesim takvimi — satışa notlar",
      at: { days: 13, time: "14:15" },
      body: [
        "Ömer,",
        "Yıl sonu kapanışı nedeniyle fatura taleplerini 18 Aralık'a kadar almam gerekiyor. Sonrasında kesilen faturalar ocak ayına kayar ve çeyrek gerçekleşmesine yansımaz.",
        "Kapanışı bu döneme düşen sözleşmelerin listesini ekibinle çıkarıp bana iletirsen takvime koyarım.",
      ],
    },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları açıklandı", at: { days: 1, time: "09:05" }, body: ["Şirketimiz üçüncü çeyreği geçen yılın aynı dönemine göre %18 büyümeyle tamamladı.", "Büyümenin ana itici gücü kurumsal yapay zekâ çözümleri ve yenileme sözleşmeleri oldu. Tüm ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "Karadeniz Enerji ile çok yıllı sözleşme imzalandı", at: { days: 4, time: "10:20" }, body: ["Karadeniz Enerji ile üç yıllık raporlama ve analitik sözleşmesi imzalandı. Proje ekibi bu hafta çalışmaya başladı."] },
    { feed: "haberler", subject: "TYRO AI platformunun yeni sürümü yayında", at: { days: 8, time: "11:00" }, body: ["3.4 sürümüyle tahmin doğruluğu arttı, onay akışları sadeleşti. Sürüm notları ve eğitim videoları Akademi'de."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: sistemler cumartesi 02:00–04:00 arası kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–04:00 arasında altyapı bakımı yapılacak. Bu sürede e-posta hariç iç sistemlere erişilemeyecek."] },
    { feed: "duyuru", subject: "Kasım satış kampanyası başladı", at: { days: 6, time: "09:00" }, important: true, body: ["Kasım kampanyası bugün başladı: yıllık sözleşmelerde %8 ek iskonto, ilk üç ay ücretsiz destek. Detaylar ekteki broşürde."] },
    { feed: "duyuru", subject: "Ofis giriş kartı yenileme duyurusu", at: { days: 11, time: "14:30" }, body: ["Maslak ofisinde giriş kartları yenileniyor. Kartınızı İdari İşler'den 20 Kasım'a kadar teslim alabilirsiniz."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Ayşe Demir", at: { days: 3, time: "09:30" }, body: ["İnsan Kaynakları ekibimize İK Uzmanı olarak katılan Ayşe Demir'e hoş geldin diyoruz. Kendisine başarılar dileriz."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan arkadaşlarımıza iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "Yıllık izin planlama dönemi başladı", at: { days: 9, time: "10:00" }, body: ["2027 yıllık izin planlarınızı 30 Kasım'a kadar yöneticinizle birlikte girmenizi rica ederiz."] },
    { feed: "egitim", subject: "Satış becerileri atölyesi: Müzakere teknikleri", at: { days: 5, time: "11:15" }, body: ["Müzakere teknikleri atölyesi yaklaşan günlerde, sabah 10:00'da. Kontenjan sınırlıdır."] },
    { feed: "egitim", subject: "Siber güvenlik farkındalık eğitimi tamamlandı mı?", at: { days: 12, time: "09:20" }, body: ["Zorunlu siber güvenlik eğitimini bu ay sonuna kadar tamamlamanız gerekiyor."] },
    { feed: "akademi", subject: "Yeni modül: Yapay zekâ ile satış tahmini", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: yapay zekâ ile satış tahmini nasıl yapılır, hangi veriler gerekir? 25 dakikalık video ve uygulama dosyaları."] },
    { feed: "kulup", subject: "Cuma akşamı kulüp buluşması: Fotoğraf yürüyüşü", at: { days: 3, time: "12:30" }, body: ["Fotoğraf kulübü bu haftanın sonunda Karaköy'de buluşuyor. Katılmak isteyen herkes davetlidir."] },
    { feed: "kulup", subject: "Gönüllülük günü: Kasım ayı kayıtları", at: { days: 10, time: "13:00" }, body: ["Kasım ayı gönüllülük günü için kayıtlar açıldı. Bu ay hayvan barınağı ziyareti var."] },

    // ───── Keşfet akışı: ek içerikler ─────
    { feed: "haberler", subject: "tyroForecast, yapay zekâ çözümleri kategorisinde finalist oldu", at: { days: 2, time: "11:30" }, body: ["tyroForecast, Kurumsal Teknoloji Zirvesi'nin \"Yılın Yapay Zekâ Çözümü\" kategorisinde finale kaldı.", "Jüri, ürünün satış tahmini doğruluğunu ve kolay kurulumunu öne çıkardı. Ödüller aralık ayındaki törende açıklanacak."] },
    { feed: "haberler", subject: "Trakya Ambalaj üretim planlama modülünü üç tesise yaydı", at: { days: 6, time: "10:40" }, body: ["Trakya Ambalaj, üretim planlama modülünü Çorlu'daki pilot tesisin ardından iki yeni tesisinde de kullanmaya başlıyor.", "Müşteri, pilot sürecinde plansız duruşlarda %14 azalma bildirdi. Proje ekibimizi tebrik ederiz."] },
    { feed: "haberler", subject: "İzmir bölge ofisi 2027'nin ilk çeyreğinde açılıyor", at: { days: 10, time: "15:20" }, body: ["Ege bölgesindeki müşterilerimize daha yakın olmak için İzmir'de bölge ofisi açıyoruz. Ofis 2027'nin ilk çeyreğinde hizmete girecek.", "Satış ve müşteri başarı ekiplerinden dört arkadaşımız başlangıçta İzmir'de görev alacak; görevlendirmeler İK kanalından duyurulacak."] },
    { feed: "duyuru", subject: "Yıl sonu fatura kesim takvimi açıklandı", at: { days: 3, time: "14:10" }, important: true, body: ["Yıl sonu kapanışı için son sipariş onayı ve fatura talepleri 18 Aralık'a kadar Finans'a iletilmelidir.", "Bu tarihten sonra kesilen faturalar ocak ayı gerçekleşmesine yazılır. Sorularınız için Can Yıldız ile iletişime geçebilirsiniz."] },
    { feed: "duyuru", subject: "Teklif ve sözleşme şablonu v4 yayında", at: { days: 7, time: "09:40" }, body: ["Hukuk onaylı yeni teklif ve sözleşme şablonu (v4) paylaşılan klasörde. Veri saklama ve cezai şart maddeleri güncellendi.", "Eski şablonlarla hazırlanan teklifler 15 Aralık'tan sonra kabul edilmeyecek."] },
    { feed: "duyuru", subject: "Çok faktörlü doğrulama yenileme sıklığı değişiyor", at: { days: 12, time: "16:00" }, body: ["Güvenlik politikası gereği ofis dışından erişimlerde çok faktörlü doğrulama her 14 günde bir yenilenecek.", "Doğrulama uygulamanızı güncellemek için BT Destek'ten yardım alabilirsiniz."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Elif Kaya", at: { days: 5, time: "09:20" }, body: ["Ürün ekibimize Yapay Zekâ Mühendisi olarak katılan Elif Kaya'ya hoş geldin diyoruz.", "Elif, asistan ve satış tahmini modelleri üzerinde çalışacak. Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Kasım ayı doğum günleri", at: { days: 4, time: "08:50" }, body: ["Kasım ayında doğum günü olan arkadaşlarımıza iyi ki doğdunuz diyoruz: Zeynep Acar, Mert Aksoy ve Gizem Tunç.", "Nice mutlu yıllara! Doğum günü pastası ayın son haftasında ortak alanda ikram edilecek."] },
    { feed: "ik", subject: "Tamamlayıcı sağlık sigortası yenileme dönemi", at: { days: 11, time: "11:10" }, body: ["2027 tamamlayıcı sağlık sigortası poliçeleri yenileniyor. Eş ve çocuk ekleme taleplerinizi 12 Aralık'a kadar İK'ya iletebilirsiniz.", "Mevcut teminatlar korunuyor; ek teminat seçenekleri için İK ile görüşebilirsiniz."] },
    { feed: "egitim", subject: "CRM veri kalitesi oturumu: fırsat kayıtları nasıl güncel tutulur?", at: { days: 4, time: "10:00" }, body: ["Satış ekipleri için 90 dakikalık çevrim içi oturum. Fırsat aşaması, kapanış tarihi ve olasılık alanlarının doğru kullanımı örneklerle anlatılacak.", "Katılım için takvim davetini kabul etmeniz yeterli."] },
    { feed: "egitim", subject: "Etkili sunum ve hikâye anlatımı atölyesi", at: { days: 8, time: "13:20" }, body: ["Müşteri ve yönetim sunumlarında mesajı netleştirmeyi anlatan iki saatlik atölye Maslak Eğitim Salonu'nda yapılacak. Kontenjan 20 kişidir.", "Kendi sunumunuzu getirirseniz atölyede birlikte iyileştirebiliriz."] },
    { feed: "egitim", subject: "Liderlik gelişim programı başvuruları açıldı", at: { days: 13, time: "09:30" }, body: ["Yönetici ve yönetici adayları için altı aylık liderlik gelişim programına başvurular 28 Kasım'a kadar sürüyor.", "Program; koçluk oturumları, vaka çalışmaları ve çapraz ekip projelerinden oluşuyor."] },
    { feed: "akademi", subject: "Yeni modül: Müşteri başarı ve yenileme yönetimi", at: { days: 3, time: "15:30" }, body: ["Akademi'de yeni bir modül yayında: yenileme riskini erken görmek, müşteri sağlık skorunu okumak ve yenileme görüşmesine hazırlanmak. 35 dakikalık video ve çalışma kâğıdı içerir."] },
    { feed: "akademi", subject: "Yeni modül: tyroPricing ile teklif simülasyonu", at: { days: 6, time: "11:45" }, body: ["tyroPricing'de iskonto senaryolarını nasıl kurarsınız? Yeni modülde bir teklifin marj etkisini adım adım simüle ediyoruz. Süre: 20 dakika."] },
    { feed: "akademi", subject: "Kurumsal Yapay Zekâ Uzmanı sertifika programının ilk grubu tamamlandı", at: { days: 9, time: "14:00" }, body: ["Kurumsal Yapay Zekâ Uzmanı sertifika programının ilk grubundan 42 çalışanımız sertifikasını aldı.", "Yeni dönem kayıtları ocak ayında açılacak; ön kayıt için Akademi sayfasını ziyaret edebilirsiniz."] },
    { feed: "akademi", subject: "Webinar kaydı: Rakip analizi ve konumlandırma", at: { days: 12, time: "10:15" }, body: ["Satış ekipleri için hazırlanan rakip analizi webinarının kaydı yayında. 50 dakikalık oturumda fiyat itirazlarına nasıl yanıt verileceği örneklerle anlatılıyor."] },
    { feed: "kulup", subject: "Satranç turnuvası kayıtları açıldı", at: { days: 4, time: "12:00" }, body: ["Yıl sonu satranç turnuvası için kayıtlar açıldı. Maçlar öğle aralarında Maslak ofisinde oynanacak; kazanan kulüp kupasını alacak."] },
    { feed: "kulup", subject: "Koşu kulübü: Belgrad Ormanı'nda ay sonu koşusu", at: { days: 8, time: "16:45" }, body: ["Koşu kulübü ay sonunda Belgrad Ormanı'nda 8 km'lik hafif tempolu bir koşu düzenliyor. Her seviyeden katılımcı davetlidir; tarih ve buluşma noktası kulüp sayfasında."] },
    { feed: "kulup", subject: "Kitap kulübü Kasım buluşması", at: { days: 12, time: "12:30" }, body: ["Kitap kulübü bu ayın seçkisini konuşmak için öğle arasında teras salonunda buluşuyor. Kitabı okumamış olanlar da dinleyici olarak katılabilir."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${M} teklifini güncelle ve gönder`, due: 0, importance: "high", steps: ["Fiyat tablosunu doğrula", "Hukuk onayını al", "Teklifi PDF olarak gönder"], note: "İkinci fabrika için opsiyonel lisans ayrı kalem olacak." },
          { title: `${AL} sözleşme maddelerini gözden geçir`, due: 1, importance: "high", steps: ["Ödeme vadesi", "SLA ceza oranı"] },
          { title: "Q4 hedef sunumunu hazırla", due: 2, steps: ["Rakamları Derya'dan al", "Riskli fırsatlar slaytı", "Selin ile prova yap"] },
          { title: "Ege Tekstil demo senaryosunu Deniz ile netleştir", due: 2 },
          { title: "Haftalık pipeline raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: "Karadeniz Enerji referans görüşmesi için takvim bul", due: 4, importance: "low" },
          { title: "Bölge ziyaret planlarını onayla", due: 5, steps: ["Ankara randevuları", "Eskişehir randevuları"] },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: "Kasım kampanya broşürünü satış ekibiyle paylaş", due: 1, steps: ["Broşürü son kez kontrol et", "Ekip e-postasını yaz"] },
          { title: "Ege Tekstil için referans listesi hazırla", due: 3 },
          { title: "Akdeniz Perakende pilot kapsamını yanıtla", completedDaysAgo: 1 },
          { title: "Kasım kampanya fiyat listesini onayla", completedDaysAgo: 3 },
          { title: `${TY} RFP yanıt dokümanını tamamla`, due: 3, importance: "high", steps: ["14 entegrasyon sorusunu yanıtla", "Elif'ten teknik şemayı al", "Fiyat tablosunu hukuka gönder"], note: "Rakip teklif yaklaşık %12 daha ucuz; toplam sahip olma maliyeti öne çıkarılacak." },
          { title: `${KZ} fiyat revizyonu için Selin'den onay al`, due: 2, importance: "high", note: "Yıllık lisansta %6 iyileştirme talebi; 36 ay taahhüt ve ön ödeme karşılığında düşünülebilir." },
          { title: "CRM'de aşaması güncel olmayan 7 fırsatı düzelt", due: -2, importance: "high" },
          { title: "2027 kota planı taslağına geri bildirim ver", due: 5, steps: ["Bölge dağılımını incele", "Ekibin kotalarını kontrol et", "Notları Selin'e gönder"] },
          { title: `${ET} yeni karar vericisiyle tanışma toplantısı ayarla`, due: 3, importance: "high" },
          { title: "Rakip karşılaştırma kartını ekiple gözden geçir", due: 6, importance: "low" },
          { title: "Yıl sonu kapanış adayı sözleşmelerin listesini Can'a ilet", due: 8 },
          { title: `${KZ} teknik değerlendirme notlarını paylaş`, completedDaysAgo: 4 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile hedef toplantısı", due: 3 },
          { title: "Onur için eğitim planı hazırla", due: 8 },
          { title: "Gizem'in müşteri ilişkileri sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın İzmir–Manisa notlarından fırsat kayıtlarını aç", due: 1, steps: ["3 fırsatı CRM'e gir", "Olasılık ve kapanış tarihlerini belirle"] },
          { title: "Onur ile iş ortağı proje kaydı çakışmasını çöz", due: 1, importance: "high", note: "İlk açılan kayıt korumada; ikinci ortağın itirazı için kanal kuralı emsali netleştirilecek." },
          { title: "Derya ile tahmin tutarsızlıklarını konuş", due: 7 },
          { title: "Gizem için memnuniyet anketi aksiyon planı hazırla", due: 5, steps: ["Düşük puanlı üç müşteriyi belirle", "Arama sorumlularını ata"] },
          { title: "Zeynep'in yıl sonu performans notlarını yaz", due: 9, importance: "low" },
          { title: "Ekip 1:1 notlarını OneNote'a aktar", due: -1, importance: "low", status: "inProgress" },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Araç periyodik bakım randevusu al", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Yıl sonu masraf raporlarını gir", due: 4, importance: "low" },
          { title: "Sunum becerileri atölyesine kayıt ol", due: 6, importance: "low" },
          { title: "Sağlık sigortası için eş ve çocuk ekleme formunu doldur", due: 12, importance: "low" },
        ],
      },
      {
        name: "Müşteri Takibi",
        tasks: [
          { title: `${KE} ilk dönem fatura iskontosunu Can'a teyit et`, due: 0, importance: "high" },
          { title: `${TA} vadesi geçen faturalar için ödeme planını netleştir`, due: 1, importance: "high", steps: ["Dilek Yaman ile görüş", "İki taksitlik planı Can'a ilet", "CRM'e not düş"], note: "Vadesi geçen tutar 0,64 M₺ (47 gün)." },
          { title: `${IA} veri güvenliği sorularını yanıtla`, due: 2, importance: "high", steps: ["KVKK maddelerini özetle", "Yurt içi barındırma seçeneğini yaz", "Güvenlik özetini Elif'ten al"] },
          { title: `${VG} geciken fatura ve genişleme teklifini birlikte yönet`, due: 2, note: "Önce 0,71 M₺'lik açık fatura kapanacak; ardından üç otelli genişleme teklifi (0,9 M₺) gönderilecek." },
          { title: `${MM} yenileme teklifini hazırla`, due: 3, steps: ["Kullanım raporunu çıkar", "Çok yıllı indirim senaryolarını hazırla", "Teklifi Selin ile onayla"], note: "Yıllık lisans 1,4 M₺; müşteri 7/24 destek paketi fiyat farkını da soruyor." },
          { title: "Memnuniyet anketinde düşük puan veren üç müşteriyi ara", due: 3, importance: "high" },
          { title: "90 gün içinde biten 7 sözleşmeyi yenileme takvimine işle", due: -1, status: "inProgress" },
          { title: "Referans müşteri listesini güncelle", due: 6, importance: "low" },
          { title: `${MM} memnuniyet görüşmesi notlarını CRM'e gir`, completedDaysAgo: 1 },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Satış Hedefleri ve Gerçekleşme.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${M} — Teklif v3.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${AL} Sözleşme Taslağı.docx`, folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Pipeline Raporu — Kasım.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 2 },
    { name: "Haftalık Toplantı Notları.docx", folder: "Satış", by: "Ömer Gümüş", daysAgo: 3 },
    { name: "Ürün Fiyat Listesi 2026.xlsx", folder: "Teklifler", by: "Emre Şahin", daysAgo: 4 },
    { name: "Bölge Ziyaret Planı Aralık.xlsx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 5 },
    { name: "Müşteri Referans Kataloğu.pdf", folder: "Teklifler", by: "Emre Şahin", daysAgo: 6 },
    { name: "Ekip Performans Özeti.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 7 },
    { name: "Satış Eğitim Sunumu — Müzakere.pptx", folder: "Satış", by: "Ayşe Demir", daysAgo: 9 },
    { name: `${KZ} — Talep Tahmini Teklifi v2.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${TY} — RFP Yanıt Dokümanı.docx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 2 },
    { name: `${MM} — Yenileme Teklifi.docx`, folder: "Teklifler", by: "Gizem Tunç", daysAgo: 3 },
    { name: `${VG} — Misafir Analitiği Genişleme Teklifi.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 5 },
    { name: `${IA} — Veri Güvenliği Yanıtları.docx`, folder: "Teklifler", by: "Elif Kaya", daysAgo: 5 },
    { name: "Rakip Karşılaştırma Kartı — Q4.pptx", folder: "Satış", by: "Deniz Arslan", daysAgo: 3 },
    { name: "İzmir–Manisa Ziyaret Notları.docx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 6 },
    { name: "Kasım Kampanyası Sonuç Özeti.pptx", folder: "Satış", by: "Emre Şahin", daysAgo: 8 },
    { name: "Sözleşme Şablonu v4.docx", folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 6 },
    { name: "2027 Kota Planı Taslağı.xlsx", folder: "Raporlar", by: "Selin Aydın", daysAgo: 3 },
    { name: "Kanal İş Ortağı Performans Özeti.xlsx", folder: "Raporlar", by: "Onur Polat", daysAgo: 6 },
    { name: "Vadesi Geçen Alacaklar — Kasım.xlsx", folder: "Finans", by: "Can Yıldız", daysAgo: 1 },
    { name: `${TA} — Ödeme Planı Önerisi.xlsx`, folder: "Finans", by: "Can Yıldız", daysAgo: 2 },
    { name: "Yenileme Takvimi 2027.xlsx", folder: "Müşteri Başarı", by: "Gizem Tunç", daysAgo: 4 },
    { name: "Müşteri Memnuniyet Anketi Sonuçları.pdf", folder: "Müşteri Başarı", by: "Gizem Tunç", daysAgo: 4 },
    { name: `${M} — Devreye Alma Planı.xlsx`, folder: "Müşteri Başarı", by: "Mert Aksoy", daysAgo: 7 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${M} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü ve fabrika müdürü.", "İstekler: devreye alma süresini 10 haftadan 8 haftaya çekmek, ikinci fabrika için opsiyonel lisans.", "Sonraki adım: güncellenmiş teklif ve referans görüşmesi."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Pipeline'daki üç riskli fırsat için aksiyon sahipleri belirlendi.", "Kasım kampanyası broşürü Cuma'ya kadar onaylanacak."] },
    { title: "Müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: değer önerisi, referanslar.", "Esneklik alanları: ödeme vadesi, devreye alma takvimi.", "Sınır: SLA cezaları %10'un altına inmez."] },
    {
      title: `${KZ} fiyat görüşmesi hazırlığı`,
      notebook: "Satış",
      section: "Müşteri Notları",
      daysAgo: 2,
      body: [
        "Karar vericiler: satın alma müdürü Ceren Tuncer, finans direktörü ve üretim planlama sorumlusu. Teknik ekip değerlendirmeden memnun; son söz finans direktöründe.",
        "Müşterinin talebi: toplam 1,9 M₺'lik teklifte yıllık lisans bedelinde %6 iyileştirme. Karşılığında 36 aylık taahhüt ve ilk yıl ön ödeme verebileceklerini belirttiler.",
        "Yaklaşım: doğrudan iskonto yerine ilk yıl destek paketi ya da kullanıcı sayısında esneklik önermek. Fiyat kararı Selin Aydın'ın onayından geçecek; kampanya iskontosu (%8) ile birleştirilmeyecek.",
        "Sonraki adım: görüşme öncesi üç senaryoyu tyroPricing'de simüle et.",
      ],
    },
    {
      title: `${TY} RFP değerlendirme notları`,
      notebook: "Satış",
      section: "Müşteri Notları",
      daysAgo: 3,
      body: [
        "RFP'de üç teklif var: bizim satın alma otomasyonu çözümümüz, Pusula Yazılım ve Kuzgun Teknoloji. Değerlendirme ağırlıkları: fiyat %40, entegrasyon %30, devreye alma süresi %20, yerel destek %10.",
        "Pusula'nın fiyatı bizden yaklaşık %12 düşük. Ancak mevcut ERP için hazır bir bağlayıcıları yok; bu bizim en güçlü kanıt noktamız.",
        "Aksiyonlar: entegrasyon şemasını Elif'ten al, Karadeniz Enerji'den referans görüşmesi için izin iste, sunumda üç yıllık toplam sahip olma maliyetini göster.",
      ],
    },
    {
      title: "Rakip analizi — Pusula Yazılım ve Kuzgun Teknoloji",
      notebook: "Satış",
      section: "Rakip Notları",
      daysAgo: 4,
      body: [
        "Pusula Yazılım: liste fiyatı bizden yaklaşık %12 düşük, orta ölçekli firmalara odaklı. Özelleştirme taleplerinde yavaş; devreye alma ortalama 14 hafta sürüyor.",
        "Kuzgun Teknoloji: güçlü bir analitik modülü var ama yapay zekâ özellikleri kapalı kutu; müşteriler tahminlerin gerekçesini göremiyor. Fiyatı bizimle aynı seviyede.",
        "Bizim farkımız: tahmin doğruluğu, onay akışlarının sadeliği (3.4 sürümü) ve yerel destek. İtiraz yanıtları için Deniz'in karşılaştırma kartını kullan.",
      ],
    },
    {
      title: `Yenileme görüşmesi hazırlığı — ${MM}`,
      notebook: "Satış",
      section: "Müşteri Notları",
      daysAgo: 2,
      body: [
        "Yıllık lisans 1,4 M₺ ve bitişe yaklaşık 60 gün var. Kullanım oranı %82; destek kayıtlarında üç açık talep bulunuyor.",
        "Müşteri iki ya da üç yıllık yenileme için indirim, ayrıca 7/24 destek paketi için fiyat farkı soruyor.",
        "Öneri: üç yıllık sözleşmede ilk iki yıl fiyat sabitleme, destek paketi fark bedeliyle. Açık üç talebi görüşme öncesinde kapat.",
      ],
    },
    {
      title: "Tahsilat takibi — vadesi geçen faturalar",
      notebook: "Satış",
      section: "Finans",
      daysAgo: 1,
      body: [
        `Toplam vadesi geçen alacak ${KPI.overdue} M₺: Van Gölü Turizm 0,71 (35 gün), Trakya Ambalaj 0,64 (47 gün), İç Anadolu Sağlık Grubu 0,52 (14 gün), Meriç Medikal 0,41 (21 gün).`,
        "Trakya Ambalaj iki taksit istiyor; Van Gölü sistemsel bir gecikme olduğunu söylüyor. Meriç Medikal yenileme öncesi ödemeyi hızlandıracağını belirtti.",
        "Kural: vadesi 30 günü geçen müşteriye yeni teklif sunmadan önce ödeme planı alınır. Van Gölü'nün genişleme teklifi bu kurala takılıyor.",
      ],
    },
    {
      title: "Ekip 1:1 notları — Kasım",
      notebook: "Satış",
      section: "Toplantı Notları",
      daysAgo: 5,
      body: [
        "Onur: kanal pipeline'ı sağlıklı, iki iş ortağı arasındaki proje kaydı çakışması karar bekliyor. Gelişim ihtiyacı: fiyatlandırma ve müzakere.",
        "Gizem: müşteri ilişkileri sunumu çok iyi geçti, yenileme portföyünü üstleniyor. Düşük puan veren müşterilerle görüşme planı yapılacak.",
        "Derya: raporlama otomasyonu için Elif ile çalışacak; CRM'de güncel olmayan fırsat sayısı yedi. Haftalık raporlama süresi 3 saatten 1 saate inmeli.",
      ],
    },
    {
      title: `${IA} keşif toplantısı notları`,
      notebook: "Satış",
      section: "Müşteri Notları",
      daysAgo: 6,
      body: [
        "Hasta iletişim merkezi günde yaklaşık 1.800 çağrı alıyor; ilk hedef randevu ve sonuç sorgulama çağrılarını asistana devretmek.",
        "Bilgi güvenliği ekibi verinin yurt içinde barınmasını, kişisel verilerin maskelenmesini ve verilerin model eğitiminde kullanılmamasını istiyor. Üç madde yazılı olarak teyit edilecek.",
        "Pilot kapsamı: üç ay, iki şube. Bütçe 1,1 M₺, olasılık %30; karar için yönetim onayı gerekiyor.",
      ],
    },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, fırsatların ve ekibin hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?", "Riskli fırsatlarım hangileri?", "Vadesi geçen alacaklar neler?"],
    },
    answers: [
      // ───── özel konular: genel kalıplardan (fırsat, özet, toplantı…) önce denenir ─────
      {
        match: "risk|kaybedebil|tehlike",
        steps: ["Fırsat kayıtları taranıyor…", "Risk sinyalleri değerlendiriliyor…"],
        text: `**Riskli fırsatlar**\n\nToplam **${KPI.atRisk} M₺** tutarında üç fırsat risk altında (açık pipeline'ın %${KPI.atRiskPct}'i):\n\n| Müşteri | Tutar | Risk | Önerilen aksiyon |\n|---|---|---|---|\n| ${ET} | 2,6 M₺ | Proje sponsoru ayrıldı, karar verici değişti | Yeni yöneticiyle tanışma toplantısı |\n| ${KE} | 2,1 M₺ | Ek modül bütçesi yönetim kurulunda | Onay sonrası takvimi netleştir |\n| ${TY} | 1,8 M₺ | Rakip teklif %12 daha ucuz | Toplam sahip olma maliyeti ve referans |\n\nÜçü için de aksiyon sahipleri haftalık satış toplantısında belirlendi.`,
        chips: ["Rakiplerle durumumuz nasıl?", "Vadesi geçen alacaklar neler?"],
      },
      {
        match: "rakip|rekabet|pusula|kuzgun",
        steps: ["Rakip kayıtları okunuyor…"],
        text: `**Rekabet durumu**\n\nAçık ${KPI.openDeals} fırsatın 14'ünde rakip var (Pusula Yazılım 8, Kuzgun Teknoloji 6).\n\n| Rakip | Güçlü yanı | Zayıf yanı |\n|---|---|---|\n| Pusula Yazılım | Liste fiyatı yaklaşık %12 düşük | Entegrasyon ve yerel destek zayıf, devreye alma ~14 hafta |\n| Kuzgun Teknoloji | Güçlü analitik modülü | Tahmin gerekçesi görünmüyor, yapay zekâ kapalı kutu |\n\nRakipli fırsatlarda kazanma oranımız **%${KPI.winRateComp}**, rakipsizlerde **%${KPI.winRateSolo}** (genel %${KPI.winRate}).\n\nEn kritik karşılaşma ${TY} (Pusula teklifi daha ucuz). Güncel karşılaştırma kartı *Satış* klasöründe; *tyroRadar* rakip hamlelerini izliyor.`,
        chips: ["Riskli fırsatlarım hangileri?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "yenileme|renewal|churn|sözleşme bitiş",
        steps: ["Sözleşme takvimi okunuyor…", "Müşteri sağlık skorları değerlendiriliyor…"],
        text: `**Yenileme görünümü**\n\nÖnümüzdeki 90 günde **${KPI.renewalCount} sözleşme** yenilemeye giriyor; toplam yıllık değer **${KPI.renewals} M₺**.\n\n| Müşteri | Yıllık değer | Kalan süre | Durum |\n|---|---|---|---|\n| ${MM} | 1,4 M₺ | ~60 gün | Çok yıllı sözleşme ve 7/24 destek soruyor |\n| ${TA} | 1,1 M₺ | ~45 gün | Vadesi geçen fatura var, ödeme planı bekliyor |\n| ${VG} | 0,8 M₺ | ~75 gün | Genişleme talebi var, açık fatura nedeniyle bekliyor |\n\nKalan dört sözleşme (toplam 1,9 M₺) düşük riskli. Yenilemesine 60 günden az kalan hesaplarda memnuniyet görüşmesi yapılması gerekiyor.`,
        chips: ["Vadesi geçen alacaklar neler?", "Referans müşterilerim kimler?"],
      },
      {
        match: "referans|başarı hikâye|case study",
        steps: ["Müşteri referans kataloğu okunuyor…"],
        text: `**Referans müşteriler**\n\n| Müşteri | Çözüm | Durum |\n|---|---|---|\n| ${KE} | Raporlama ve analitik | Referans görüşmesine hazır; başarı hikâyesi hazırlanıyor |\n| ${MM} | Lisans | Memnuniyet yüksek; yenileme sonrası istenebilir |\n| ${TA} | Üretim planlama | Üç tesise yayıldı, haber metni yayında; ödeme planı netleşmeden istenmemeli |\n\nSon üç ayda 5 referans görüşmesi yapıldı, 3'ü kazanılan fırsata dönüştü. Referans seçerken sektör ve ölçeği eşleştirmek en iyi sonucu veriyor.`,
        chips: ["Toplantıya nasıl hazırlanayım?", "Müşteri özeti çıkar"],
      },
      {
        match: "tahsilat|\\balacak|\\bvade|geciken|ödeme|fatura",
        steps: ["Finans kayıtları okunuyor…"],
        text: `**Tahsilat durumu**\n\nVadesi geçen toplam alacak **${KPI.overdue} M₺** (${KPI.overdueCount} müşteri):\n\n| Müşteri | Tutar | Gecikme | Durum |\n|---|---|---|---|\n| ${VG} | 0,71 M₺ | 35 gün | Sistemsel gecikme dendi, ödeme bekleniyor |\n| ${TA} | 0,64 M₺ | 47 gün | İki taksitlik plan istedi |\n| ${IA} | 0,52 M₺ | 14 gün | Onay sürecinde |\n| ${MM} | 0,41 M₺ | 21 gün | Yenileme öncesi ödeme sözü verdi |\n\n- ${KE} ilk dönem faturası satış onayı bekliyor (iskonto teyidi sende).\n- 30 günü geçen müşterilere yeni teklif sunmadan önce ödeme planı alınıyor.\n- Aylık satış–finans tahsilat toplantısında bu tablo Can Yıldız ile birlikte gözden geçirilir.`,
        chips: ["Yenileme görünümü nasıl?", "Müşteri özeti çıkar"],
      },
      {
        match: "hazırlan|hazırlık|brif|brief|konuşma noktası",
        steps: ["Takvim ve posta taranıyor…", "Hesap geçmişi okunuyor…"],
        text: `**Toplantı hazırlığı — ${M} teklif sunumu**\n\n**Hedef:** teklifin son hâlini onaylatmak ve devreye alma süresini 10 haftadan 8 haftaya çekme talebine yanıt vermek.\n\n**Karar vericiler:** satın alma direktörü ve fabrika müdürü (ilk muhatabın Hakan Öz).\n\n**Konuşma noktaları**\n- Toplam değer 4,8 M₺; Kasım kampanyasından %8 ek iskonto\n- 8 haftalık takvim için iki ek danışman gerekiyor (yaklaşık 0,18 M₺); fiyatla birlikte konuş\n- İkinci fabrika için opsiyonel lisans ayrı kalem\n\n**Açık konular:** hukuk notları (veri saklama süresi, fikri mülkiyet, cezai şart tavanı).\n\nİstersen ${AL} ya da ${KZ} görüşmesi için de aynı özeti çıkarabilirim.`,
        chips: ["Açık fırsatlarımı özetle", "Riskli fırsatlarım hangileri?"],
      },
      {
        match: "müşteri özet|hesap özet|müşterilerimi özetle|müşteri durum|hesap durum|müşteri portföy",
        steps: ["Hesap kayıtları okunuyor…", "Son yazışmalar ve toplantılar taranıyor…"],
        text: `**Müşteri özeti — öne çıkan hesaplar**\n\n| Müşteri | Çözüm | Tutar | Aşama | Sıradaki adım |\n|---|---|---|---|---|\n| ${M} | Satın alma otomasyonu | 4,8 M₺ | Teklif | Son sunum ve takvim kararı |\n| ${AL} | Filo takip platformu | 3,9 M₺ | Müzakere | Ödeme vadesi ve SLA maddeleri |\n| ${KZ} | Talep tahmini | 1,9 M₺ | Müzakere | Fiyat revizyonu için Selin'in onayı |\n| ${TY} | Satın alma otomasyonu | 1,8 M₺ | Teklif (rekabetli) | RFP yanıt dokümanı |\n| ${TA} | Üretim planlama genişleme | 1,3 M₺ | Sözleşme | Vadesi geçen fatura için ödeme planı |\n| ${IA} | Yapay zekâ asistanı pilotu | 1,1 M₺ | Keşif | Veri güvenliği yazılı yanıtı |\n| ${VG} | Misafir analitiği genişleme | 0,9 M₺ | Teklif | Açık fatura kapandıktan sonra |\n\nTek bir hesabın ayrıntısı için *tyroInsight* uygulamasından hesap özetini açabilirsin.`,
        chips: ["Riskli fırsatlarım hangileri?", "Tahsilat durumu nedir?"],
      },
      {
        match: "tahmin|forecast|öngör",
        steps: ["tyroForecast modeli çalıştırılıyor…"],
        text: `**Q4 kapanış tahmini**\n\ntyroForecast çeyrek sonu için üç senaryo üretiyor:\n\n| Senaryo | Ek kapanış | Toplam | Hedefe oranı |\n|---|---|---|---|\n| Taahhüt (commit) | ${KPI.commit} M₺ | 15,9 M₺ | %88 |\n| En olası | ${KPI.likely} M₺ | ${KPI.forecast} M₺ | %${KPI.forecastPct} |\n| En iyi | ${KPI.best} M₺ | 18,6 M₺ | %103 |\n\nŞu an gerçekleşen **${KPI.achieved} M₺**; hedefe **${KPI.gap} M₺** kaldı. En olası senaryoda açık kalan fark yaklaşık 0,7 M₺.\n\nFarkı kapatmanın en kısa yolu: ${AL}'de imza, ${KZ}'da fiyat onayı ve ${TA} sözleşmesi.`,
        chips: ["Riskli fırsatlarım hangileri?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "iş ortağı|iş ortakları|kanal|entegratör|bayi",
        steps: ["Kanal kayıtları okunuyor…"],
        text: "**İş ortağı (kanal) durumu**\n\nOnur Polat'ın yönettiği kanalda 4 aktif iş ortağı ve toplam **5,4 M₺** pipeline var.\n\n| İş ortağı | Pipeline | Durum |\n|---|---|---|\n| Altınova Entegrasyon | 2,1 M₺ | İki projede kayıt çakışması |\n| Çınar Bilişim Çözümleri | 1,6 M₺ | Sağlıklı, iki teklif aşamasında |\n| Dorukhan Teknoloji | 1,0 M₺ | Kota kullanımı düşük |\n| Eksen Sistem | 0,7 M₺ | Yeni anlaşma, eğitim bekliyor |\n\nÇakışan kayıtta kural gereği ilk açılan proje korumada; ikinci ortağın itirazı için karar bekleniyor.",
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },

      // ───── genel konular ─────
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${KPI.achieved} M₺** / hedef ${KPI.quota} M₺ (**%${KPI.achievedPct}**).\n\n- Açık pipeline: ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Bu ay kapanan: ${KPI.closedThisMonth} M₺\n\nHedefi yakalamak için kalan süredeki en kritik fırsat Marmara Gıda (4,8 M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Çözüm | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${M} | Satın alma otomasyonu | 4,8 M₺ | Teklif | %60 |\n| ${AL} | Filo takip platformu | 3,9 M₺ | Müzakere | %70 |\n| ${ET} | Üretim planlama modülü | 2,6 M₺ | Demo | %40 |\n| ${KE} | Raporlama paketi | 2,1 M₺ | Keşif | %25 |\n| ${AP} | Mağaza analitiği | 1,7 M₺ | Teklif | %55 |\n\nToplam açık pipeline **${KPI.pipeline} M₺**.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:15 Satış günlük 15 dk\n- 14:00 ${M} — teklif sunumu\n\nBu hafta ayrıca ${AL} müzakeresi, Ege Tekstil demosu ve Q4 hedef değerlendirmesi var.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu hafta ${KPI.closedThisMonth} M₺ kapanış gerçekleşti, kazanma oranı %${KPI.winRate}.\n- Bugün ${M} teklif sunumu (14:00), yarın ${AL} sözleşme müzakeresi.\n- Q4 hedef değerlendirmesi yaklaşıyor: sunum hazır değil, görev listende.\n- Riskli fırsatlar: ${ET} (karar verici değişti), ${KE} (bütçe onayı bekliyor).`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Gerçekleşme |\n|---|---|\n| Zeynep Acar | %112 |\n| Kaan Özdemir | %94 |\n| Onur Polat | %88 |\n| Gizem Tunç | %79 |\n| Derya Çelik | %71 |\n\nZeynep hedefi aştı; Derya'nın pipeline'ında iki büyük fırsat kapanış bekliyor.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kasım kampanyası**\n\n- Yıllık sözleşmelerde **%8 ek iskonto**, ilk üç ay ücretsiz destek.\n- Şimdiye kadar 6 teklifte uygulandı; en büyüğü Marmara Gıda (4,8 M₺).\n- Kampanya 30 Kasım'a kadar; iskonto onayı Selin Aydın'da.\n\nFiyat simülasyonu için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 20 gün, kullandığın 8 gün; **kalan 12 gün**. 3 gün onaylı izin planın var, 2 günlük bir talebin yönetici onayında.\n\nYeni izin talebi için *Self Servis*'ten ya da buradan yazabilirsin.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori, tutar ve fişi ekle (fiş okuyucu tutarı kendisi çıkarır)\n3. Gönder; yöneticin onaylar.\n\nŞu an onay bekleyen bir masraf raporun var (HRMS-062344).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **2 onayın** var: Karadeniz Enerji fatura iskontosu ve Onur Polat'ın eğitim talebi.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Satış hedefin, fırsatların, takvimin ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

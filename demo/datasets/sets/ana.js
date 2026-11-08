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
}

const M = "Marmara Gıda Holding"
const AL = "Anadolu Lojistik A.Ş."
const ET = "Ege Tekstil Sanayi"
const KE = "Karadeniz Enerji"
const AP = "Akdeniz Perakende Grubu"

export default defineDataset({
  id: "ana",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Satış hedefi, fırsat ve müşteri sorularını yanıtlar; haftalık özet hazırlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Satış tahmini ve fırsat olasılıkları.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Teklif ve sözleşmeler için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Fiyat ve iskonto simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Müşteri içgörüleri ve hesap özetleri.", icon: "Telescope02Icon" },
    { name: "CRM", type: "business", description: "Müşteri ve fırsat kayıtları", url: "#", icon: "Target02Icon" },
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
    { title: "Bölge müşteri günü — Ankara", day: 8, allDay: true, where: "Ankara", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Ankara bölgesi müşteri ziyaretleri." },
    // geçmiş
    { title: `${KE} — başlangıç toplantısı`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Pelin Yazıcı (${KE})`, "Zeynep Acar"], body: "Proje başlangıcı ve sorumluluk dağılımı." },
    { title: `${AP} — pilot kapsamı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Nehir Sarı (${AP})`, "Deniz Arslan"], body: "Mağaza analitiği pilotunun kapsamı ve başarı ölçütleri." },
    { title: "Ekip 1:1 — Onur Polat", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Hedef, kanal pipeline'ı ve gelişim planı." },
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
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile hedef toplantısı", due: 3 },
          { title: "Onur için eğitim planı hazırla", due: 8 },
          { title: "Gizem'in müşteri ilişkileri sunumunu incele", due: 6, importance: "low" },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Araç periyodik bakım randevusu al", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
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
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${M} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü ve fabrika müdürü.", "İstekler: devreye alma süresini 10 haftadan 8 haftaya çekmek, ikinci fabrika için opsiyonel lisans.", "Sonraki adım: güncellenmiş teklif ve referans görüşmesi."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Pipeline'daki üç riskli fırsat için aksiyon sahipleri belirlendi.", "Kasım kampanyası broşürü Cuma'ya kadar onaylanacak."] },
    { title: "Müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: değer önerisi, referanslar.", "Esneklik alanları: ödeme vadesi, devreye alma takvimi.", "Sınır: SLA cezaları %10'un altına inmez."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, fırsatların ve ekibin hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?"],
    },
    answers: [
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

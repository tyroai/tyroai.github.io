// TEKNOLOJİ veri seti — kurumsal BT satışı. TYRO Tech'in donanım (sunucu, depolama, ağ, cihaz filosu),
// yazılım lisansı, bulut aboneliği ve siber güvenlik paketlerini doğrudan kurumsal satış ve iş ortağı
// (sistem entegratörü) kanalıyla sattığı bir satış yöneticisi haftası.
// Tüm kişi, firma ve rakamlar KURGUSALDIR.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev, takvim ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: 24.0, // Q4 hedefi (milyon TL)
  achieved: 15.1, // gerçekleşen
  achievedPct: 63,
  forecast: 22.4, // ağırlıklı kapanış tahmini
  forecastPct: 93,
  arr: 38.6, // yıllık tekrarlayan gelir
  mrr: 3.2,
  pipeline: 52.4, // açık pipeline (milyon TL)
  openDeals: 27,
  winRate: 28,
  closedThisMonth: 5.4,
  renewals: 9, // 90 gün içinde biten lisans/abonelik sözleşmesi
  renewalValue: 11.6,
  renewalRate: 91,
  channelTotal: 8.7, // kanal (iş ortağı) cirosu
  channelShare: 58,
}
const m = (n) => n.toFixed(1).replace(".", ",") // 15.1 → "15,1"
const gap = m(KPI.quota - KPI.achieved) // "8,9"

// Müşteriler ve iş ortakları
const KF = "Kızılırmak Finans Grubu"
const TT = "Toroslar Telekom"
const UM = "Uludağ Mağazacılık Grubu"
const FS = "Fırat Sağlık Grubu"
const YK = "Yeşilvadi Kamu Hizmetleri Kurumu"
const BE = "Bilgesis Entegrasyon"
const VB = "Veribahar Bilişim"
const CS = "Çınar Sistem Çözümleri"

// Karşı taraftaki kişiler
const TOLGA = `Tolga Erdem (${KF})`
const BURCU = `Burcu Yalçın (${TT})`
const CEM = `Cem Tuna (${UM})`
const SEVGI = `Sevgi Kalkan (${FS})`
const ORHAN = `Orhan Seyhan (${YK})`
const GOKHAN = `Gökhan Tekin (${BE})`
const PINAR = `Pınar Ersoy (${VB})`
const BARIS = `Barış Aktaş (${CS})`

export default defineDataset({
  id: "teknoloji",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Satış hedefi, lisans yenileme, POC ve ihale durumu ile iş ortağı performansı sorularını yanıtlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Lisans yenileme riski ve ARR tahmini.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Teklif, sözleşme ve iş ortağı anlaşmaları için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Donanım, lisans ve abonelik için fiyat ve indirim simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Müşteri kullanım içgörüleri ve hesap sağlığı skoru.", icon: "Telescope02Icon" },
    { name: "tyroRFP", type: "ai", description: "İhale şartnamesi analizi ve teknik yanıt taslağı.", icon: "DocumentValidationIcon" },
    { name: "İş Ortağı Portalı", type: "business", description: "İş ortağı kayıtları, proje koruması ve kota takibi", url: "#", icon: "Package01Icon" },
  ],

  weather: { now: "cloudy", base: 14, amp: 4, moods: ["cloudy", "partlycloudy", "lightrain", "cloudy", "fair", "rain", "partlycloudy", "fog", "cloudy", "fair"] },
  market: { rates: { USD: 44.3, EUR: 51.4, GBP: 58.0, CHF: 54.8 }, bist: 11380 },

  // ───────────── takvim ─────────────
  meetings: [
    {
      title: "Haftalık satış ve forecast toplantısı",
      recur: "weekly",
      weekday: 1,
      time: "09:30",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Geçen haftanın kapanışları, forecast güncellemesi ve yenileme takvimi. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Sabah turu — satış ekibi",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Kısa tur: dünkü gelişmeler, bugünkü müşteri görüşmeleri, onay bekleyen teklifler ve engeller.",
    },
    {
      title: "İş ortağı kanal pipeline görüşmesi",
      recur: "weekly",
      weekday: 3,
      time: "11:30",
      minutes: 45,
      where: "Microsoft Teams",
      organizer: "Onur Polat",
      with: ["Ömer Gümüş", "Zeynep Acar"],
      body: "Üç iş ortağının proje kayıtları, kota kullanımı ve bekleyen siparişler. Çakışan proje kayıtları burada çözülür.",
    },
    {
      title: "Pipeline ve yenileme gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Açık fırsatların aşama ve olasılık kontrolü, 90 gün içinde biten lisans sözleşmeleri ve riskli hesaplar için aksiyon belirlenir.",
    },
    { title: "RFP yanıt hazırlığı — Yeşilvadi Kurumu", day: 0, time: "11:00", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: ["Zeynep Acar", "Deniz Arslan", "Can Yıldız", "Mert Aksoy"], body: "Ağ altyapısı yenileme ihalesinin teknik şartname soruları, teminat mektubu ve teslimat taahhüdü." },
    { title: `${TT} — POC sonuç sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [BURCU, "Zeynep Acar", "Elif Kaya", "Deniz Arslan"], body: "Siber güvenlik paketi POC'unun sonuçları: tehdit tespit süresi, yanlış alarm oranı ve üç yıllık yönetilen hizmet (SOC) opsiyonu." },
    { title: `${KF} — donanım yenileme fiyat müzakeresi`, day: 1, time: "10:30", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Ömer Gümüş", with: [TOLGA, "Zeynep Acar", "Can Yıldız"], body: "Sunucu ve depolama yenilemesinin teslimat süresi, destek bedeli ve iskonto maddeleri." },
    { title: `${BE} — 2027 iş ortağı iş planı`, day: 1, time: "15:30", minutes: 60, where: "Microsoft Teams", organizer: "Onur Polat", with: ["Ömer Gümüş", GOKHAN, "Emre Şahin"], body: "2027 ciro hedefi, pazarlama fonu (MDF) payı ve ortak etkinlik takvimi." },
    { title: "Q4 hedef ve forecast değerlendirmesi", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Çeyrek sonu hedef gerçekleşmesi, yenileme tahmini ve kalan haftaların aksiyon planı." },
    { title: "2027 iş ortağı programı çalıştayı (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Onur Polat", "Emre Şahin", "Deniz Arslan"], body: "Yeni seviye yapısı, proje kayıt koruması ve geri ödeme (rebate) oranlarının ele alınacağı çalıştay. Katılımınızı bekliyoruz." },
    { title: `${FS} — lisans yenileme görüşmesi`, day: 3, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [SEVGI, "Gizem Tunç", "Deniz Arslan"], body: "Kullanım raporu, lisans adedi ve bulut dönüşümü kapsamının yenileme teklifine yansıması." },
    { title: `${UM} — cihaz filosu teklif sunumu`, day: 4, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [CEM, "Zeynep Acar", "Mert Aksoy"], body: "310 mağaza için dizüstü ve el terminali yenilemesi, cihaz yönetimi aboneliği ve kurulum takvimi." },
    { title: "Siber güvenlik çözümleri satış sertifikasyonu", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Gizem Tunç"], body: "TYRO Eğitim: güvenlik paketi satışı, POC yönetimi ve fiyatlandırma. Kontenjan 20 kişi." },
    { title: `${CS} — ortak teklif çalışması`, day: 6, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [BARIS, "Onur Polat"], body: "Sağlık sektörü bulut dönüşümü projesi için uygulama ve devreye alma kapsamı." },
    { title: "Kamu müşteri günü — Ankara", day: 8, allDay: true, where: "Ankara", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Ankara'daki kamu kurumlarına yönelik ürün tanıtımı ve birebir görüşmeler." },
    // geçmiş
    { title: `${YK} — şartname netleştirme toplantısı`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [ORHAN, "Zeynep Acar"], body: "İhale komisyonuyla teknik şartnamedeki belirsiz maddelerin gözden geçirilmesi." },
    { title: `${VB} — Q4 kampanya planı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Onur Polat", with: [PINAR, "Ömer Gümüş", "Emre Şahin"], body: "Çok yıllı sözleşme kampanyasının iş ortağı müşteri adaylarına uygulanması." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Yenileme hesapları, müşteri sağlık skorları ve gelişim planı." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: TOLGA,
      subject: "Re: Veri merkezi donanım yenileme teklifi",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Teknik ekibimiz önerinizi onayladı; sunucu ve depolama konfigürasyonunda değişiklik talebimiz yok. Ticari tarafta iki konu kaldı: teslimat süresinin 10 haftadan 8 haftaya çekilmesi ve üç yıllık destek bedelinde ek %7 iskonto.",
        "Yarınki müzakerede bunları netleştirebilirsek satın alma komitesine bu hafta sunacağız.",
        "İyi çalışmalar.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Q4 forecast sunumu",
      at: { hoursAgo: 4 },
      unread: true,
      body: [
        "Ömer merhaba,",
        `Çeyrek değerlendirmesi için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'ündeyiz (${m(KPI.achieved)} M₺ / ${m(KPI.quota)} M₺); açık pipeline ${m(KPI.pipeline)} M₺, ağırlıklı tahminimiz ${m(KPI.forecast)} M₺.`,
        "Kapanışı en çok etkileyecek üç fırsatı (Kızılırmak donanım, Toroslar güvenlik paketi, Yeşilvadi ihalesi) ve benden istediğin yönetici desteğini ayrıca not düş lütfen.",
      ],
    },
    {
      from: BURCU,
      subject: "POC sonuç sunumu — ek metrikler",
      at: { hoursAgo: 3 },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Bugünkü sunumda ortalama tehdit tespit süresi ile yanlış alarm oranındaki değişimi gösterebilir misiniz? Yönetim kuruluna gidecek rapora bu iki metrik girecek.",
        "Ayrıca üç yıllık yönetilen hizmet (SOC) için fiyat opsiyonunu ayrı bir sayfada görmek isteriz.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: "Yeşilvadi ihalesi — teknik şartname soruları",
      at: { days: 1, time: "17:40" },
      unread: true,
      body: ["Ömer Bey merhaba,", "Şartnamede netleştirme sorusuna çevirdiğim 14 madde var; özellikle yerli üretim oranı ve 4 saatlik müdahale SLA'sı riskli görünüyor. Yarın 11:00'deki hazırlık toplantısından önce on dakika konuşabilir miyiz?"],
    },
    {
      from: "Can Yıldız",
      subject: "Fırat Sağlık — yenileme iskontosu onayı",
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: ["Merhaba Ömer,", "Fırat Sağlık yenilemesinde müşteri %6 iskonto istiyor (yenileme bedeli 1,9 M₺). Marj %31'in altına inmediği için finans tarafında sorun görmüyorum; yalnızca senin satış onayını bekliyorum."],
    },
    {
      from: GOKHAN,
      subject: "2027 iş ortağı iş planı taslağı",
      at: { days: 1, time: "14:20" },
      body: ["Merhaba,", "2027 için 12 M₺ ciro ve 6 yeni kurumsal müşteri hedefli iş planı taslağımızı ekledik. Görüşmede pazarlama fonu (MDF) payı ve ortak etkinlik takvimini konuşmak isteriz; eklemek istediğiniz başlık varsa iletin."],
    },
    {
      from: CEM,
      subject: "Mağaza cihaz filosu — teknik şartname",
      at: { days: 2, time: "16:05" },
      body: ["Ömer Bey,", "Yenileme kapsamı 42 ilde 310 mağaza için 1.240 dizüstü ve el terminali olarak netleşti. Cihaz yönetimi için bulut aboneliği de teklife dahil olsun; beş yıllık garanti ve kurulum hizmetini ayrı kalemler halinde görmek isteriz."],
    },
    {
      from: "Deniz Arslan",
      subject: "Bulut Platformu 5.2 sürüm notları ve sunum güncellemesi",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "5.2 sürümünün yeni özelliklerini (otomatik ölçekleme, güvenlik duvarı entegrasyonu) satış sunumuna ekledim. Fırat Sağlık ve Uludağ görüşmelerinde kullanabilirsin; teknik SSS dosyası paylaşılan klasörde."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 45. hafta",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: ["Merhaba Ömer Bey,", `Bu ay ${m(KPI.closedThisMonth)} M₺ kapanış gerçekleşti; kazanma oranı %${KPI.winRate}, yenileme oranı %${KPI.renewalRate}. Dokuz yenileme sözleşmesinin takvimi rapora eklendi, Fırat Sağlık kırmızı işaretli. Rapor ekte ve paylaşılan klasörde.`],
    },
    {
      from: SEVGI,
      subject: "Lisans yenileme — kullanım raporu",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "Son altı aylık kullanım raporunu inceledik; lisansların yaklaşık %48'i aktif kullanılıyor. Yenilemede lisans adedini azaltıp bulut dönüşümü kapsamını genişletmeyi konuşmak isteriz. Başka bir üreticiden de teklif aldık; bunu şeffaf paylaşmak istedim."],
    },
    {
      from: "Mert Aksoy",
      subject: "Donanım teslimat takvimi ve tedarik süreleri",
      at: { days: 5, time: "13:25" },
      body: ["Ömer,", "Güncel tedarik süreleri: sunucu 8 hafta, depolama dizisi 10 hafta, ağ ve güvenlik cihazları 12 hafta, dizüstü 4 hafta. Kızılırmak için 8 haftalık taahhüt vereceksen üreticiden öncelikli tahsis talebini bu hafta açmam gerekiyor."],
    },
    {
      from: ORHAN,
      subject: "İhale şartnamesi ek açıklaması",
      at: { days: 6, time: "15:40" },
      important: true,
      body: ["Sayın Ömer Gümüş,", "Komisyon, yazılı sorulara verdiği yanıtları ek açıklama olarak yayımlamıştır. Son teklif tarihi 5 iş günü uzatılmıştır; teminat mektubu bedeli teklif tutarının %3'ü olarak kalmıştır."],
    },
    {
      from: PINAR,
      subject: "Q4 kampanyası için kota talebi",
      at: { days: 6, time: "11:00" },
      body: ["Merhaba Ömer Bey,", "Çok yıllı sözleşme kampanyası için ekibimiz 14 müşteri adayı belirledi. Kampanya iskontosunun proje kaydı kapsamında korunmasını ve ek iki lisans paketi kotası tanımlanmasını rica ediyoruz."],
    },
    { from: "Onur Polat", subject: "Kanal ortaklarıyla çeyrek sonu görüşmeleri", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, üç iş ortağıyla çeyrek sonu görüşme planını çıkardım. Çınar Sistem geride kalıyor (hedefin %60'ı); onlarla ortak bir çalıştay önermek istiyorum. Plan ekte, onayınızla takvimleri sabitleyeceğim."] },
    { from: "Emre Şahin", subject: "İş ortağı programı duyurusunun onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, 2027 iş ortağı programı duyurusunun son halini ekledim. Seviye isimleri ve geri ödeme (rebate) oranlarını satış tarafı da bir kez kontrol etsin istedik."] },
    { from: "Elif Kaya", subject: "Yenileme riski modeli demo ortamı hazır", at: { days: 9, time: "16:30" }, body: ["Ömer Bey, yenileme riski tahmin modelinin demo ortamı hazır. Dokuz yenileme sözleşmesi için kullanım ve destek talebi verileri yüklü; sunumlarda kullanabileceğiniz örnek senaryolar da eklendi."] },
    { from: BARIS, subject: "Ortak teklif: sağlık sektörü bulut dönüşümü", at: { days: 10, time: "14:15" }, body: ["Merhaba Ömer Bey,", "Fırat Sağlık projesinde uygulama ve devreye alma hizmetlerini bizim ekibin üstlenmesini öneriyoruz. 12 haftalık devreye alma planı ve kaynak listemiz ekte."] },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları açıklandı", at: { days: 1, time: "09:05" }, body: [`Şirketimiz üçüncü çeyreği geçen yılın aynı dönemine göre %22 büyümeyle tamamladı; yıllık tekrarlayan gelirimiz (ARR) ${m(KPI.arr)} M₺'ye ulaştı.`, "Büyümenin ana kaynakları bulut abonelikleri, siber güvenlik paketleri ve iş ortağı kanalı oldu. Tüm ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "TYRO Bulut Platformu 5.2 sürümü yayında", at: { days: 4, time: "10:20" }, body: ["5.2 sürümüyle otomatik ölçekleme, güvenlik duvarı entegrasyonu ve yeni maliyet raporları kullanıma açıldı.", "Sürüm notları, demo ortamı ve satış sunumu Akademi'de; müşteri duyurusu bu hafta yapılacak."] },
    { feed: "haberler", subject: "İş ortağı programı 2027: yeni seviyeler ve geri ödeme yapısı", at: { days: 6, time: "11:00" }, body: ["2027 iş ortağı programı Stratejik, Gelişmiş ve Temel seviyeleriyle yeniden tasarlandı. Stratejik iş ortakları için proje kaydı koruması 120 güne çıkıyor.", "Geri ödeme oranını sertifikalı mühendis sayısı ve yenileme başarısı belirleyecek. Ayrıntılar İş Ortağı Portalı'nda."] },
    { feed: "haberler", subject: "Sunucu teslim süreleri 8 haftaya geriledi", at: { days: 8, time: "11:00" }, body: ["Üretici tahsislerinin artmasıyla sunucu teslim süreleri 11 haftadan 8 haftaya geriledi; depolama dizilerinde süre 10 hafta, ağ ve güvenlik cihazlarında 12 hafta.", "Güncel liste Operasyon ekibinin paylaşımında; teklif hazırlarken bu süreleri esas alın."] },
    { feed: "duyuru", subject: "Planlı bakım: cumartesi 02:00–04:00 arası VPN ve dosya sunucuları kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–04:00 arasında altyapı bakımı yapılacak. Bu sürede VPN ve dosya sunucularına erişilemeyecek; e-posta ve Teams etkilenmeyecek."] },
    { feed: "duyuru", subject: "Q4 çok yıllı sözleşme kampanyası başladı", at: { days: 6, time: "09:00" }, important: true, body: ["Üç yıllık lisans ve abonelik sözleşmelerinde %9 ek iskonto, donanım ve güvenlik paketlerinde ilk yıl 7/24 destek bedelsiz.", "İskonto onay sınırları: %12'ye kadar satış yöneticisi, üzeri satış direktörü; %18'in üstü finans onayı gerektirir. Ayrıntılar ekteki broşürde."] },
    { feed: "duyuru", subject: "Güvenlik uyarısı: sahte lisans yenileme e-postalarına dikkat", at: { days: 3, time: "14:30" }, body: ["Son günlerde TYRO Tech adına gönderilmiş gibi görünen sahte 'lisans yenileme faturası' e-postaları tespit edildi.", "Bağlantıya tıklamadan önce gönderici alan adını kontrol edin; şüpheli iletileri 'Kimlik avı bildir' düğmesiyle BT Güvenlik'e iletin."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Tuğçe Karaman", at: { days: 3, time: "09:30" }, body: ["Ön satış ekibimize Çözüm Mimarı olarak katılan Tuğçe Karaman'a hoş geldin diyoruz. Daha önce bir sistem entegratöründe sekiz yıl bulut ve güvenlik projeleri yönetti.", "Kendisiyle tanışmak için bu hafta satış ekibiyle kahve molası planlandı; ilk müşteri toplantılarına da katılacak."] },
    { feed: "ik", subject: "Doğum günü: Kaan Özdemir'e iyi ki doğdun", at: { days: 1, time: "08:45" }, body: ["Bölge Satış Temsilcimiz Kaan Özdemir'in bugün doğum günü. İyi ki doğdun Kaan, nice yıllara!", "Pastayı öğleden sonra Maslak ofisindeki ortak alanda birlikte kesiyoruz."] },
    { feed: "ik", subject: "2027 yıllık izin planlama dönemi başladı", at: { days: 9, time: "10:00" }, body: ["2027 yıllık izin planlarınızı ay sonuna kadar yöneticinizle birlikte sisteme girmenizi rica ederiz.", "Çeyrek kapanışı yoğunluğu nedeniyle satış ekibinde Aralık'ın son iki haftasında en fazla iki kişi aynı anda izinli olabilir."] },
    { feed: "egitim", subject: "Siber güvenlik çözümleri satış sertifikasyonu: kayıtlar açık", at: { days: 5, time: "11:15" }, body: ["Satış sertifikasyonu atölyesi önümüzdeki hafta 10:00–13:00 arasında Maslak Eğitim Salonu'nda. Tehdit senaryoları, POC yönetimi ve fiyatlandırma işlenecek; kontenjan 20 kişi.", "Sertifikayı alan satış temsilcileri güvenlik paketi tekliflerinde ön satış desteğine öncelikli erişir."] },
    { feed: "egitim", subject: "Zorunlu eğitim: kişisel verilerin korunması ve siber hijyen", at: { days: 12, time: "09:20" }, body: ["Zorunlu eğitimi bu ay sonuna kadar tamamlamanız gerekiyor. 35 dakikalık modül Akademi'de; tamamlayanlara dijital rozet verilecek."] },
    { feed: "akademi", subject: "Yeni modül: Lisans yenileme görüşmelerinde değer anlatımı", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: kullanım verisiyle yenileme görüşmesi nasıl yönetilir, indirim yerine değer nasıl konuşulur? 28 dakikalık video ve çalışma şablonları."] },
    { feed: "akademi", subject: "Rehber: Bulut dönüşümü projelerinde TCO hesabı", at: { days: 10, time: "11:30" }, body: ["Üç yıllık toplam sahip olma maliyetini (TCO) donanım yenileme ve bulut aboneliği için karşılaştıran rehber ve hesap şablonu yayında. Sağlık ve perakende için hazır senaryolar var."] },
    { feed: "kulup", subject: "TYRO Hack Night: 48 saatlik hackathon için kayıtlar açıldı", at: { days: 3, time: "12:30" }, body: ["Bu yılki temamız 'Yapay zekâ ile yenileme riski tahmini'. Satış, ürün ve mühendislik ekiplerinden karma takımlar (en fazla dört kişi) kurulabilir.", "Kayıt için son gün önümüzdeki hafta Çarşamba; kazanan takım çeyrek sonu müşteri zirvesinde sunum yapacak."] },
    { feed: "kulup", subject: "Cuma akşamı kulüp buluşması: Satranç turnuvası", at: { days: 10, time: "13:00" }, body: ["Satranç kulübü Cuma akşamı Maslak ofisinde hızlı satranç turnuvası düzenliyor. Her seviyeden katılımcı davetlidir, kayıt gerekmez."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${KF} teklifini güncelle ve gönder`, due: 0, importance: "high", steps: ["Donanım fiyat tablosunu doğrula", "%7 ek iskonto için Selin'den onay al", "Teslimat süresini Mert ile teyit et", "Teklifi PDF olarak gönder"], note: "8 hafta teslimat taahhüdü için üreticiden öncelikli tahsis gerekiyor." },
          { title: `${TT} POC sonuç sunumunu tamamla`, due: 0, importance: "high", steps: ["Tehdit tespit süresi grafiğini ekle", "Yanlış alarm karşılaştırmasını ekle", "Üç yıllık SOC fiyat opsiyonunu hazırla"] },
          { title: "Yeşilvadi ihalesi teknik cevaplarını Deniz ile kapat", due: 2, importance: "high", steps: ["Teknik uygunluk matrisi", "Referans proje listesi", "Teminat mektubu için Can'a bilgi ver"] },
          { title: "Fırat Sağlık yenileme iskontosunu onayla", due: 1, importance: "high", note: "Can Yıldız faturalama için satış onayını bekliyor." },
          { title: "Haftalık pipeline raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: "Q4 forecast sunumunu hazırla", due: 2, steps: ["Rakamları Derya'dan al", "Riskli üç fırsat slaytı", "Selin ile prova yap"] },
          { title: "Uludağ Mağazacılık teknik şartname yanıtını hazırla", due: 3 },
          { title: "Bilgesis iş ortağı iş planı taslağını gözden geçir", due: 1 },
          { title: "Lisans yenileme radarını güncelle", due: 4 },
          { title: "Çınar Sistem ile ortak teklif şablonunu onayla", due: 5 },
          { title: "Veribahar kota talebine yanıt ver", due: 3 },
          { title: "Q4 kampanya iskonto onay matrisini ekiple paylaş", due: 1 },
          { title: "Güvenlik paketi referans müşteri listesini hazırla", due: 6, importance: "low" },
          { title: "Kızılırmak ön teknik görüşme notlarını paylaş", completedDaysAgo: 1 },
          { title: "Q4 kampanya fiyat listesini onayla", completedDaysAgo: 3 },
          { title: "Toroslar Telekom POC kapsam yazısını gönder", completedDaysAgo: 6 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Onur ile kanal hedefi ve MDF planı görüşmesi", due: 3 },
          { title: "Gizem için çözüm satışı eğitim planı hazırla", due: 8 },
          { title: "Derya'nın yenileme raporu şablonunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın bölge ziyaret raporunu onayla", due: 2 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Bulut satış sertifika sınavına çalış", due: 9, importance: "low" },
          { title: "Araç muayene randevusu al", due: 7, importance: "low" },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Hedef-Gerçekleşme ve ARR Takibi.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${KF} — Donanım Yenileme Teklifi v4.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${TT} — POC Sonuç Raporu.pdf`, folder: "POC", by: "Elif Kaya", daysAgo: 1 },
    { name: `${YK} — Şartname ve Teknik Cevaplar.docx`, folder: "İhaleler", by: "Zeynep Acar", daysAgo: 2 },
    { name: "Lisans Yenileme Takvimi 2026-2027.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 2 },
    { name: "İş Ortağı Performans Raporu — Kasım.xlsx", folder: "Kanal", by: "Onur Polat", daysAgo: 3 },
    { name: "Kurumsal Fiyat Listesi — Donanım ve Lisans.xlsx", folder: "Teklifler", by: "Emre Şahin", daysAgo: 4 },
    { name: "Fırat Sağlık — Kullanım Analizi.csv", folder: "Müşteriler", by: "Gizem Tunç", daysAgo: 4 },
    { name: `${BE} — İş Ortağı Sözleşmesi.docx`, folder: "Sözleşmeler", by: "Onur Polat", daysAgo: 5 },
    { name: "Tedarik Süreleri ve Stok Durumu.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 5 },
    { name: "Siber Güvenlik Paketi — Satış Sunumu.pptx", folder: "Satış", by: "Deniz Arslan", daysAgo: 6 },
    { name: "Ekip Performans Özeti — Q4.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 7 },
    { name: "Referans Müşteri Kataloğu — Teknoloji.pdf", folder: "Teklifler", by: "Emre Şahin", daysAgo: 9 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${KF} — görüşme notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: BT altyapı direktörü, bilgi güvenliği müdürü ve satın alma komitesi.", "Kapsam: üç veri merkezi için sunucu ve depolama yenilemesi, üç yıllık 7/24 destek. İstekler: teslimat süresini 10 haftadan 8 haftaya çekmek, destek bedelinde ek %7 iskonto.", "Sonraki adım: güncellenmiş teklif, teslimat taahhüdü ve bir referans müşteri ziyareti."] },
    { title: `${TT} — POC başarı ölçütleri`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: ["Başarı ölçütleri: ortalama tehdit tespit süresi 30 dakikanın altına inmeli, yanlış alarm oranı en az %50 düşmeli.", "Sonuç: tespit süresi 38 dakikadan 7 dakikaya indi, yanlış alarmlar %61 azaldı. Müşteri yönetim kurulu raporu için ek metrik istiyor.", "Ticari: üç yıllık yönetilen SOC hizmeti ayrı fiyatlandırılacak; mevcut güvenlik lisansı yenilemesi yeni pakete çevrilebilir."] },
    { title: "Yeşilvadi ihalesi — kritik noktalar", notebook: "Satış", section: "Teklif ve İhale", daysAgo: 5, body: ["Son teklif tarihi 5 iş günü uzatıldı. Teminat mektubu teklif bedelinin %3'ü (yaklaşık 192 bin ₺).", "Riskli maddeler: yerli üretim oranı, 4 saatlik müdahale SLA'sı, beş yıllık yedek parça taahhüdü.", "Rakipler: iki yerli entegratör teklif verecek; fiyat yerine referans projeler ve devreye alma süresiyle ayrışmalıyız."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 4, body: ["Fırat Sağlık yenilemesi için kullanım iyileştirme planı ve Gizem'in hesap sorumluluğu netleşti.", "Çınar Sistem için ortak çalıştay Onur'un takviminde; Veribahar kota talebi Can ile değerlendirilecek."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! Takvim, izin, masraf ve onay işlerinde yanındayım. Bugün sana nasıl yardımcı olabilirim?",
      chips: ["İzin bakiyem kaç gün?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Onay bekleyen işlerim var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Hedefin, pipeline'ın, lisans yenilemelerin ve iş ortağı performansı hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Lisans yenileme riskleri neler?", "İş ortağı performansı nasıl?", "Haftalık satış özeti hazırla"],
    },
    answers: [
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…", "ARR ve pipeline hesaplanıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${m(KPI.achieved)} M₺** / hedef ${m(KPI.quota)} M₺ (**%${KPI.achievedPct}**). Ağırlıklı kapanış tahmini: **${m(KPI.forecast)} M₺** (%${KPI.forecastPct}).\n\n- ARR: ${m(KPI.arr)} M₺ (aylık ${m(KPI.mrr)} M₺ MRR)\n- Açık pipeline: ${m(KPI.pipeline)} M₺ (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Yaklaşan lisans yenilemesi: ${KPI.renewals} sözleşme, ${m(KPI.renewalValue)} M₺\n\nKalan ${gap} M₺ için en kritik fırsat Kızılırmak Finans donanım yenilemesi (9,6 M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Lisans yenileme riskleri neler?"],
      },
      {
        match: "lisans|yenileme|renewal|\\barr\\b|\\bmrr\\b|abonelik",
        steps: ["Sözleşme takvimi okunuyor…", "Kullanım ve risk skorları hesaplanıyor…"],
        text: `**Lisans yenileme radarı (90 gün)**\n\n${KPI.renewals} sözleşme, toplam **${m(KPI.renewalValue)} M₺** yenileme bedeli. Yenileme oranı %${KPI.renewalRate} (hedef %93).\n\n| Müşteri | Ürün | Bedel | Kalan süre | Risk |\n|---|---|---|---|---|\n| ${TT} | Güvenlik lisansı | 3,1 M₺ | 30 gün | Düşük |\n| ${FS} | Bulut ve güvenlik aboneliği | 1,9 M₺ | 45 gün | **Yüksek** |\n| ${UM} | Cihaz yönetimi aboneliği | 2,2 M₺ | 60 gün | Orta |\n| ${KF} | Depolama destek sözleşmesi | 1,6 M₺ | 75 gün | Düşük |\n\nDiğer 5 sözleşme toplam 2,8 M₺. Fırat Sağlık'ta lisansların yalnızca %48'i kullanılıyor ve müşteri rakip teklif aldı; lisans adedini azaltıp bulut kapsamını büyütmek en güçlü karşı hamle görünüyor.`,
        chips: ["POC durumu nedir?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "poc|kavram kanıt|pilot",
        steps: ["POC kayıtları okunuyor…"],
        text: "**Aktif POC'lar**\n\n| Müşteri | Kapsam | Durum | Bitiş |\n|---|---|---|---|\n| Toroslar Telekom | Siber güvenlik paketi ve SOC | Tamamlandı, sonuç sunumu bugün 14:00 | — |\n| Fırat Sağlık Grubu | Hastane bulut dönüşümü (3 uygulama) | Devam ediyor, %60 | 8 gün |\n| Uludağ Mağazacılık Grubu | Mağaza cihaz yönetimi | Planlandı | Gelecek ay |\n\nToroslar sonuçları: ortalama tehdit tespit süresi **38 dakikadan 7 dakikaya** indi, yanlış alarmlar **%61** azaldı. Müşteri ek olarak üç yıllık yönetilen SOC fiyatını bekliyor.",
        chips: ["Açık fırsatlarımı özetle", "İhale durumu nedir?"],
      },
      {
        match: "ihale|rfp|\\brfi\\b|şartname|yeşilvadi",
        steps: ["İhale dosyası okunuyor…"],
        text: "**Yeşilvadi Kurumu ağ altyapısı ihalesi (6,4 M₺)**\n\n- Komisyon son teklif tarihini 5 iş günü uzattı; kalan süre yaklaşık 12 iş günü.\n- Teminat mektubu teklif bedelinin %3'ü (yaklaşık 192 bin ₺); Can Yıldız bankayla yazışıyor.\n- Riskli maddeler: yerli üretim oranı, 4 saatlik müdahale SLA'sı, 5 yıllık yedek parça taahhüdü.\n- İki yerli entegratör rakip olarak bekleniyor.\n\nBugün 11:00'de RFP yanıt hazırlığı toplantısı var. Teknik uygunluk matrisini *tyroRFP* ile ön doldurabilirsin.",
        chips: ["Açık fırsatlarımı özetle", "Bu hafta toplantılarım neler?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Çözüm | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${KF} | Veri merkezi donanım yenileme | 9,6 M₺ | Müzakere | %65 |\n| ${TT} | Siber güvenlik paketi ve yönetilen SOC | 7,8 M₺ | POC | %50 |\n| ${YK} | Ağ altyapısı yenileme (ihale) | 6,4 M₺ | İhale | %35 |\n| ${UM} | Cihaz filosu ve bulut aboneliği | 4,9 M₺ | Teklif | %55 |\n| ${FS} | Hastane bulut dönüşümü | 4,2 M₺ | POC | %45 |\n\nToplam açık pipeline **${m(KPI.pipeline)} M₺** (${KPI.openDeals} fırsat).`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "iş ortağı|iş ortakları|kanal|entegratör|reseller|bayi",
        steps: ["İş ortağı portalı okunuyor…", "Kota kullanımı hesaplanıyor…"],
        text: `**İş ortağı performansı (Q4)**\n\n| İş ortağı | Ciro | Hedef | Gerçekleşme |\n|---|---|---|---|\n| ${BE} | 4,6 M₺ | 4,5 M₺ | %102 |\n| ${VB} | 2,9 M₺ | 3,5 M₺ | %83 |\n| ${CS} | 1,2 M₺ | 2,0 M₺ | %60 |\n\nKanal toplam cirosu **${m(KPI.channelTotal)} M₺**; bu, toplam gerçekleşmenin %${KPI.channelShare}'i. Bilgesis hedefi aştı, Çınar Sistem geride; Onur Polat ortak bir çalıştay planlıyor.`,
        chips: ["Ekip performansı nasıl?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "stok|tedarik|teslimat|teslim süresi|sevkiyat|donanım",
        steps: ["Tedarik verileri okunuyor…"],
        text: "**Güncel tedarik süreleri**\n\n- Sunucu: 8 hafta\n- Depolama dizisi: 10 hafta\n- Ağ ve güvenlik cihazları: 12 hafta\n- Dizüstü ve el terminali: 4 hafta\n\nKızılırmak Finans 8 haftalık teslimat istiyor; depolama için bu, üreticiden öncelikli tahsis (allocation) alınırsa mümkün. Mert Aksoy talebi bu hafta açmayı bekliyor, senin teyidin gerek.",
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: "**Bugünkü programın**\n\n- 09:15 Sabah turu — satış ekibi\n- 11:00 RFP yanıt hazırlığı — Yeşilvadi Kurumu\n- 14:00 Toroslar Telekom — POC sonuç sunumu\n\nYarın Kızılırmak Finans fiyat müzakeresi (10:30) ve Bilgesis iş planı görüşmesi (15:30) var. 2027 iş ortağı programı çalıştayı davetine henüz yanıt vermedin.",
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu ay ${m(KPI.closedThisMonth)} M₺ kapanış gerçekleşti, kazanma oranı %${KPI.winRate}.\n- Bugün Toroslar POC sonuç sunumu (14:00), yarın Kızılırmak Finans fiyat müzakeresi.\n- Çeyrek değerlendirmesi için forecast sunumu henüz hazır değil; görev listende.\n- Riskli hesaplar: Fırat Sağlık yenilemesi (kullanım %48, rakip teklif) ve Yeşilvadi ihalesi (yerli üretim maddesi).`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Odak | Gerçekleşme |\n|---|---|---|\n| Onur Polat | Kanal satışı | %104 |\n| Zeynep Acar | Kurumsal hesaplar | %92 |\n| Kaan Özdemir | Bölge satışı | %77 |\n| Derya Çelik | Yenileme ve operasyon | %69 |\n| Gizem Tunç | Müşteri ilişkileri | %58 |\n\nOnur hedefi aştı; kanal siparişleri güçlü. Gizem'in hesaplarında yenileme görüşmelerini öne almak iyi olur.",
        chips: ["Bu çeyrek hedef durumum nedir?", "İş ortağı performansı nasıl?"],
      },
      {
        match: "kampanya|iskonto|indirim|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Q4 çok yıllı sözleşme kampanyası**\n\n- Üç yıllık lisans ve abonelik sözleşmelerinde **%9 ek iskonto**; donanım ve güvenlik paketlerinde ilk yıl 7/24 destek bedelsiz.\n- Şimdiye kadar 7 teklifte uygulandı; en büyüğü Kızılırmak Finans (9,6 M₺).\n- Onay sınırı: %12'ye kadar sen, %12–18 arası Selin Aydın, %18 üzeri finans (Can Yıldız) onayı.\n- Kampanya 15 Aralık'a kadar.\n\nKızılırmak'ta kampanya iskontosu ve istenen ek %7 birlikte %16 ediyor; bu yüzden Selin'in onayı gerekiyor. Simülasyon için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 22 gün, kullandığın 11 gün; **kalan 11 gün**. 4 gün onaylı izin planın var, 1 günlük bir talebin yönetici onayında.\n\nÇeyrek sonu nedeniyle Aralık'ın son iki haftasında ekipte en fazla iki kişi izinli olabilir. Yeni talep için *Self Servis*'ten ya da buradan yazabilirsin.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori, tutar ve fişi ekle (fiş okuyucu tutarı kendisi çıkarır)\n3. Müşteri ziyareti ise firma adını açıklamaya yaz; gönder, yöneticin onaylar.\n\nŞu an onay bekleyen bir masraf raporun var (Ankara müşteri ziyareti, 2.180 ₺).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **3 onayın** var: Fırat Sağlık yenileme iskontosu (%6), Gizem Tunç'un satış sertifikasyonu eğitim talebi ve Kaan Özdemir'in bölge ziyaret masrafı.\n\nKızılırmak Finans teklifindeki toplam %16 iskonto ise Selin Aydın'ın onayında.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Hedefini, fırsatlarını, lisans yenilemelerini, iş ortağı performansını ya da izin ve masraf işlerini sorabilirsin.",
  },
})

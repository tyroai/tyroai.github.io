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
  forecastLow: 19.6, // temkinli senaryo (Kızılırmak geliri kısmen Q1'e kayarsa)
  forecastHigh: 24.3, // iyimser senaryo (Toroslar SOC sözleşmesi de Q4'te imzalanırsa)
  arrCloud: 17.4, // ARR kırılımı: bulut + güvenlik + destek + yönetilen hizmet = 38,6
  arrSecurity: 9.2,
  arrSupport: 6.7,
  arrManaged: 5.3,
  nrr: 106, // net gelir tutma oranı (%)
  atRiskArr: 4.1, // yüksek ve orta riskli yenilemeler (Fırat 1,9 + Uludağ 2,2)
  cloudCommit: 11.4, // bulut aboneliği tüketim taahhüdü (milyon TL)
  cloudUsedPct: 76, // taahhüdün tüketilen payı
  rfpOpen: 3, // açık ihale / RFP / RFI dosyası
  rfpValue: 12.3, // 6,4 + 3,6 + 2,3
}
const m = (n) => n.toFixed(1).replace(".", ",") // 15.1 → "15,1"
const gap = m(KPI.quota - KPI.achieved) // "8,9"
const pct = (n, of) => Math.round((n / of) * 100)
const arrPct = (n) => pct(n, KPI.arr)

// Müşteriler ve iş ortakları
const KF = "Kızılırmak Finans Grubu"
const TT = "Toroslar Telekom"
const UM = "Uludağ Mağazacılık Grubu"
const FS = "Fırat Sağlık Grubu"
const YK = "Yeşilvadi Kamu Hizmetleri Kurumu"
const BE = "Bilgesis Entegrasyon"
const VB = "Veribahar Bilişim"
const CS = "Çınar Sistem Çözümleri"
const EE = "Ege Enerji Dağıtım"
const KL = "Karadağ Lojistik"
const AE = "Akdeniz Eğitim Kurumları"
const ZS = "Zümrüt Sigorta"
const AB = "Altınoluk Bilişim"
const MS = "Meridyen Sistem"

// Karşı taraftaki kişiler
const TOLGA = `Tolga Erdem (${KF})`
const BURCU = `Burcu Yalçın (${TT})`
const CEM = `Cem Tuna (${UM})`
const SEVGI = `Sevgi Kalkan (${FS})`
const ORHAN = `Orhan Seyhan (${YK})`
const GOKHAN = `Gökhan Tekin (${BE})`
const PINAR = `Pınar Ersoy (${VB})`
const BARIS = `Barış Aktaş (${CS})`
const HULYA = `Hülya Sönmez (${EE})`
const MURAT = `Murat Kılınç (${KL})`
const NILUFER = `Nilüfer Başaran (${AE})`
const ASLI = `Aslı Koçer (${ZS})`
const SERKAN = `Serkan Ayhan (${AB})`
const CEREN = `Ceren Taşkın (${MS})`

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
    { name: "tyroPOC", type: "ai", description: "POC planı, başarı ölçütü takibi ve sonuç raporu taslağı.", icon: "ChartHistogramIcon" },
    { name: "tyroChannel", type: "ai", description: "İş ortağı kota kullanımı, proje kaydı çakışması ve MDF önerileri.", icon: "AiBrain02Icon" },
    { name: "tyroAkademi", type: "ai", description: "Ürün ve satış eğitimi için soru-cevap koçu; teklif öncesi hızlı bilgi tazeleme.", icon: "AiBookIcon" },
    { name: "Teklif Konfigüratörü", type: "business", description: "Donanım, lisans ve abonelik teklifi hazırlama; iskonto onay akışı", url: "#", icon: "AddInvoiceIcon" },
    { name: "Sipariş ve Stok Takibi", type: "business", description: "Üretici siparişleri, depo stoğu ve sevkiyat durumu", url: "#", icon: "CargoShipIcon" },
    { name: "Self Servis", type: "business", description: "İzin, masraf ve onay işlemleri", url: "#", icon: "Office365Icon" },
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

    // ───── tekrarlı toplantılar (ek) ─────
    {
      title: "Ön satış ve çözüm mimarisi senkronu",
      recur: "weekly",
      weekday: 2,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Deniz Arslan",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Elif Kaya"],
      body: "Açık POC ve ihalelerin teknik kaynak ihtiyacı, demo ortamı rezervasyonları ve yeni sürüm değişikliklerinin müşteri tekliflerine etkisi.",
    },
    {
      title: "Tedarik ve teslimat durum toplantısı",
      recur: "weekly",
      weekday: 5,
      time: "10:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Derya Çelik", "Can Yıldız"],
      body: "Onaylı siparişlerin üretici durumu, gecikme riskleri, tahsis talepleri ve faturalama takvimi.",
    },
    {
      title: "Aylık müşteri başarı ve hesap sağlığı değerlendirmesi",
      recur: "monthly",
      dom: 12,
      time: "11:00",
      minutes: 60,
      where: "Maslak · Toplantı Odası 2",
      organizer: "Gizem Tunç",
      with: ["Ömer Gümüş", "Derya Çelik", "Deniz Arslan", "Elif Kaya"],
      body: "Kullanım verisi, destek talebi ve memnuniyet skorlarına göre hesap sağlığı puanları; yenilemesi yaklaşan riskli hesaplar için aksiyon listesi.",
    },

    // ───── gelecek (ek) ─────
    { title: "Fiyat ve iskonto onay komitesi", day: 1, time: "16:30", minutes: 45, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Kızılırmak Finans teklifindeki toplam %16 iskonto ve Uludağ cihaz filosu teklifindeki %8 iskonto onay sınırlarına göre değerlendirilir; kampanya iskonto matrisi gözden geçirilir." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 2, time: "11:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "Bölge ziyaret planı, hedefin %77'sinde kalan portföy için aksiyonlar ve Ankara kamu müşteri günü hazırlığı." },
    { title: `${EE} — trafo merkezi ağ güvenliği ön analiz görüşmesi`, day: 3, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [HULYA, "Zeynep Acar", "Deniz Arslan"], body: "11 trafo merkezinin ağ segmentasyonu, uç nokta koruma ve 7/24 izleme ihtiyaçları; RFP kapsamındaki belirsiz maddelerin ön değerlendirmesi." },
    { title: `${KL} — el terminali ve depo yönetimi demosu`, day: 3, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [MURAT, "Kaan Özdemir", "Deniz Arslan"], body: "36 depo için dayanıklı el terminali, bulut tabanlı cihaz yönetimi ve vardiya bazlı lisanslama senaryosunun canlı gösterimi." },
    { title: `${ZS} — yedekleme ve felaket kurtarma POC başlangıcı`, day: 4, time: "14:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [ASLI, "Deniz Arslan", "Mert Aksoy"], body: "On iş günü sürecek POC'un kapsamı: 180 sanal sunucunun yedeklenmesi, 2 saatin altında geri dönüş hedefi ve test planı." },
    { title: "Ekip 1:1 — Onur Polat", day: 4, time: "16:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Kanal hedefinin %104'te kalmasını sürdürme planı, Meridyen Sistem değerlendirmesi ve 2027 MDF kurgusu." },
    { title: `${MS} — iş ortağı değerlendirme görüşmesi`, day: 5, time: "16:30", minutes: 45, where: "Microsoft Teams", organizer: "Onur Polat", with: ["Ömer Gümüş", CEREN, "Emre Şahin"], body: "Aday iş ortağının sertifikalı mühendis sayısı, referans projeleri ve ilk iki çeyrek için proje kaydı beklentileri." },
    { title: `${TT} — yönetilen SOC sözleşme ve fiyat görüşmesi`, day: 6, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [BURCU, "Zeynep Acar", "Can Yıldız"], body: "POC sonrası üç yıllık yönetilen SOC opsiyonu: hizmet seviyeleri, aylık sabit bedel ve mevcut güvenlik lisansı yenilemesinin yeni pakete dönüştürülmesi." },
    { title: "Güvenlik ürün yol haritası brifingi (davet)", day: 6, time: "14:00", minutes: 60, where: "Microsoft Teams", organizer: "Deniz Arslan", status: "notResponded", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Gizem Tunç"], body: "Önümüzdeki iki çeyrekte yayımlanacak güvenlik paketi özellikleri, fiyatlandırma değişiklikleri ve müşteri sunumlarında kullanılabilecek mesajlar. Katılımınızı bekliyoruz." },
    { title: `${EE} — RFP soru-cevap oturumu`, day: 7, time: "14:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [HULYA, "Zeynep Acar", "Deniz Arslan"], body: "Yazılı soruların sözlü olarak netleştirilmesi, teknik değerlendirme ölçütleri ve son teklif tarihinin teyidi." },
    { title: "Ekip 1:1 — Derya Çelik", day: 7, time: "10:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "Yenileme radarındaki eksik kullanım verileri, hedefin %69'unda kalan portföy ve operasyon iş yükü dengesi." },
    { title: `${FS} — hastane bulut dönüşümü POC kapanış değerlendirmesi`, day: 9, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [SEVGI, "Gizem Tunç", "Deniz Arslan", "Elif Kaya"], body: "Üç uygulamanın başarı kriterlerine göre sonuçları: yanıt süresi, kesinti süresi ve veri taşıma doğruluğu. Karar süreci ve yenileme teklifiyle birleşimi." },
    { title: `${AE} — öğretmen cihazı ve sınıf ekranı keşif toplantısı`, day: 10, time: "10:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [NILUFER, "Kaan Özdemir", "Mert Aksoy"], body: "12 kampüste ilk faz kapsamı, cihaz yönetimi aboneliği ve ders dönemi başlamadan teslimat takvimi." },
    { title: `${KF} — sözleşme ve imza toplantısı`, day: 10, time: "14:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Ömer Gümüş", with: [TOLGA, "Can Yıldız", "Zeynep Acar"], body: "Fiyat müzakeresinden sonra sözleşme maddeleri, teslimat taahhüdü ve e-imza sürecinin tamamlanması." },
    { title: `${AB} — iş ortağı sertifikasyonu ve proje kaydı eğitimi`, day: 11, time: "10:00", minutes: 90, where: "Maslak · Eğitim Salonu", organizer: "Onur Polat", with: ["Ömer Gümüş", SERKAN, "Deniz Arslan"], body: "Yeni iş ortağının satış ve teknik sertifikasyon yol haritası, proje kaydı koruma kuralları ve İş Ortağı Portalı kullanımı." },
    { title: "Satış ekibi çeyrek planlama günü", day: 12, allDay: true, where: "Maslak · Konferans Salonu", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"], body: "2027 hedeflerinin kırılımı, hesap planları ve iş ortağı kota dağıtımı için tam günlük çalıştay." },

    // ───── geçmiş (ek) ─────
    { title: `${ZS} — yedekleme çözümü demo oturumu`, day: -1, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [ASLI, "Deniz Arslan"], body: "Yedekleme ve geri dönüş senaryolarının canlı gösterimi; müşteri iki haftalık bir POC talep etti." },
    { title: `${FS} — POC ara değerlendirme`, day: -6, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [SEVGI, "Gizem Tunç", "Deniz Arslan"], body: "Üç hastane uygulamasından ikisinin buluta taşınması tamamlandı; performans ölçümleri ve kalan uygulamanın takvimi." },
    { title: "Ekip 1:1 — Zeynep Acar", day: -4, time: "10:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Kurumsal hesap portföyü (hedefin %92'si), ihale iş yükü ve gelişim hedefleri." },
    { title: `${KL} — ilk tanışma görüşmesi`, day: -5, time: "11:30", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [MURAT, "Kaan Özdemir"], body: "Depo ve sevkiyat operasyonlarındaki cihaz ihtiyaçlarının ilk keşfi; müşteri 36 depo için yenileme planlıyor." },
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

    // ───── ek yazışmalar: yeni müşteri ve iş ortakları, iç yazışmalar ─────
    {
      from: HULYA,
      subject: "RFP yayımlandı: trafo merkezi ağ segmentasyonu ve 7/24 izleme",
      at: { hoursAgo: 1 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Ağ segmentasyonu, uç nokta koruma ve 7/24 izleme kapsamındaki RFP dosyamızı bu sabah davet ettiğimiz üç firmaya ilettik. Yazılı sorularınızı 6 iş günü içinde, tekliflerinizi ise 15 iş günü içinde bekliyoruz.",
        "Kurum bütçemiz 3,2–3,8 M₺ aralığında. Yalnızca ürün listesini değil, devreye alma planını ve yönetilen izleme hizmetinin fiyatını da ayrı kalemler halinde görmek isteriz.",
      ],
    },
    {
      from: ASLI,
      subject: "Yedekleme POC'u için başarı ölçütlerimiz",
      at: { days: 1, time: "09:40" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Dünkü demo oturumu için teşekkür ederiz. İç değerlendirmemizde iki ölçüt belirledik: tam geri dönüşte hedef süre (RTO) 2 saatin altında, günlük yedek penceresi ise 4 saatin altında olmalı.",
        "Test için iki haftalık süre bize uygun. Sonuçları risk komitemize sunacağız; karar süreci en az 4 hafta sürer.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Fırat Sağlık — kullanım iyileştirme planı taslağı",
      at: { days: 2, time: "14:40" },
      unread: true,
      body: [
        "Ömer Bey merhaba,",
        "Sevgi Kalkan ile yaptığım çalışmaya dayanarak lisans kullanımını %48'den %65'e çıkarmak için üç adımlı bir plan hazırladım: kullanılmayan lisansların bölümlere göre yeniden dağıtımı, iki bölüm için uygulama eğitimi ve aylık kullanım raporunun müşteriyle paylaşılması.",
        "Plan ekteki sunumda. Yenileme görüşmesinden önce gözden geçirmenizi ve planın müşteriye sizin ağzınızdan anlatılmasını öneririm.",
      ],
    },
    {
      from: MURAT,
      subject: "Depo cihaz yenilemesi — ihtiyaç listemiz",
      at: { days: 3, time: "10:10" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "36 deposundaki operasyon için 760 el terminali, 120 araç üstü terminal ve 85 dizüstü bilgisayar planlıyoruz. Vardiya bazlı lisanslama ve bulut tabanlı cihaz yönetimi için fiyat görmek isteriz.",
        "Demo oturumuna bir depo operatörünün de katılmasını rica ederim; arayüzü sahadaki kullanım gözüyle değerlendirmek istiyoruz.",
      ],
    },
    {
      from: NILUFER,
      subject: "Öğretmen cihazı ve sınıf ekranı projesi — bütçe ve süreç",
      at: { days: 4, time: "14:35" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "12 kampüsümüzde öğretmen dizüstüleri, sınıf ekranları ve cihaz yönetimi için ilk faz bütçemiz 2,3 M₺. Satın alma usulüne henüz karar verilmedi; ön bilgi talebimize (RFI) ay sonuna kadar yanıt vermenizi rica ederiz.",
        "Cihazların ders dönemi başlamadan teslim edilmesi bizim için kritik. Gerçekçi bir teslimat takvimi görmek isteriz.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Uludağ cihaz filosu teklifi — marj analizi",
      at: { days: 2, time: "12:05" },
      flagged: true,
      body: [
        "Ömer merhaba,",
        "Uludağ teklifinde donanım marjı %22, cihaz yönetimi aboneliği marjı %44 çıkıyor. İstenen %8 iskontoyla birleşik marj %27'ye düşüyor; finans taban limiti %25 olduğu için onayda sorun yok, yalnızca iskonto sınırını bir kademe aşmamaya dikkat edelim.",
        "Satış onayını iletirsen teklif kaydını finans sisteminde onaylı olarak işaretlerim.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Depo stok sayımı sonuçları ve rezerve cihazlar",
      at: { days: 3, time: "11:45" },
      body: [
        "Ömer,",
        "Sayım tamamlandı: depoda 14 sunucu (6'sı rezerve), 220 dizüstü, 90 el terminali ve 7 güvenlik duvarı cihazı var; depolama dizisi stoğumuz yalnızca 2 adet ve ikisi de rezerve.",
        "Uludağ ve Karadağ tekliflerinde dizüstü ve el terminali için stoktan ayırma yapmamı istersen onay vermen yeterli; kalan miktar için üreticiye 4 haftalık sipariş geçeceğim.",
      ],
    },
    {
      from: "Ayşe Demir",
      subject: "Satış sertifikasyonu eğitim talebi onayınızı bekliyor",
      at: { days: 3, time: "16:15" },
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "Gizem Tunç'un siber güvenlik çözümleri satış sertifikasyonu için eğitim talebi yönetici onayınızı bekliyor. Kontenjan 20 kişi ve 14'ü doldu; son kayıt günü atölyeden iki iş günü önce.",
        "Onayınızı sistemden verebilir ya da bu iletiye yanıt yazabilirsiniz.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: "Siber güvenlik paketleri — güncel fiyat sayfası ve lisanslama kuralları",
      at: { days: 4, time: "09:10" },
      body: [
        "Ömer,",
        "Temel, Gelişmiş ve Yönetilen paketlerin yeni fiyat sayfası paylaşılan klasörde. Liste fiyatları cihaz başına yıllık: Temel 640 ₺, Gelişmiş 1.450 ₺. Yönetilen pakette Gelişmiş lisansa ek olarak aylık 118 bin ₺ sabit hizmet bedeli var.",
        "Üç yıllık sözleşmelerde Q4 kampanyasının %9 iskontosu uygulanabiliyor ve ilk yıl 7/24 destek bedelsiz. Toroslar'ın SOC teklifinde bu tabloyu kullanabilirsin.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Yönetim kurulu sunumu için müşteri başarı hikâyeleri",
      at: { days: 4, time: "10:40" },
      body: [
        "Ömer merhaba,",
        "Çeyrek sonu yönetim kurulu sunumuna iki başarı hikâyesi koymak istiyorum: Toroslar Telekom POC sonuçları ve Bilgesis ile kanal büyümesi. Müşteri adını kullanmak için yazılı izin gerekiyor; Burcu Yalçın'dan onay almanı rica ederim.",
        "Her hikâye için tek slayt yeterli: durum, çözüm ve ölçülebilir sonuç.",
      ],
    },
    {
      from: SERKAN,
      subject: "İş ortağı programı başvuru dosyamız",
      at: { days: 5, time: "09:35" },
      body: [
        "Merhaba Ömer Bey,",
        "TYRO iş ortağı programına başvuru dosyamızı ilettik: 4 sertifikalı mühendisimiz, tamamlanmış 3 kurumsal referans projemiz ve 2027 için 2,4 M₺ ciro hedefimiz var.",
        "Proje kaydı koruma süresi ve ilk dönem paket kotası hakkında bilgi alabilir miyiz? Sertifikasyon eğitimine tüm mühendislerimizle katılmak istiyoruz.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "İş ortağı kota kullanımı ve Çınar'dan Veribahar'a devir önerisi",
      at: { days: 5, time: "15:45" },
      flagged: true,
      body: [
        "Ömer Bey,",
        "Güncel durum: Bilgesis 18 paket kotasının 16'sını kullandı, Veribahar 10 paketin tamamını kullandı ve iki ek paket istiyor, Çınar Sistem ise 8 paketin yalnızca 3'ünü kullanıyor.",
        "Çınar'ın boştaki paketlerinden ikisini bu çeyrek için Veribahar'a devretmeyi öneriyorum; böylece ek kota onayı beklemeden kampanya başlayabilir. Devir için senin ve Selin Aydın'ın onayı gerekiyor.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "Yenileme radarı — eksik kullanım verileri",
      at: { days: 6, time: "13:00" },
      body: [
        "Merhaba Ömer Bey,",
        "Uludağ Mağazacılık'ın cihaz yönetimi aboneliğinde son 30 günlük kullanım verisi sisteme düşmemiş; Elif Kaya'dan veri aktarımını yeniden çalıştırmasını istedim. Veri gelene kadar hesabı orta risk olarak işaretli bıraktım.",
        "Veri düşük kullanım gösterirse risk seviyesi yükselecek ve bitişe 60 gün kala indirim konuşması gerekebilir.",
      ],
    },
    {
      from: CEREN,
      subject: "Referans proje listemiz",
      at: { days: 6, time: "16:50" },
      body: [
        "Merhaba Ömer Bey,",
        "Değerlendirme görüşmesinden önce referans projelerimizi paylaşıyorum: iki bankada ağ güvenliği yenilemesi ve bir üniversitede veri merkezi taşıma projesi. Şu an 2 sertifikalı mühendisimiz var, yıl sonuna kadar sayıyı 3'e çıkaracağız.",
        "Sertifikasyon takvimini ve kota beklentimizi görüşmede konuşabiliriz.",
      ],
    },
    {
      from: "Elif Kaya",
      subject: "Yenileme riski modeli — Fırat Sağlık sonucu",
      at: { days: 7, time: "11:20" },
      important: true,
      body: [
        "Ömer Bey,",
        "Model Fırat Sağlık için yenileme risk skorunu 82/100 (yüksek) olarak hesapladı. Başlıca etkenler: lisans kullanımı %48, son 90 günde destek talepleri üç kat artmış ve sözleşme sahibi yöneticinin değişmiş olması.",
        "Aynı veri setinde bulut kapsamını genişleten hesapların yenileme olasılığı belirgin biçimde yüksek çıkıyor. Bu bulgu, Gizem'in hazırladığı kullanım iyileştirme planını destekliyor.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "Kamu müşteri günü — katılımcı listesi ve sunum planı",
      at: { days: 7, time: "17:05" },
      body: [
        "Ömer Bey,",
        "Ankara'daki etkinliğe 14 kurumdan 22 katılımcı onay verdi. Ağ altyapısı ve güvenlik paketi için iki ayrı masa kuracağız. Deniz'den 15 dakikalık bir ürün demosu rica ediyorum.",
        "Sunum akışını birlikte gözden geçirebilir miyiz?",
      ],
    },
    {
      from: TOLGA,
      subject: "Referans müşteri ziyareti için tarih önerisi",
      at: { days: 8, time: "09:25" },
      body: [
        "Merhaba Ömer Bey,",
        "Satın alma komitemiz önerdiğiniz sunucu ve depolama konfigürasyonunu çalışan bir üretim ortamında görmek istiyor. Sizin seçeceğiniz bir referans müşterinin veri merkezini iki kişilik heyetle ziyaret edebiliriz.",
        "Uygun iki tarih ve ziyaret edilecek kurumu iletirseniz komitenin takvimine işleriz.",
      ],
    },
    {
      from: BURCU,
      subject: "Mevcut güvenlik lisansının yeni pakete dönüştürülmesi",
      at: { days: 8, time: "11:50" },
      body: [
        "Merhaba Ömer Bey,",
        "Mevcut güvenlik lisansımızın (3,1 M₺) yenileme tarihi yaklaşıyor. Satın alma ekibimiz yenilemeyi Gelişmiş paket ve yönetilen SOC opsiyonuyla tek sözleşmede birleştirmeye sıcak bakıyor.",
        "Hukuk ekibimiz sözleşme taslağını inceleyebilmek için en az iki hafta önceden almak istiyor; takvimi buna göre kuralım.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Çeyrek sonu müşteri zirvesi: konuşmacı ve demo alanı planı",
      at: { days: 9, time: "14:50" },
      body: [
        "Ömer merhaba,",
        "Zirvede iki müşteri oturumu ve demo alanında bir güvenlik paketi standı planlıyoruz. Konuşmacı olabilecek iki müşteri önerebilir misin? Toroslar Telekom'un POC hikâyesi ilk aklıma gelen.",
        "Program taslağını yakında kesinleştireceğiz; önerini bekliyorum.",
      ],
    },
    {
      from: ORHAN,
      subject: "Teklif zarfının teslim şekli ve içeriği",
      at: { days: 9, time: "10:35" },
      important: true,
      body: [
        "Sayın Ömer Gümüş,",
        "Teklifler kapalı zarf içinde ve imzalı olarak kurum arşivine elden ya da taahhütlü posta ile teslim edilmelidir; elektronik teslim kabul edilmez. Zarfta teknik teklif, fiyat teklifi, teminat mektubunun aslı ve imza sirküleri bulunmalıdır.",
        "Sorularınızı yalnızca ihale biriminin resmî e-posta adresine iletiniz.",
      ],
    },
    {
      from: SEVGI,
      subject: "Hastane bulut dönüşümü POC'u — kapanış kriterleri",
      at: { days: 11, time: "15:25" },
      body: [
        "Merhaba Ömer Bey,",
        "POC kapanışında karar sürecinin işlemesi için üç uygulamanın başarı kriterlerini yazılı hale getirmek istiyoruz: sistem yanıt süresi, kesinti süresi ve veri taşıma doğruluğu.",
        "Bilgi işlem müdürümüz kapanış toplantısına katılacak; sonuçları ona doğrudan sunmanız faydalı olur.",
      ],
    },

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

    // ───── Keşfet akışı (ek) ─────
    { feed: "haberler", subject: "Yönetilen güvenlik hizmeti (SOC) operasyon merkezi üçüncü vardiyaya geçti", at: { days: 2, time: "10:10" }, body: ["7/24 izleme hizmetimizi veren SOC ekibi üçüncü vardiyanın eklenmesiyle 24 kişiye ulaştı; yönetilen hizmet kullanan müşteri sayımız 31 oldu.", "Yeni vardiya düzeniyle ortalama olay müdahale süremizi 22 dakikadan 14 dakikaya indirmeyi hedefliyoruz. Satış ekibi için hizmet seviyeleri özeti Akademi'de."] },
    { feed: "haberler", subject: "Pazar araştırması: kurumsal BT bütçelerinde bulut ve abonelik payı %41'e çıktı", at: { days: 9, time: "09:50" }, body: ["TYRO Pazar Araştırması'nın 2026 raporuna göre kurumsal BT bütçelerinde bulut ve abonelik payı %41'e ulaştı; siber güvenlik harcamaları ise bir önceki yıla göre %19 arttı.", "Raporun sektör kırılımları satış ekipleri için hazırlandı; özellikle sağlık ve perakendede abonelik modeline geçiş hızı dikkat çekiyor."] },
    { feed: "duyuru", subject: "Yıl sonu envanter sayımı: depo sevkiyatları iki iş günü duracak", at: { days: 5, time: "13:40" }, body: ["Yıl sonu envanter sayımı nedeniyle Gebze deposundan iki iş günü boyunca sevkiyat yapılamayacak. Acil sevkiyat gerektiren siparişleri önceden Mert Aksoy'a bildirin.", "Sayım öncesi onaylı siparişlerin çıkışını tamamlamak için teslimat planınızı gözden geçirmenizi rica ederiz."] },
    { feed: "duyuru", subject: "Teklif Konfigüratörü 3.4 yayında: iskonto onay akışı entegre edildi", at: { days: 7, time: "09:30" }, body: ["Yeni sürümde iskonto onay sınırları teklif ekranına bağlandı; %12'yi aşan iskontolarda onay talebi otomatik olarak satış direktörüne, %18'i aşanlarda finansa gidiyor.", "Eski teklif şablonları ay sonunda kapanacak. Açık tekliflerinizi yeni şablona taşımak için Operasyon ekibinden destek isteyebilirsiniz."] },
    { feed: "duyuru", subject: "Kurumsal VPN sertifikaları yenileniyor: cihazınızı güncelleyin", at: { days: 8, time: "15:10" }, body: ["VPN istemci sertifikaları 48 saat içinde yenilenecek. Sürenin sonunda güncellenmemiş cihazlar uzaktan erişimde bağlantı hatası verecek.", "Güncelleme için Self Servis'ten 'Sertifika güncelle' bağlantısını kullanın; sorun yaşarsanız BT Destek ile iletişime geçin."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Barkın Soylu", at: { days: 6, time: "09:20" }, body: ["Operasyon ekibimize Tedarik Planlama Uzmanı olarak katılan Barkın Soylu'ya hoş geldin diyoruz. Daha önce bir dağıtım firmasında sipariş ve stok planlaması yönetti.", "Barkın, üretici tahsisleri ve teslimat takvimi konusunda Mert Aksoy ile birlikte çalışacak; satış ekibiyle tanışma kahvesi bu ay içinde yapılacak."] },
    { feed: "ik", subject: "Doğum günü: Mert Aksoy'a iyi ki doğdun", at: { days: 6, time: "08:50" }, body: ["Operasyon Müdürümüz Mert Aksoy'a yeni yaşında sağlık ve başarılar diliyoruz. İyi ki doğdun Mert, nice yıllara!", "Kutlama pastası Maslak ofisindeki ortak alanda öğle arasında kesilecek."] },
    { feed: "ik", subject: "Özel sağlık sigortası: aile bireyi ekleme dönemi ay sonunda kapanıyor", at: { days: 11, time: "10:15" }, body: ["Özel sağlık sigortası kapsamına eş ve çocuk ekleme dönemi ay sonunda kapanacak. Başvurular Self Servis üzerinden yapılıyor.", "Dönem dışında yapılacak eklemelerde bekleme süresi uygulanacağı için gerekli belgeleri önceden hazırlamanızı öneririz."] },
    { feed: "egitim", subject: "Bulut Platformu 5.2 teknik sunum eğitimi: iki oturum", at: { days: 7, time: "14:20" }, body: ["Ürün ekibi 5.2 sürümünün satış ve demo senaryolarını iki ayrı oturumda anlatacak. Her oturum 90 dakika sürecek ve çevrim içi yapılacak.", "Katılımcılar otomatik ölçekleme ve maliyet raporlarını canlı demoda deneyebilecek; kayıtlar Akademi'de saklanacak."] },
    { feed: "egitim", subject: "Teklif ve iskonto onayı atölyesi: yeni satış temsilcileri için", at: { days: 9, time: "11:40" }, body: ["Teklif Konfigüratörü kullanımı, iskonto onay sınırları ve sözleşme sürecini anlatan iki saatlik atölye Maslak Eğitim Salonu'nda yapılacak.", "Kontenjan 15 kişiyle sınırlı. Atölye sonunda katılımcılar örnek bir teklifi baştan sona hazırlayacak."] },
    { feed: "egitim", subject: "Liderlik gelişim programı başvuruları açıldı", at: { days: 13, time: "09:45" }, body: ["Yeni yöneticiler ve yönetici adayları için altı aylık liderlik programı başlıyor. Program atölyeler, mentorluk ve bir uygulama projesinden oluşuyor.", "Başvurular iki hafta açık; yönetici onayı gerekiyor."] },
    { feed: "akademi", subject: "Yeni modül: POC yönetimi ve başarı ölçütü belirleme", at: { days: 6, time: "15:00" }, body: ["Akademi'ye eklenen 32 dakikalık modül, POC kapsamının nasıl daraltılacağını, başarı ölçütlerinin müşteriyle yazılı olarak nasıl netleştirileceğini ve sonuç sunumunun nasıl kurgulanacağını anlatıyor.", "Modülle birlikte örnek POC planı ve sonuç raporu şablonu da yayımlandı."] },
    { feed: "akademi", subject: "Rehber: İhale şartnamesi okuma ve teknik uygunluk matrisi hazırlama", at: { days: 12, time: "10:30" }, body: ["Şartnamedeki riskli maddeleri (yerli üretim oranı, SLA, teminat) ayıklamayı ve teknik uygunluk matrisini doğru doldurmayı anlatan 20 sayfalık rehber yayında.", "Kamu ve büyük kurumsal ihalelerden alınan gerçek soru-cevap örnekleri ekte."] },
    { feed: "akademi", subject: "Podcast serisi 'Sahadan Satış': üçüncü bölüm yayında", at: { days: 14, time: "12:00" }, body: ["Bu bölümde iki kıdemli satış yöneticisi, çok yıllı sözleşmelerde indirim yerine değer konuşmanın yollarını anlatıyor. Süre 24 dakika.", "Bölüm Akademi'den dinlenebilir; dinleme notları ve tartışma soruları açıklamada."] },
    { feed: "kulup", subject: "Fotoğraf kulübü: Maslak'ta gün batımı yürüyüşü", at: { days: 8, time: "16:30" }, body: ["Fotoğraf kulübü iş çıkışında Maslak çevresinde bir gün batımı yürüyüşü düzenliyor. Her seviyeden katılımcı davetli, ekipman getirmek zorunlu değil.", "Çekilen kareler kulübün ortak albümünde paylaşılacak; seçkiden bir kare ofis duvarında sergilenecek."] },
    { feed: "kulup", subject: "Gönüllülük: köy okullarına yenilenmiş dizüstü bağış kampanyası", at: { days: 10, time: "11:00" }, body: ["Ömrünü tamamlamış ancak çalışan kurumsal dizüstüler yenilenerek köy okullarına bağışlanacak. Kampanya için BT ekibi cihazları güvenli biçimde temizleyip hazırlıyor.", "Kargo ve kurulum günü için gönüllü arıyoruz; katılmak isteyenler kulüp kanalından yazabilir."] },
    { feed: "kulup", subject: "Koşu kulübü: yıl sonu 10 km etkinliği", at: { days: 12, time: "13:30" }, body: ["Koşu kulübü yıl sonu 10 km koşusuna kayıt alıyor. Hazırlık için her hafta sonu ortak antrenman yapılacak; hız seviyesine göre gruplar oluşturulacak.", "Katılım ücretsiz, forma ve başlangıç paketi kulüp tarafından karşılanacak."] },
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
          { title: "Çeyrek sonu müşteri ziyaret planını Selin'e gönder", due: -2, importance: "high" },
          { title: "Ege Enerji RFP yazılı sorularını hazırla ve gönder", due: 4, importance: "high", steps: ["Şartnamedeki belirsiz maddeleri listele", "Ağ segmentasyonu varsayımlarını Deniz ile doğrula", "Soruları kurumun belirttiği kanaldan ilet"], note: "Yazılı sorular için süre 6 iş günü." },
          { title: "Zümrüt Sigorta yedekleme POC başarı ölçütlerini yazıya dök", due: 2, steps: ["RTO 2 saat ve yedek penceresi 4 saat ölçütlerini ekle", "Test ortamı erişimlerini tanımla", "POC planını müşteriyle paylaş"] },
          { title: "Toroslar Telekom yönetilen SOC sözleşme taslağını hukuka gönder", due: 3, importance: "high", steps: ["Hizmet seviyelerini (SLA) listele", "Aylık sabit bedeli finansla doğrula", "Taslağı hukuka ilet"], note: "Müşteri hukuku taslağı en az iki hafta önceden istiyor." },
          { title: "Fırat Sağlık kullanım iyileştirme planını müşteriyle paylaş", due: 2, importance: "high", steps: ["Gizem'in plan sunumunu gözden geçir", "Sevgi Kalkan ile görüşme ayarla", "Planı aylık kullanım raporuna bağla"] },
          { title: "Karadağ Lojistik el terminali fiyat teklifini hazırla", due: 5 },
          { title: "Akdeniz Eğitim RFI yanıtını gözden geçir", due: 7, note: "Müşteri yanıtı ay sonuna kadar bekliyor." },
          { title: "Uludağ cihaz filosu teklifi için %8 iskonto notunu kaydet", due: 1 },
          { title: "Kızılırmak'a referans müşteri ziyareti için iki tarih öner", due: 3 },
          { title: "Yeşilvadi şartname netleştirme toplantı notlarını paylaş", completedDaysAgo: 1 },
          { title: "Uludağ ön fiyat çalışmasını tamamla", completedDaysAgo: 4 },
          { title: "Fırat Sağlık kullanım raporunu analiz et", completedDaysAgo: 5 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Onur ile kanal hedefi ve MDF planı görüşmesi", due: 3 },
          { title: "Gizem için çözüm satışı eğitim planı hazırla", due: 8 },
          { title: "Derya'nın yenileme raporu şablonunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın bölge ziyaret raporunu onayla", due: 2 },
          { title: "Gizem'in satış sertifikasyonu eğitim talebini onayla", due: 1, importance: "high" },
          { title: "Derya'nın yenileme radarı veri kalitesi sorunlarını çözmesine yardım et", due: 4 },
          { title: "Kaan'ın Ankara kamu müşteri günü sunum planını onayla", due: 6, importance: "low" },
          { title: "Zeynep ile 1:1 notlarını ve gelişim hedeflerini kaydet", completedDaysAgo: 4 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Bulut satış sertifika sınavına çalış", due: 9, importance: "low" },
          { title: "Araç muayene randevusu al", due: 7, importance: "low" },
          { title: "Kurumsal VPN sertifikasını yenile", due: 1 },
          { title: "Sağlık sigortası aile bireyi ekleme formunu doldur", due: 9, importance: "low" },
        ],
      },
      {
        name: "İş Ortakları",
        tasks: [
          { title: "2027 iş ortağı programı çalıştayı davetine yanıt ver", due: 0 },
          { title: "Kanal çeyrek sonu görüşme takvimini onayla", due: -1, note: "Onur onayımı bekliyor; takvimleri sabitleyecek." },
          { title: "Çınar'dan Veribahar'a paket devrini Selin ile onaylat", due: 1, importance: "high" },
          { title: "Bilgesis 2027 iş planına MDF payı önerisini hazırla", due: 2, importance: "high", steps: ["12 M₺ ciro hedefinin çeyrek kırılımını incele", "MDF payı için üç senaryo hazırla", "Onur ile gözden geçir"] },
          { title: "Altınoluk Bilişim iş ortağı sözleşmesini hukuka gönder", due: 4 },
          { title: "Meridyen Sistem referans projelerini incele", due: 4 },
          { title: "Çınar Sistem ortak çalıştay gündemini hazırla", due: 5, steps: ["Hedefin %60'ında kalma nedenlerini listele", "Üç hedef hesap belirle", "Takvim önerisini Onur'a ilet"] },
          { title: "Altınoluk Bilişim için portal erişimlerini aç", due: 8, importance: "low" },
          { title: "Bilgesis çakışan proje kayıtlarını çöz", completedDaysAgo: 2 },
          { title: "Veribahar Q4 kampanya planı notlarını paylaş", completedDaysAgo: 1 },
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
    { name: `${EE} — RFP Şartnamesi ve Soru Listesi.docx`, folder: "İhaleler", by: "Zeynep Acar", daysAgo: 0 },
    { name: `${ZS} — Yedekleme POC Planı.docx`, folder: "POC", by: "Deniz Arslan", daysAgo: 1 },
    { name: `${TT} — Yönetilen SOC Sözleşme Taslağı.docx`, folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 2 },
    { name: "Fırat Sağlık — Kullanım İyileştirme Planı.pptx", folder: "Müşteriler", by: "Gizem Tunç", daysAgo: 2 },
    { name: "Bulut Tüketim Taahhüdü Takibi.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 3 },
    { name: `${KL} — El Terminali İhtiyaç Listesi.xlsx`, folder: "Müşteriler", by: "Kaan Özdemir", daysAgo: 3 },
    { name: "Depo Stok Sayımı ve Rezerve Cihazlar.xlsx", folder: "Operasyon", by: "Mert Aksoy", daysAgo: 3 },
    { name: "Siber Güvenlik Paketleri — Fiyat Sayfası.xlsx", folder: "Teklifler", by: "Deniz Arslan", daysAgo: 4 },
    { name: `${AE} — RFI Yanıt Taslağı.docx`, folder: "İhaleler", by: "Kaan Özdemir", daysAgo: 4 },
    { name: "İş Ortağı Kota Kullanım Tablosu.xlsx", folder: "Kanal", by: "Onur Polat", daysAgo: 5 },
    { name: `${AB} — Başvuru Dosyası.pdf`, folder: "Kanal", by: "Onur Polat", daysAgo: 5 },
    { name: `${MS} — Referans Proje Listesi.pdf`, folder: "Kanal", by: "Onur Polat", daysAgo: 6 },
    { name: "İskonto Onay Matrisi — Q4 Kampanya.pdf", folder: "Satış", by: "Can Yıldız", daysAgo: 6 },
    { name: "Yenileme Risk Skorları.csv", folder: "Raporlar", by: "Elif Kaya", daysAgo: 7 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${KF} — görüşme notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: BT altyapı direktörü, bilgi güvenliği müdürü ve satın alma komitesi.", "Kapsam: üç veri merkezi için sunucu ve depolama yenilemesi, üç yıllık 7/24 destek. İstekler: teslimat süresini 10 haftadan 8 haftaya çekmek, destek bedelinde ek %7 iskonto.", "Sonraki adım: güncellenmiş teklif, teslimat taahhüdü ve bir referans müşteri ziyareti."] },
    { title: `${TT} — POC başarı ölçütleri`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: ["Başarı ölçütleri: ortalama tehdit tespit süresi 30 dakikanın altına inmeli, yanlış alarm oranı en az %50 düşmeli.", "Sonuç: tespit süresi 38 dakikadan 7 dakikaya indi, yanlış alarmlar %61 azaldı. Müşteri yönetim kurulu raporu için ek metrik istiyor.", "Ticari: üç yıllık yönetilen SOC hizmeti ayrı fiyatlandırılacak; mevcut güvenlik lisansı yenilemesi yeni pakete çevrilebilir."] },
    { title: "Yeşilvadi ihalesi — kritik noktalar", notebook: "Satış", section: "Teklif ve İhale", daysAgo: 5, body: ["Son teklif tarihi 5 iş günü uzatıldı. Teminat mektubu teklif bedelinin %3'ü (yaklaşık 192 bin ₺).", "Riskli maddeler: yerli üretim oranı, 4 saatlik müdahale SLA'sı, beş yıllık yedek parça taahhüdü.", "Rakipler: iki yerli entegratör teklif verecek; fiyat yerine referans projeler ve devreye alma süresiyle ayrışmalıyız."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 4, body: ["Fırat Sağlık yenilemesi için kullanım iyileştirme planı ve Gizem'in hesap sorumluluğu netleşti.", "Çınar Sistem için ortak çalıştay Onur'un takviminde; Veribahar kota talebi Can ile değerlendirilecek."] },
    { title: `${EE} — RFP değerlendirme notları`, notebook: "Satış", section: "Teklif ve İhale", daysAgo: 0, body: ["Kapsam: 11 trafo merkezinde ağ segmentasyonu, uç nokta koruma ve 7/24 izleme. Bütçe aralığı 3,2–3,8 M₺; değerlendirme ölçütü %60 teknik, %40 fiyat.", "Yazılı sorular için 6, teklif için 15 iş günü var. Açık noktalar: sahadaki eski kontrol cihazlarının uyumluluğu, izleme hizmetinin saha dışından verilmesi ve devreye alma sırasında üretim kesintisi toleransı.", "Strateji: yönetilen izleme için Toroslar POC sonuçlarını referans olarak kullan. Deniz ile ağ segmentasyonu mimarisini ilk iş olarak çıkar; fiyatı ürün, devreye alma ve izleme olarak üç kaleme ayır."] },
    { title: `${ZS} — yedekleme demo oturumu notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Katılımcılar: bilgi güvenliği müdürü, altyapı lideri ve risk komitesi temsilcisi. Müşteri 180 sanal sunucunun yedeklenmesini ve felaket kurtarma planının testini istiyor.", "Başarı ölçütleri: tam geri dönüşte hedef süre (RTO) 2 saatin altında, günlük yedek penceresi 4 saatin altında. İki haftalık POC üzerinde anlaşıldı.", `Ticari: ilk teklif üç yıllık abonelik. Mevcut bulut taahhüdü (1,1 M₺, tüketim %58) ile birleştirilirse tüketim eksiği kapanır. Karar süreci en az 4 hafta sürecek.`] },
    { title: "Fırat Sağlık — yenileme stratejisi", notebook: "Satış", section: "Müşteri Notları", daysAgo: 2, body: ["Durum: lisans kullanımı %48, müşteri başka bir üreticiden teklif aldığını şeffaf biçimde paylaştı. Yenileme bedeli 1,9 M₺, kalan süre 45 gün; model risk skoru 82/100.", "Strateji: fiyat savaşına girmeden lisans adedini azalt, bulut dönüşümü kapsamını büyüt. Gizem'in kullanım iyileştirme planı (aktif kullanımı %65'e çıkarma) müşteriye bizzat sunulacak.", "İskonto: talep edilen %6 marjı %31'in altına indirmiyor, onay sende. Karşılığında iki yıllık sözleşme ve bulut dönüşümü POC'unun kapanışında karar şartı istenecek."] },
    { title: "Kanal toplantısı — kota ve proje kaydı kararları", notebook: "Satış", section: "Toplantı Notları", daysAgo: 2, body: ["Veribahar'ın iki ek paket talebi için Çınar'ın boştaki iki paketinin 90 günlüğüne geçici devri değerlendirildi; karar Selin'in onayına sunulacak.", "Bilgesis'te çakışan iki proje kaydı çözüldü: kayıt tarihi erken olan iş ortağı korundu. Stratejik seviyede proje kaydı koruması 120 güne çıkıyor.", "Altınoluk Bilişim başvurusu uygun bulundu. Meridyen Sistem için sertifikalı mühendis sayısı 3'e çıkana kadar aday statüsü sürecek."] },
    { title: "Yeni müşteri adayları — ilk görüşme notları", notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: [`${KL}: 36 depo, 760 el terminali ve 120 araç üstü terminal planlanıyor. Karar verici operasyon direktörü; vardiya bazlı lisanslama ve sahada dayanıklılık önceliği taşıyor. Mevcut cihazlar beş yıllık.`, `${AE}: 12 kampüs, ilk faz bütçesi 2,3 M₺. Satın alma usulü belirsiz, RFI yanıtı ay sonuna kadar bekleniyor. Cihazların ders dönemi başlamadan teslimi kritik.`, "Ortak nokta: iki müşteri de cihaz yönetimi aboneliği istiyor. Abonelik gelirini ARR'ye eklemek için donanım ve abonelik tek paket teklifle sunulmalı."] },
    { title: "Güvenlik paketi fiyatlandırma ve SOC maliyet modeli", notebook: "Satış", section: "Teklif ve İhale", daysAgo: 4, body: [`Paketler: Temel 640 ₺, Gelişmiş 1.450 ₺ (cihaz başına yıllık), Yönetilen pakette aylık 118 bin ₺ sabit hizmet bedeli. Güvenlik paketlerinin ARR'si ${m(KPI.arrSecurity)} M₺ (%${arrPct(KPI.arrSecurity)}).`, "SOC maliyeti: 24 kişilik operasyon merkezinde müşteri başına ortalama brüt marj %38; üç yıllık sözleşmede kampanya iskontosuyla marj %33'e iniyor.", "Toroslar için hesap: üç yıllık toplam yaklaşık 7,8 M₺ (lisans ve SOC). İskonto onayı Selin'de, hukuk taslağı müşteri tarafında inceleniyor."] },
    { title: "Q4 kapanış planı — riskler ve aksiyonlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: [`Kalan ${gap} M₺ açık: Kızılırmak (9,6 M₺) belirleyici. Teslimat taahhüdü ve iskonto onayı iki ana engel; ikisi de bu ay çözülmeli.`, `Toroslar SOC sözleşmesi Q4'e girerse kapanış ${m(KPI.forecastHigh)} M₺'ye çıkıyor (%${pct(KPI.forecastHigh, KPI.quota)}). Hukuk sürecine en az 10 iş günü bırakılmalı.`, "Yeşilvadi ihalesi sonucu Q1'e kalacak; forecast'ta ağırlığı %35'in üzerine çıkarılmamalı."] },
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
      // ───── Ayrıntılı (özel) cevaplar: genel kalıplardan ÖNCE denenir ─────
      {
        match: "iskonto onay|indirim onay|onay matris|onay sınır|bekleyen iskonto|marj",
        steps: ["Onay kuyruğu okunuyor…", "Marj ve onay sınırları hesaplanıyor…"],
        text: `**İskonto onay kuyruğu**\n\n| Müşteri | Talep | Tutar | Onay makamı |\n|---|---|---|---|\n| ${FS} | %6 yenileme iskontosu | 1,9 M₺ | Sen (marj %31 üzerinde) |\n| ${UM} | %8 cihaz filosu iskontosu | 4,9 M₺ | Sen (birleşik marj %27) |\n| ${KF} | %16 toplam (%9 kampanya + %7 ek) | 9,6 M₺ | Selin Aydın |\n\nOnay sınırları: %12'ye kadar satış yöneticisi, %12–18 arası satış direktörü, %18 üzeri finans. Finans taban marjı %25; Uludağ teklifi bu eşiğin üzerinde kalıyor.\n\nFiyat ve iskonto onay komitesi bir sonraki iş günü 16:30'da toplanıyor. Simülasyon için *tyroPricing* uygulamasını açabilirsin.`,
        chips: ["Kampanya kuralları neler?", "Onay bekleyen işlerim var mı?"],
      },
      {
        match: "poc takvim|poc plan|poc program|poc.*(ne zaman|bitiş|kapanış)|pilot takvim",
        steps: ["POC kayıtları okunuyor…", "Takvim ve kaynak planı çıkarılıyor…"],
        text: `**POC takvimi**\n\n| Müşteri | Kapsam | Aşama | Takvim |\n|---|---|---|---|\n| ${FS} | Hastane bulut dönüşümü (3 uygulama) | %60 tamam | 8 iş günü sonra biter, kapanış değerlendirmesi 9. iş günü |\n| ${ZS} | Yedekleme ve felaket kurtarma | Başlangıç toplantısı bekleniyor | 4 iş günü sonra başlar, 10 iş günü sürer |\n| ${UM} | Mağaza cihaz yönetimi | Planlandı | Gelecek ay |\n| ${EE} | Ağ segmentasyonu (saha POC önerisi) | RFP sonucuna bağlı | Belirsiz |\n| ${TT} | Siber güvenlik paketi ve SOC | Tamamlandı | SOC sözleşme görüşmesi 6 iş günü sonra |\n\nFırat Sağlık ve Zümrüt Sigorta POC'ları üst üste biniyor; Deniz Arslan'ın ekibi için kaynak planı haftalık ön satış senkronunda konuşuluyor.`,
        chips: ["İhale durumu nedir?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "hesap sağlığı|hesap sağlık|sağlık skoru|müşteri sağlığı|risk skoru",
        steps: ["Kullanım ve destek verileri okunuyor…", "Risk skorları hesaplanıyor…"],
        text: `**Hesap sağlığı ve yenileme risk skorları**\n\n| Müşteri | Risk skoru | Ana neden |\n|---|---|---|\n| ${FS} | **82 (yüksek)** | Lisans kullanımı %48, destek talepleri üç kat arttı, rakip teklif |\n| ${UM} | 54 (orta) | Son 30 günlük kullanım verisi eksik, abonelik 60 gün sonra bitiyor |\n| ${ZS} | 47 (orta) | Bulut tüketimi taahhüdün %58'inde |\n| ${EE} | 29 (düşük) | Tüketim taahhüde yakın (%93), RFP ile genişleme |\n| ${TT} | 21 (düşük) | POC başarılı, lisans yenilemesi pakete dönüşüyor |\n| ${KF} | 18 (düşük) | Depolama destek sözleşmesi 75 gün sonra, donanım yenilemesi müzakerede |\n\nSkorlar *tyroInsight* ve yenileme riski modeliyle hesaplanıyor. Aylık hesap sağlığı değerlendirmesinde ilk iki hesap için aksiyon listesi çıkarılıyor.`,
        chips: ["Lisans yenileme riskleri neler?", "ARR dağılımı nasıl?"],
      },
      {
        match: "arr dağılım|arr kırılım|arr kaç|arr ne kadar|arr büyüme|arr nasıl|churn|\\bnrr\\b|net gelir tutma|müşteri kaybı|gelir kaybı|riskteki arr",
        steps: ["Abonelik gelirleri okunuyor…", "ARR kırılımı ve risk hesaplanıyor…"],
        text: `**ARR dağılımı ve yenileme riski**\n\nToplam ARR **${m(KPI.arr)} M₺** (aylık ${m(KPI.mrr)} M₺ MRR), net gelir tutma oranı **%${KPI.nrr}**.\n\n| Bileşen | ARR | Pay |\n|---|---|---|\n| Bulut abonelikleri | ${m(KPI.arrCloud)} M₺ | %${arrPct(KPI.arrCloud)} |\n| Güvenlik paketleri | ${m(KPI.arrSecurity)} M₺ | %${arrPct(KPI.arrSecurity)} |\n| Lisans bakım ve destek | ${m(KPI.arrSupport)} M₺ | %${arrPct(KPI.arrSupport)} |\n| Yönetilen hizmetler | ${m(KPI.arrManaged)} M₺ | %${arrPct(KPI.arrManaged)} |\n\nRiskteki ARR **${m(KPI.atRiskArr)} M₺** (toplamın %${arrPct(KPI.atRiskArr)}'i): ${FS} 1,9 M₺ (yüksek risk) ve ${UM} 2,2 M₺ (orta risk). Yenileme oranı %${KPI.renewalRate}, hedef %93; bu iki hesap kaybedilirse oran hedefin belirgin biçimde altında kalır.\n\nFırat'ta bulut kapsamını büyütmek ve Uludağ'da kullanım verisini tamamlamak en hızlı iki aksiyon.`,
        chips: ["Hesap sağlığı skorları nasıl?", "Lisans yenileme riskleri neler?"],
      },
      {
        match: "açık ihale|ihale takvim|ihale listesi|tüm ihale|ihaleler|rfp durum|rfp listesi|rfp takvim|ege enerji|akdeniz eğitim|\\brfi\\b",
        steps: ["İhale ve RFP dosyaları okunuyor…", "Son tarihler hesaplanıyor…"],
        text: `**Açık ihale ve RFP durumu**\n\n| Kurum | Kapsam | Tutar | Aşama | Sonraki adım |\n|---|---|---|---|---|\n| ${YK} | Ağ altyapısı yenileme (ihale) | 6,4 M₺ | Teknik cevaplar | Son teklif yaklaşık 12 iş günü sonra; teminat mektubu hazırlanıyor |\n| ${EE} | Trafo merkezi ağ segmentasyonu ve 7/24 izleme (RFP) | 3,6 M₺ | Yeni yayımlandı | Yazılı sorular 6, teklif 15 iş günü içinde |\n| ${AE} | Öğretmen cihazı ve sınıf ekranı (RFI) | 2,3 M₺ | Bilgi talebi | RFI yanıtı ay sonuna kadar |\n\nToplam ${KPI.rfpOpen} açık dosya, **${m(KPI.rfpValue)} M₺**. İki dosyaya aynı anda cevap yazmak için Zeynep Acar ve Deniz Arslan'ın takvimi sıkışık; *tyroRFP* ile uygunluk matrislerini ön doldurmak süreyi kısaltır.`,
        chips: ["POC takvimi nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "(ortak|ortağ).*kota|kota.*(ortak|ortağ|bilgesis|veribahar|çınar)|(bilgesis|veribahar|çınar).*kota|proje kayıt|kayıt koruma|paket kotası",
        steps: ["İş ortağı portalı okunuyor…", "Kota kullanımı hesaplanıyor…"],
        text: `**İş ortağı kota kullanımı**\n\n| İş ortağı | Paket kotası | Kullanılan | Durum |\n|---|---|---|---|\n| ${BE} | 18 | 16 (%89) | Çeyrek sonuna yetiyor |\n| ${VB} | 10 | 10 (%100) | 2 ek paket talebi var |\n| ${CS} | 8 | 3 (%38) | 5 paket boşta |\n\nOnur Polat, Çınar'ın boştaki iki paketini 90 günlüğüne Veribahar'a devretmeyi öneriyor; böylece ek kota onayı beklemeden Q4 kampanyası başlayabilir. Devir için senin ve Selin Aydın'ın onayı gerekiyor.\n\nVeribahar 14 müşteri adayı için kampanya iskontosunun proje kaydı kapsamında korunmasını da istiyor. 2027 programında proje kaydı koruması Stratejik seviyede 120 güne çıkıyor.`,
        chips: ["Yeni iş ortağı adayları kimler?", "İş ortağı performansı nasıl?"],
      },
      {
        match: "yeni iş ortağı|aday iş ortağı|altınoluk|meridyen|onboarding|iş ortağı başvuru|sertifikalı mühendis",
        steps: ["İş ortağı başvuruları okunuyor…"],
        text: `**Yeni iş ortağı adayları**\n\n| Firma | Sertifikalı mühendis | Referans | 2027 hedefi | Durum |\n|---|---|---|---|---|\n| ${AB} | 4 | 3 kurumsal proje | 2,4 M₺ | Başvuru uygun; sertifikasyon eğitimi 11 iş günü sonra |\n| ${MS} | 2 | 3 proje (iki banka, bir üniversite) | — | Aday; değerlendirme görüşmesi 5 iş günü sonra |\n\nProgram kuralı gereği Temel seviyeye girmek için en az 3 sertifikalı mühendis gerekiyor. Altınoluk koşulu karşılıyor; Meridyen Sistem mühendis sayısını 3'e çıkarana kadar aday kalacak.\n\nİki firmanın Q4 cirosu henüz yok; kanal toplam cirosu (${m(KPI.channelTotal)} M₺) mevcut üç iş ortağından geliyor.`,
        chips: ["İş ortağı kotası nasıl?", "İş ortağı performansı nasıl?"],
      },
      {
        match: "tüketim|bulut taahhüt|bulut harcama",
        steps: ["Bulut faturaları okunuyor…", "Taahhüt ve tüketim karşılaştırılıyor…"],
        text: `**Bulut tüketimi (taahhüde göre)**\n\nToplam taahhüt **${m(KPI.cloudCommit)} M₺**, tüketilen **%${KPI.cloudUsedPct}**.\n\n| Müşteri | Taahhüt | Tüketim | Not |\n|---|---|---|---|\n| ${KF} | 3,0 M₺ | %84 | Sağlıklı |\n| ${TT} | 2,6 M₺ | %79 | Güvenlik paketiyle genişleyebilir |\n| ${UM} | 1,9 M₺ | %71 | Cihaz yönetimi kullanımı artıyor |\n| ${FS} | 1,2 M₺ | %52 | **Düşük**, yenileme riskini artırıyor |\n| ${EE} | 1,6 M₺ | %93 | Taahhüdü aşmak üzere, ek kapasite fırsatı |\n| ${ZS} | 1,1 M₺ | %58 | Yedekleme POC'u tüketimi artırabilir |\n\nFırat Sağlık'taki düşük tüketim, kullanım iyileştirme planının önceliğini artırıyor. Ege Enerji'de ek kapasite için yaklaşık 0,4 M₺'lik bir fırsat var.`,
        chips: ["Hesap sağlığı skorları nasıl?", "Siber güvenlik paketleri neler?"],
      },
      {
        match: "güvenlik paket|güvenlik fiyat|soc fiyat|\\bedr\\b|yönetilen soc|yönetilen hizmet|paket fiyat",
        steps: ["Paket fiyat listesi okunuyor…", "Güvenlik fırsatları taranıyor…"],
        text: `**Siber güvenlik paketleri**\n\n| Paket | Kapsam | Liste fiyatı |\n|---|---|---|\n| Temel | Uç nokta koruma ve e-posta güvenliği | 640 ₺ / cihaz / yıl |\n| Gelişmiş | Temel + uç nokta tespit ve müdahale (EDR), olay günlüğü analizi | 1.450 ₺ / cihaz / yıl |\n| Yönetilen (SOC) | Gelişmiş + 7/24 izleme ve müdahale | Gelişmiş lisans + aylık 118 bin ₺ hizmet bedeli |\n\nGüvenlik paketlerinin ARR'si **${m(KPI.arrSecurity)} M₺** (toplamın %${arrPct(KPI.arrSecurity)}'ü). En büyük fırsat Toroslar Telekom (7,8 M₺, Gelişmiş + yönetilen SOC); Ege Enerji RFP'si de izleme hizmeti içeriyor.\n\nÜç yıllık sözleşmelerde Q4 kampanyasının %9 iskontosu geçerli ve ilk yıl 7/24 destek bedelsiz. Satış sertifikasyonu atölyesi 5 iş günü sonra.`,
        chips: ["Bulut tüketimi nasıl?", "Fiyat ve iskonto onay kuyruğu nedir?"],
      },
      {
        match: "stok durum|stok seviye|kritik stok|depo stok|stokta|tahsis|rezerve|stok sayım",
        steps: ["Depo stoğu okunuyor…", "Rezerve ve serbest adetler hesaplanıyor…"],
        text: "**Depo stok durumu**\n\n| Ürün | Stokta | Rezerve | Serbest | Üretici süresi |\n|---|---|---|---|---|\n| Sunucu | 14 | 6 | 8 | 8 hafta |\n| Depolama dizisi | 2 | 2 | 0 | 10 hafta |\n| Güvenlik duvarı / ağ cihazı | 7 | 3 | 4 | 12 hafta |\n| Dizüstü | 220 | 140 | 80 | 4 hafta |\n| El terminali | 90 | 0 | 90 | 4 hafta |\n\nUludağ'ın 1.240 cihazı ve Karadağ'ın 760 el terminali stoktan karşılanamıyor; 4 haftalık üretici siparişi gerekecek. Mert Aksoy stoktan ayırma için senin onayını bekliyor. Depolama dizisinde serbest stok sıfır olduğu için Kızılırmak teslimatı üretici tahsisine bağlı.",
        chips: ["Teslimat süreleri nedir?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "forecast|senaryo|kapanış tahmin|kayma riski|\\bslip",
        steps: ["Fırsat olasılıkları okunuyor…", "Senaryolar hesaplanıyor…"],
        text: `**Q4 kapanış senaryoları**\n\n| Senaryo | Varsayım | Q4 kapanış | Hedefe oran |\n|---|---|---|---|\n| Temkinli | Kızılırmak gelirinin bir kısmı teslimat nedeniyle Q1'e kayar | ${m(KPI.forecastLow)} M₺ | %${pct(KPI.forecastLow, KPI.quota)} |\n| Beklenen | Ağırlıklı tahmin | ${m(KPI.forecast)} M₺ | %${KPI.forecastPct} |\n| İyimser | Toroslar SOC sözleşmesi de Q4'te imzalanır | ${m(KPI.forecastHigh)} M₺ | %${pct(KPI.forecastHigh, KPI.quota)} |\n\nGerçekleşen ${m(KPI.achieved)} M₺; kalan ${gap} M₺ açığın büyük kısmı Kızılırmak ve Toroslar fırsatlarına bağlı. Toroslar için hukuk sürecine en az 10 iş günü bırakmak gerekiyor. Yeşilvadi ihale sonucu Q1'e kalacağı için senaryolara dahil değil.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Rakiplere karşı durumumuz nasıl?"],
      },
      {
        match: "rakip|rekabet|kaybed|kayıp neden|win.?loss",
        steps: ["Kapanan fırsatlar okunuyor…", "Kayıp nedenleri gruplanıyor…"],
        text: `**Kayıp analizi ve rakipler (son 12 ay)**\n\nKazanma oranı %${KPI.winRate}. Kaybedilen 50 fırsatın nedenleri:\n\n| Neden | Adet | Pay |\n|---|---|---|\n| Fiyat | 21 | %42 |\n| Teslimat süresi | 13 | %26 |\n| Referans ve devreye alma süresi | 10 | %20 |\n| Diğer | 6 | %12 |\n\nKamu ihalelerinde iki yerli entegratör fiyat ve yerli üretim oranıyla öne çıkıyor; kurumsal hesaplarda ise başka üreticilerin abonelik teklifleri (Fırat Sağlık'ın aldığı teklif gibi) rekabet yaratıyor.\n\nTeslimat kayıplarını azaltmak için üretici tahsisi ve stoktan ayırma kritik; referans eksikliği için Akademi'deki TCO rehberi ve referans müşteri kataloğu kullanılabilir.`,
        chips: ["Açık fırsatlarımı özetle", "RFP durumu nasıl?"],
      },
      // ───── Genel cevaplar ─────
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

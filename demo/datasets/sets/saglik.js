// SAĞLIK & İLAÇ veri seti — TYRO Tech'in tek kullanımlık tıbbi sarf malzeme, teşhis kiti, cihaz servis
// sözleşmesi ve eczane/depo kanalındaki OTC–dermokozmetik ürün grubunu sattığı bir satış yöneticisi haftası.
// Kış sezonu talebi, yıl sonu bütçe kapanışı, ihale dönemi ve kamu tahsilat gecikmeleri öne çıkar.
// Tüm kişi, firma ve rakamlar KURGUSALDIR; ticari/lojistik odaklıdır, tıbbi bilgi ya da tavsiye içermez.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: 24.0, // Q4 hedefi (milyon TL)
  achieved: 17.3, // gerçekleşen
  achievedPct: 72,
  pipeline: 41.6, // açık pipeline (milyon TL)
  openDeals: 27,
  winRate: 38,
  closedThisMonth: 5.9,
  tenders: 6, // açık ihale dosyası
  tenderValue: 10.4, // ihale dosyalarının toplamı (milyon TL)
  receivableDays: 74, // ortalama kamu tahsilat süresi (gün)
  receivableLastYear: 61,
  publicReceivable: 6.8, // açık kamu alacağı (milyon TL)
  overdueReceivable: 2.1, // vadesi geçen kısım
  sktValue: 1.3, // SKT riski taşıyan stok değeri (milyon TL)
  sktLots: 4,
  coldChainFill: 92, // Aralık için 2–8°C alan doluluğu (%)
  winterGrowth: 27, // eczane siparişlerinde geçen yıla göre artış (%)
  campaignDeals: 9, // kış kampanyası uygulanan teklif sayısı
  campaignOffered: 7.2, // kampanyalı tekliflerin toplamı (milyon TL)
  campaignOrdered: 3.4, // bunların siparişe dönen kısmı
  serviceContracts: 14, // aktif cihaz servis sözleşmesi
  serviceRenewals: 5, // Aralık–Ocak döneminde yenilenecek
  serviceRenewalValue: 2.7, // yenilenecek sözleşmelerin yıllık değeri (milyon TL)
  guaranteeLimit: 900, // banka teminat mektubu limiti (bin TL)
  guaranteeFree: 490, // boş teminat limiti (bin TL)
  guaranteeNeed: 258, // açık ihaleler için gereken geçici teminat (bin TL)
}

// Milyon ₺ biçimi: 17.3 → "17,3 M₺"
const m = (n) => `${n.toFixed(1).replace(".", ",")} M₺`

const MK = "Mavi Kıyı Sağlık Grubu" // özel hastane grubu
const YV = "Yeşilvadi Şehir Hastanesi" // kamu hastanesi satın alma birimi
const CE = "Çınaraltı Eczacı Kooperatifi" // eczacı kooperatifi
const PE = "Pınarlı Ecza Deposu" // ilaç ve ecza deposu
const BL = "Berrak Lab Grubu" // laboratuvar zinciri
const KM = "Kuzgun Medikal Toptan" // medikal malzeme toptancısı
const BM = "Balkan Medika d.o.o." // ihracat alıcısı
const SE = "Sedir Eczane Zinciri" // zincir eczane (dermokozmetik)
const LP = "Lale Poliklinik Grubu" // özel poliklinik zinciri
const SC = "Sarıçınar Üniversitesi Hastanesi" // üniversite hastanesi satın alma birimi
const GD = "Gökçay Devlet Hastanesi" // kamu hastanesi, ihale sonucu bekleniyor
const KE = "Karaçam Ecza Deposu" // bölge ecza deposu
const ZT = "Zümrüt Tanı Merkezleri" // tanı merkezi zinciri
const KI = "Kızılçam İl Sağlık Müdürlüğü" // il sağlık müdürlüğü ihaleleri

export default defineDataset({
  id: "saglik",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Hedef, ihale, SKT ve stok riski, kamu tahsilatı ve müşteri sorularını yanıtlar; haftalık özet hazırlar.",
  apps: [
    { name: "tyroForecast", type: "ai", description: "Mevsimsel talep, SKT ve stok riski tahmini; fırsat olasılıkları.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Çerçeve sözleşme, ihale taahhüt ve servis sözleşmeleri için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "İskonto, vade ve ihale fiyatı simülasyonu; marj etkisi.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Hastane, depo ve eczane hesap içgörüleri; sipariş ve ihale geçmişi.", icon: "Telescope02Icon" },
    { name: "tyroTrace", type: "ai", description: "Lot/seri takibi ve uygunluk belgesi kontrolü; eksik kayıt uyarıları.", icon: "DocumentValidationIcon" },
    { name: "Eczane Sipariş Portalı", type: "business", description: "Eczane, depo ve toptancı siparişleri; stok ve teslimat durumu", url: "#", icon: "Package01Icon" },
    { name: "tyroTender", type: "ai", description: "Şartname maddelerini okur, evrak listesi çıkarır; son teklif ve teminat tarihlerini hatırlatır.", icon: "AiBookIcon" },
    { name: "tyroCold", type: "ai", description: "2–8°C alan doluluğu ve sevkiyat sıcaklık kayıtları; sapma ve kapasite uyarıları.", icon: "CargoShipIcon" },
    { name: "tyroCollect", type: "ai", description: "Kamu ve özel alacak yaşlandırma, vade riski ve hatırlatma yazısı taslakları.", icon: "ChartHistogramIcon" },
    { name: "tyroService", type: "ai", description: "Cihaz servis sözleşmesi yenileme takvimi ve hizmet seviyesi (SLA) uyarıları.", icon: "AiChipIcon" },
    { name: "İhale Takip Panosu", type: "business", description: "Açık ihale dosyaları, son teklif tarihleri ve teminat durumu", url: "#", icon: "Target02Icon" },
    { name: "Lot ve SKT Paneli", type: "business", description: "Lot, seri ve son kullanma tarihi bazlı stok görünümü", url: "#", icon: "DocumentValidationIcon" },
    { name: "Servis Sözleşme Yönetimi", type: "business", description: "Cihaz servis sözleşmeleri, yenileme tarihleri ve açık servis kayıtları", url: "#", icon: "AddInvoiceIcon" },
  ],

  weather: { now: "lightsnow", base: 3, amp: 3, moods: ["lightsnow", "cloudy", "snow", "fog", "partlycloudy", "lightrain", "cloudy", "lightsnow", "fair", "cloudy"] },
  market: { rates: { USD: 44.4, EUR: 51.6, GBP: 58.4, CHF: 54.9 }, bist: 11280 },

  // ───────────── takvim ─────────────
  meetings: [
    {
      title: "Haftalık satış ve ihale toplantısı",
      recur: "weekly",
      weekday: 1,
      time: "09:30",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Selin Aydın",
      with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Geçen haftanın siparişleri ve kapanışları, ihale takvimi, kamu tahsilat durumu ve bu haftanın öncelikleri. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Sabah sipariş ve stok turu",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Kısa durum turu: dünün sevkiyatları, bugünün eczane ve depo siparişleri, SKT ve kritik stok uyarıları.",
    },
    {
      title: "İhale takvimi ve pipeline gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "14:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık fırsatların ve ihale dosyalarının aşama, olasılık ve son teklif tarihi kontrolü. Riskli dosyalar için aksiyon belirlenir.",
    },
    {
      title: "Kamu tahsilat takibi",
      recur: "weekly",
      weekday: 3,
      time: "11:30",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Can Yıldız",
      with: ["Ömer Gümüş", "Derya Çelik"],
      body: "Vadesi geçen kamu alacakları, hatırlatma yazıları ve yeni tekliflerde vade varsayımı.",
    },
    { title: `${MK} — çerçeve sözleşme teklif sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Tuna Ergin (${MK})`, "Zeynep Acar", "Deniz Arslan"], body: "Yıllık tek kullanımlık sarf malzeme çerçeve sözleşmesinin son sunumu. Birim fiyat, SKT taahhüdü ve ilk sevkiyat takvimi konuşulacak." },
    { title: `${YV} — ihale şartname görüşmesi`, day: 1, time: "10:30", minutes: 60, where: `${YV} · Satın Alma Birimi`, organizer: "Kaan Özdemir", with: [`Hatice Soylu (${YV})`, "Ömer Gümüş", "Derya Çelik"], body: "Teşhis kiti ve cihaz servis ihalesinin teknik şartname maddeleri ile evrak listesinin netleştirilmesi." },
    { title: `${PE} — dermokozmetik dağıtım müzakeresi`, day: 1, time: "15:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Okan Tezel (${PE})`, "Onur Polat", "Can Yıldız"], body: "Dermokozmetik ürün grubu dağıtım anlaşmasının iskonto kademeleri, ödeme vadesi ve raf önceliği." },
    { title: "Q4 hedef değerlendirme", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Çeyrek sonu hedef gerçekleşme, kamu tahsilat riski ve yıl sonu kapanışı için aksiyon planı." },
    { title: "Soğuk zincir depo kalite denetimi", day: 2, time: "10:00", minutes: 90, where: "TYRO Dağıtım Merkezi", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Derya Çelik"], body: "2–8°C alanında sıcaklık kayıtları, lot ayrımı ve SKT sıralaması kontrolü. Müşteri denetimi öncesi iç hazırlık." },
    { title: "Strateji çalıştayı — 2027 ihale ve kanal planı (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "2027 yılı ihale takvimi, kanal stratejisi ve kapasite planı çalıştayı. Katılımınızı bekliyoruz." },
    { title: `${CE} — eczacı birliği sunumu`, day: 3, time: "11:00", minutes: 60, where: `${CE} · Toplantı Salonu`, organizer: "Onur Polat", with: [`Necla Bayhan (${CE})`, "Ömer Gümüş", "Emre Şahin"], body: "Kış sezonu paketi, eczane siparişi ve iki dalgalı teslimat planının üye eczacılara sunumu." },
    { title: `${BL} — soğuk zincir sevkiyat planı`, day: 4, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Nazlı Berkant (${BL})`, "Ömer Gümüş", "Mert Aksoy"], body: "Reaktif ve kit sevkiyatlarında sıcaklık kaydı, lot bilgisi ve teslimat penceresi." },
    { title: "Ürün eğitimi — yeni hızlı test kiti ailesi", day: 5, time: "10:00", minutes: 120, where: "Maslak · Eğitim Salonu", organizer: "Deniz Arslan", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat", "Gizem Tunç"], body: "Yeni kit ailesinin çeşitleri, saklama koşulları, kayıt durumu ve müşteri soruları." },
    { title: `${BM} — ihracat sipariş görüşmesi`, day: 6, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Dimitar Petrov (${BM})`, "Can Yıldız"], body: "İlk ihracat siparişinin proforma, akreditif ve sevkiyat belgeleri." },
    { title: "Bölge hastane ve depo ziyaretleri — Ankara", day: 8, allDay: true, where: "Ankara", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Devlet hastaneleri satın alma birimleri ve bölge depolarına ziyaretler." },
    // geçmiş
    { title: `${KM} — yıllık iskonto görüşmesi`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Onur Polat", with: [`Cengiz Aral (${KM})`, "Ömer Gümüş"], body: "2027 alım taahhüdü karşılığında iskonto ve vade talebinin ilk değerlendirmesi." },
    { title: `${SE} — dermokozmetik raf planı`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Aslı Yaman (${SE})`, "Emre Şahin"], body: "48 şubede kış dönemi raf planı, numune ve fiyat listesi." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Laboratuvar zincirleri, servis sözleşmesi yenilemeleri ve gelişim planı." },

    // ───── ek tekrarlı toplantılar ─────
    {
      title: "Cihaz servis sözleşmeleri ve SLA takibi",
      recur: "weekly",
      weekday: 2,
      time: "16:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Gizem Tunç",
      with: ["Ömer Gümüş", "Mert Aksoy", "Derya Çelik"],
      body: `${KPI.serviceContracts} aktif servis sözleşmesinin yenileme takvimi, açık servis kayıtları ve hizmet seviyesi (SLA) sapmaları.`,
    },
    {
      title: "Eczane ve depo kanalı sipariş koordinasyonu",
      recur: "weekly",
      weekday: 5,
      time: "10:00",
      minutes: 30,
      where: "Microsoft Teams",
      organizer: "Onur Polat",
      with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin"],
      body: "Kooperatif, depo ve zincir eczane siparişlerinin teslimat dalgaları, kampanya kullanımı ve stok yeterliliği.",
    },
    {
      title: "Aylık kalite ve uygunluk gözden geçirme",
      recur: "monthly",
      dom: 17,
      time: "14:30",
      minutes: 60,
      where: "Maslak · Toplantı Odası 2",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Deniz Arslan", "Derya Çelik"],
      body: "İade ve şikayet kayıtları, lot izlenebilirliği, uygunluk belgelerinin geçerlilik tarihleri ve açık denetim aksiyonları.",
    },

    // ───── ek tek seferlik toplantılar ─────
    { title: "SKT riskli lotlar — satış aksiyon toplantısı", day: 1, time: "13:00", minutes: 45, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Mert Aksoy", "Onur Polat", "Zeynep Acar", "Gizem Tunç"], body: `${KPI.sktLots} lotun (${m(KPI.sktValue)}) müşteri bazlı eritme planı: hangi lot hangi hesaba, hangi iskonto ve teslim tarihiyle önerilecek.` },
    { title: `${YV} — vadesi geçen faturalar için ödeme planı görüşmesi`, day: 2, time: "12:00", minutes: 30, where: "Microsoft Teams", organizer: "Can Yıldız", with: [`Hatice Soylu (${YV})`, "Ömer Gümüş"], body: "Vadesi geçen üç faturanın (1,8 M₺) ödeme takvimi ve kalan tutar için yazılı ödeme taahhüdü talebi." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 2, time: "13:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "Bölge hastane ihaleleri, Ankara ziyaret programı ve hedefin üzerindeki performansın sürdürülmesi." },
    { title: `${GD} — ihale değerlendirme süreci görüşmesi`, day: 3, time: "09:30", minutes: 30, where: "Microsoft Teams", organizer: "Kaan Özdemir", with: [`Fadime Orhun (${GD})`, "Derya Çelik"], body: "9 kalemlik sarf malzeme teklifinde komisyonun değerlendirme takvimi, olası ek evrak talebi ve sonuç bildirimi." },
    { title: "Ekip 1:1 — Onur Polat", day: 3, time: "16:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Depo ve eczane kanalı hedefi, Pınarlı müzakeresi ve kış sezonu teslimat dalgaları." },
    { title: "Ekip 1:1 — Zeynep Acar", day: 4, time: "10:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Mavi Kıyı çerçeve sözleşmesinin kapanışı, özel hastane grupları hedefi ve hesap planı." },
    { title: `${KE} — kış sezonu ön sipariş ve stok devri`, day: 5, time: "13:30", minutes: 45, where: "Microsoft Teams", organizer: "Onur Polat", with: [`Burak Tuncel (${KE})`, "Ömer Gümüş", "Mert Aksoy"], body: "Bölge depo ağı için kış sezonu ön siparişi, aylık stok devir raporunun paylaşımı ve teslimat sıklığı." },
    { title: `${LP} — poliklinik ihtiyaç ve teslimat toplantısı`, day: 6, time: "10:30", minutes: 60, where: "Microsoft Teams", organizer: "Zeynep Acar", with: [`Sevgi Kandemir (${LP})`, "Ömer Gümüş", "Mert Aksoy"], body: "14 polikliniğin aylık sarf malzeme ihtiyacı, tek merkez depodan teslimat modeli ve 60 gün vade talebi." },
    { title: "İç kalite denetimi — ürün kayıt ve uygunluk belgeleri", day: 6, time: "14:00", minutes: 90, where: "Maslak · Toplantı Odası 1", organizer: "Deniz Arslan", with: ["Ömer Gümüş", "Derya Çelik", "Mert Aksoy"], body: "Ürün kayıt örnekleri, uygunluk belgelerinin geçerlilik tarihleri ve ihale dosyalarında kullanılan belgelerin güncelliği." },
    { title: `${ZT} — hızlı test kiti numune değerlendirmesi`, day: 7, time: "10:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Pelin Aksel (${ZT})`, "Deniz Arslan", "Ömer Gümüş"], body: "Numune kitlerin kullanım geri bildirimi, aylık tüketim tahmini ve servis sözleşmesi yenilemesiyle birlikte paket teklif." },
    { title: `${SC} — küçük kalem ihalesi teknik görüşme`, day: 7, time: "14:30", minutes: 60, where: `${SC} · Satın Alma Birimi`, organizer: "Kaan Özdemir", with: [`Murat Özkara (${SC})`, "Ömer Gümüş", "Derya Çelik"], body: "Küçük kalem sarf malzeme ihalesinin numune teslimi, teknik föy ve referans belgeleri; son teklif tarihi 25 Kasım." },
    { title: `${YV} ihale dosyası — son kontrol ve yükleme provası`, day: 7, time: "16:00", minutes: 45, where: "Maslak · Toplantı Odası 3", organizer: "Kaan Özdemir", with: ["Derya Çelik", "Can Yıldız", "Ömer Gümüş"], body: "Evrak sıralaması, geçici teminat mektubu (156 bin ₺) ve fiyat cetveli son kez kontrol edilir; sisteme yükleme son günden önce yapılır." },
    { title: "Kamu alacağı ve nakit akışı çalıştayı (davet)", day: 9, time: "11:00", minutes: 90, where: "Microsoft Teams", organizer: "Can Yıldız", status: "notResponded", with: ["Selin Aydın", "Ömer Gümüş", "Mert Aksoy"], body: "Vadesi geçen kamu alacağı, 2027 teklif vade varsayımları ve yıl sonu nakit planı. Katılımınızı bekliyoruz." },
    { title: `${KI} — ihale şartname soru-cevap görüşmesi`, day: 9, time: "14:30", minutes: 60, where: `${KI} · Satın Alma Birimi`, organizer: "Kaan Özdemir", with: [`Recep Ayvaz (${KI})`, "Ömer Gümüş", "Derya Çelik"], body: "İki sarf malzeme ve kit ihalesinin şartname maddeleri, açıklama talepleri ve son teklif takvimi." },
    { title: "Medikal ürünler ve dağıtım fuarı — ziyaretçi günleri", day: 12, allDay: true, span: 2, where: "İstanbul · Fuar Alanı", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Onur Polat", "Emre Şahin"], body: "Tedarikçi ve rakip standları, yeni ürün tanıtımları ve üç müşteriyle önceden planlanmış kısa görüşmeler." },
    // geçmiş
    { title: "Ekip 1:1 — Derya Çelik", day: -4, time: "10:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "İhale evrak yükü, öncelik sırası ve destek ihtiyacı." },
    { title: `${MK} — merkez depo ve teslimat noktası ziyareti`, day: -6, time: "10:00", minutes: 90, where: `${MK} · Merkez Depo`, organizer: "Zeynep Acar", with: [`Tuna Ergin (${MK})`, "Ömer Gümüş", "Mert Aksoy"], body: "Üç hastane için teslimat noktaları, rampa saatleri ve ürün kabul süreci yerinde incelendi." },
    { title: `${BL} — pilot sevkiyat sonuç değerlendirmesi`, day: -7, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Nazlı Berkant (${BL})`, "Mert Aksoy"], body: "Pilot sevkiyatın sıcaklık kayıtları, teslim süresi ve kalıcı anlaşma için istenen raporlama biçimi." },
    { title: "Q3 ihale kazanım ve kayıp değerlendirmesi", day: -8, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Ömer Gümüş", with: ["Kaan Özdemir", "Derya Çelik", "Zeynep Acar"], body: "Son çeyrekte sonuçlanan ihalelerde fiyat, evrak ve teknik uyum kaynaklı kayıpların analizi." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Tuna Ergin (${MK})`,
      subject: "Re: Yıllık sarf malzeme çerçeve sözleşmesi teklifi",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Teklifinizi satın alma komitemizle değerlendirdik. Birim fiyatlar ve iskonto kademeleri uygun; yalnızca teslim edilen ürünlerde kalan raf ömrünün en az %70 olması maddesini sözleşmeye eklemek istiyoruz. Bugünkü sunumda bu maddeyi ve ilk sevkiyatı aralığın ilk haftasına almayı konuşalım.",
        "Üç hastanemiz için ayrı teslimat noktası ve sipariş kodu tanımlamanızı da rica ederiz.",
        "İyi çalışmalar.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Q4 hedef değerlendirmesi — ihale ve tahsilat sayfası",
      at: { hoursAgo: 4 },
      unread: true,
      body: [
        "Ömer merhaba,",
        `Değerlendirme toplantısı için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'indeyiz (${m(KPI.achieved)} / ${m(KPI.quota)}); açık pipeline ${m(KPI.pipeline)}, açık ihale sayısı ${KPI.tenders}.`,
        `Kamu alacak süresi ${KPI.receivableDays} güne çıktı; bu konuda Can'la birlikte kısa bir plan ve benden istediğin desteği not düş lütfen.`,
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: `${YV} ihale dosyası — eksik evrak listesi`,
      at: { days: 1, time: "17:40" },
      unread: true,
      body: [
        "Ömer Bey merhaba,",
        "Şartnamede istenen evrakların durumunu çıkardım: uygunluk belgeleri ve ürün kayıt örnekleri hazır; iki kalem için üretici beyanı ve ihale yetki belgesi eksik. Geçici teminat mektubu 156 bin ₺ (%3), Can Bey'e bildirdim.",
        "Son teklif tarihi 20 Kasım. Satın alma birimiyle yapılacak görüşmeden önce on dakikanız olursa listeyi birlikte gözden geçirelim.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: `${YV} — vadesi geçen faturalar`,
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: [
        "Merhaba Ömer,",
        `${YV}'ne kestiğimiz üç fatura (toplam 1,8 M₺) 96 gündür ödenmedi. Kamu alacağımızın ortalama tahsilat süresi ${KPI.receivableDays} güne çıktı; geçen yıl aynı dönemde ${KPI.receivableLastYear} gündü.`,
        "Yeni ihale teklifinde vade ve fiyat farkı varsayımını birlikte belirleyelim. Hatırlatma yazısını senin onayınla göndereceğim.",
      ],
    },
    {
      from: `Okan Tezel (${PE})`,
      subject: "Dermokozmetik dağıtım anlaşması — iskonto kademeleri",
      at: { days: 1, time: "14:20" },
      unread: true,
      body: [
        "Merhaba,",
        "Önerdiğiniz üç kademeli iskonto yapısını inceledik. Yıllık 4,1 M₺ hacim için ikinci kademenin %9'dan %10'a çıkarılabilmesi bizim için belirleyici. Karşılığında depomuzda raf ve sevkiyat önceliği verebiliriz.",
        "Görüşmemizde bu başlığı konuşabilir miyiz?",
      ],
    },
    {
      from: `Nazlı Berkant (${BL})`,
      subject: "Soğuk zincir sevkiyat ve sıcaklık kayıtları",
      at: { days: 2, time: "16:05" },
      body: [
        "Merhaba Ömer Bey,",
        "Pilot sevkiyatın sıcaklık kayıtlarını inceledik; 2–8°C aralığı korunmuş. Kalıcı anlaşma için her sevkiyatta veri kaydedicinin çıktısını e-postayla almak ve lot/seri bilgisini sevk irsaliyesine yazdırmak istiyoruz.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: "Yeni hızlı test kiti ailesi — kayıt durumu ve satış sunumu",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "Yeni hızlı test kiti ailesinin ürün kayıtları tamamlandı; uygunluk belgeleri ortak klasörde. Satış sunumuna ürün karşılaştırma tablosunu ve numune talep formunu ekledim. Laboratuvar zincirleriyle paylaşabilirsiniz."],
    },
    {
      from: `Cengiz Aral (${KM})`,
      subject: "Yıllık iskonto ve vade talebi",
      at: { days: 2, time: "12:15" },
      body: ["Merhaba Ömer Bey,", "2027 için 1,9 M₺ yıllık alım taahhüdü vermeye hazırız. Karşılığında ek %2 iskonto ve vadenin 45 günden 60 güne çıkarılmasını talep ediyoruz. Aylık asgari sipariş miktarını da birlikte belirleyebiliriz."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 45. hafta",
      at: { days: 3, time: "17:15" },
      body: ["Merhaba Ömer Bey,", `Bu ay şimdiye kadar ${m(KPI.closedThisMonth)} kapanış gerçekleşti; kazanma oranı %${KPI.winRate}. Açık ihale sayısı ${KPI.tenders}. Rapor ekte ve paylaşılan klasörde.`],
    },
    {
      from: `Necla Bayhan (${CE})`,
      subject: "Kış sezonu paketi — sipariş ve teslimat takvimi",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "212 üye eczanemiz için kış sezonu paket siparişini iki dalgada vermek istiyoruz. İlk dalga için 23 Kasım haftası, ikinci dalga için Aralık'ın ilk haftası uygun görünüyor.", "Her teslimatta lot bilgisini içeren sevk listesi rica ederiz."],
    },
    {
      from: "Mert Aksoy",
      subject: "Dağıtım merkezi soğuk zincir doluluğu — Aralık",
      at: { days: 5, time: "13:25" },
      body: ["Ömer,", `Aralık için 2–8°C alanımızın %92'si rezerve görünüyor. Berrak Lab ve Balkan Medika sevkiyatları aynı haftaya denk geliyor; öncelik sırasını satış tarafından netleştirebilir misin? Ayrıca SKT'si yaklaşan ${KPI.sktLots} lotun çıkış planını bekliyorum.`],
    },
    {
      from: `Dimitar Petrov (${BM})`,
      subject: "Proforma fatura ve akreditif şartları",
      at: { days: 6, time: "15:40" },
      important: true,
      body: ["Merhaba Ömer Bey,", "İlk ihracat siparişimiz için 40 palet ürünün proforma faturasını bekliyoruz. Ödeme şekli olarak akreditifi kabul ediyoruz; sevkiyat öncesinde uygunluk belgelerinin ve lot listesinin kopyasını da isteriz. Toplam sipariş 1,6 M₺ civarında."],
    },
    { from: "Onur Polat", subject: "Eczane kooperatifi kış sezonu sunumu", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, Çınaraltı ve iki bölge birliği için kış sezonu sunumunu hazırladım. 12 koli üzeri %7 ek iskonto ve vade seçeneklerini ayrı slayta aldım; onayınızla Emre'ye gönderiyorum."] },
    { from: `Aslı Yaman (${SE})`, subject: "Dermokozmetik raf planı ve numune talebi", at: { days: 7, time: "15:20" }, body: ["Merhaba Ömer Bey,", "48 şubemizde kış dönemi raf planını güncelliyoruz. Yeni el bakım serisi için şube başına iki numune seti ve güncel fiyat listesi rica ederiz."] },
    { from: "Emre Şahin", subject: "Kış sezonu broşürü ve eczane afişleri onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, kış sezonu broşürünün ve eczane afişlerinin son hali ekte. Fiyat, iskonto ve kampanya bitiş tarihi (30 Kasım) bilgilerini bir kez de satış tarafı görsün istedik."] },
    { from: "Elif Kaya", subject: "Asistan demo ortamı: SKT ve stok soruları eklendi", at: { days: 9, time: "16:30" }, body: ["Ömer Bey, müşteri sunumlarında kullanabileceğiniz asistan demo ortamı güncellendi. SKT riski, lot sorgusu ve ihale takvimi için örnek sorular ve veriler yüklü."] },

    // ───── ek müşteri ve iç yazışmalar ─────
    {
      from: `Fadime Orhun (${GD})`,
      subject: "Teklif değerlendirme komisyonu ve sonuç bildirimi takvimi",
      at: { hoursAgo: 1 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "9 kalemlik sarf malzeme ihalesinde teklif değerlendirme komisyonu 17 Kasım'da toplanacak. Fiyat cetvelinizde iki kalemin birim fiyatı ile toplam tutarı arasında yuvarlama farkı görünüyor; aritmetik düzeltme için yazılı bildirim giderse yanıt süresi 3 iş günüdür.",
        "Sonuç bildirimi elektronik sistem üzerinden yapılacak. Teslim süresiyle ilgili ek taahhüt belgesini de hazır bulundurmanızı rica ederiz.",
      ],
    },
    {
      from: `Sevgi Kandemir (${LP})`,
      subject: "14 poliklinik için aylık sarf malzeme ihtiyaç listesi",
      at: { hoursAgo: 6 },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Poliklinik grubumuzun aylık sarf malzeme ihtiyaç listesini ekte gönderiyorum: steril eldiven, numune kabı, pansuman seti ve tek kullanımlık önlük dahil 38 kalem. Yıllık toplam alım hacmini yaklaşık 2,2 M₺ olarak öngörüyoruz.",
        "Tüm poliklinikler için tek merkez depoya teslimat ve 60 gün vade istiyoruz. Çerçeve fiyat teklifinizi 20 Kasım'a kadar alabilirsek ilk siparişi Aralık'ta verebiliriz.",
      ],
    },
    {
      from: `Murat Özkara (${SC})`,
      subject: "Küçük kalem sarf malzeme ihalesi — numune ve teknik föy talebi",
      at: { days: 1, time: "09:40" },
      unread: true,
      body: [
        "Merhaba,",
        "İhale dosyamızdaki 12 kalem için numune teslimi 21 Kasım'a kadar yapılmalıdır. Her kalem için ürün kayıt örneği, teknik föy ve Türkçe kullanım kılavuzunu numuneyle birlikte teslim etmenizi rica ederiz.",
        "Ayrıca iş bitirme belgesi yerine son iki yıla ait benzer teslimat referanslarının listesi de kabul edilecektir. Teknik görüşme için uygun saatinizi bildirmenizi bekliyoruz.",
      ],
    },
    {
      from: `Burak Tuncel (${KE})`,
      subject: "Kış sezonu ön siparişi ve aylık stok devir raporu",
      at: { days: 2, time: "08:55" },
      body: [
        "Ömer Bey merhaba,",
        "Bölge depomuzun kış sezonu ön siparişi için 7 ürün grubunda toplam 0,9 M₺'lik liste hazırladık. Karşılığında kampanyadaki 12 koli üzeri ek iskontodan ve 60 gün vadeden yararlanmak istiyoruz.",
        "Eczane müşterilerimizden gelen talepleri sizinle paylaşmak için aylık stok devir raporunu her ayın ilk iş günü göndermeyi öneriyoruz; böylece sipariş sıklığını birlikte planlayabiliriz.",
      ],
    },
    {
      from: `Pelin Aksel (${ZT})`,
      subject: "Hızlı test kiti numune geri bildirimi ve paket teklif",
      at: { days: 2, time: "14:35" },
      body: [
        "Merhaba Ömer Bey,",
        "Dört merkezimizde iki haftadır denediğimiz numune kitler operasyon ekibimizden olumlu geri bildirim aldı. Aylık tüketimimizi yaklaşık 1.800 kit olarak öngörüyoruz.",
        "Dört cihazın servis sözleşmesi Aralık'ta bitiyor; kit tedariği ve servisi tek pakette teklif ederseniz iki kalemi aynı anda değerlendirebiliriz.",
      ],
    },
    {
      from: `Recep Ayvaz (${KI})`,
      subject: "İhale şartnamesi — açıklama talepleri için son başvuru",
      at: { days: 3, time: "10:50" },
      unread: true,
      important: true,
      body: [
        "Sayın Ömer Gümüş,",
        "Sarf malzeme ve kit ihalelerimizin şartname maddeleriyle ilgili açıklama talepleri 16 Kasım mesai bitimine kadar yazılı olarak alınacaktır. Süreden sonra gelen talepler değerlendirilmeyecektir.",
        "Soru-cevap görüşmesine katılmak isterseniz satın alma birimimizden randevu alabilirsiniz. İki ihalenin son teklif tarihleri 27 Kasım ve 4 Aralık'tır.",
      ],
    },
    {
      from: `Hatice Soylu (${YV})`,
      subject: "Teknik şartname — iki madde için idare açıklaması",
      at: { days: 3, time: "13:05" },
      body: [
        "Merhaba Ömer Bey,",
        "Kaan Bey'in ilettiği iki soruya idare olarak yazılı açıklama hazırladık: ihale yetki belgesinin son iki yıl içinde düzenlenmiş olması yeterlidir, üretici beyanı ise ürün grubu bazında tek belge olarak verilebilir.",
        "Açıklamanın örneği ekte; tüm isteklilere elektronik sistem üzerinden de duyurulacak.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Geçici teminat mektubu limiti — açık ihaleler",
      at: { days: 3, time: "09:25" },
      unread: true,
      flagged: true,
      body: [
        "Ömer merhaba,",
        `Bankadaki teminat mektubu limitimiz ${KPI.guaranteeLimit} bin ₺; kullanılan kısım 410 bin ₺, boş limit ${KPI.guaranteeFree} bin ₺. Açık ihaleler için gereken geçici teminat toplamı ${KPI.guaranteeNeed} bin ₺ (${YV} 156 bin ₺, ${KI} 69 bin ₺, ${SC} 33 bin ₺).`,
        `Limit yeterli, ancak ${GD} teminatının (54 bin ₺) iadesi gecikirse yeni bir ihale için ek limit gerekecek. Bankaya artış talebi için senin onayına ihtiyacım var.`,
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "SKT'si yaklaşan lotlar — depo transfer ve sevk planı",
      at: { days: 4, time: "11:35" },
      flagged: true,
      body: [
        "Ömer,",
        `Dört lotun çıkış planını FEFO sırasına göre hazırladım: 24K-118 ve 25A-031 öncelikli, çünkü SKT'ye 61–74 gün kaldı. Toplam stok değeri ${m(KPI.sktValue)}.`,
        "Satış tarafından müşteri bazlı miktar teyidi gelirse transferi iki gün içinde tamamlayabilirim; teyit gelmeyen lot için raf ayrımı yapıp kampanya listesine ekleyeceğim.",
      ],
    },
    {
      from: "Derya Çelik",
      subject: "İhale evrak yükü ve destek talebi",
      at: { days: 5, time: "10:40" },
      body: [
        "Merhaba Ömer Bey,",
        `${KPI.tenders} açık dosyadan dördünün evrak teslimi aynı iki haftaya denk geliyor: ${YV}, ${KI}'ndeki iki ihale ve ${SC}. Teminat, üretici beyanı ve uygunluk belgelerini tek tek takip etmem zorlaşıyor.`,
        "Kalite ekibinden belge doğrulama, Finans'tan teminat mektubu takibi için birer sorumlu atanırsa evrak listesini haftalık olarak kapatabiliriz. Önerdiğim iş bölümünü ekledim.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Servis sözleşmesi yenilemeleri — beş sözleşme, 2,7 M₺",
      at: { days: 5, time: "15:05" },
      body: [
        "Ömer Bey merhaba,",
        `${KPI.serviceContracts} aktif servis sözleşmemizin ${KPI.serviceRenewals}'i Aralık–Ocak döneminde yenileniyor; toplam yıllık değer ${m(KPI.serviceRenewalValue)}. En büyük kalem ${BL}'nun 9 cihazlık sözleşmesi (0,9 M₺, 31 Aralık).`,
        "Yenilemelerde iki yıllık sözleşme karşılığında %5 iskonto önermek istiyorum. Müşteri bazlı teklifleri onayınıza sunmadan önce marj etkisini tyroPricing ile çıkarıyorum.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: `${MK} — SKT maddesi için hukuk görüşü`,
      at: { days: 6, time: "11:50" },
      body: [
        "Ömer Bey merhaba,",
        "Hukuk ekibi, teslimde kalan raf ömrünün en az %70 olması maddesini kabul edilebilir buldu; yalnızca toplam raf ömrü 12 ayın altındaki kalemler için %60 eşik önermemizi istiyor. Aksi halde bazı kitlerde sözleşme dışı kalan sevkiyatlar çıkabilir.",
        "Tuna Bey'e bu ayrımı gerekçesiyle anlatan kısa bir not hazırladım; sunum sonrası onayınızla gönderebilirim.",
      ],
    },
    {
      from: "Ayşe Demir",
      subject: "Aralık izin talepleri — satış ekibi takvimi",
      at: { days: 6, time: "14:15" },
      body: [
        "Merhaba Ömer Bey,",
        "Aralık için satış ekibinden dört izin talebi geldi; Gizem ile Onur'un talebi 21–25 Aralık'ta çakışıyor. İhale ve yıl sonu kapanış yoğunluğu nedeniyle aynı anda en fazla iki kişi izinli olabildiği için onay aşamasında sizin sıralamanıza ihtiyacım var.",
        "Talepleri ve ekibin Aralık takvimini tek tabloda ekledim.",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "Strateji çalıştayı hazırlığı — 2027 ihale takvimi",
      at: { days: 7, time: "09:35" },
      body: [
        "Ömer merhaba,",
        "Çalıştaya gelmeden önce 2027'de takip edeceğimiz ihalelerin sayısını ve tahmini hacmini tek sayfada görmek istiyorum. Kaan ve Derya'nın listesine göre şimdilik 14 dosya ve yaklaşık 21 M₺ görünüyor; bunun ne kadarının kapasitemizle (evrak, teminat, soğuk zincir) taşınabileceğini de işaretleyelim.",
        "Davete yanıt vermeni de rica ederim; Mert ve Emre katılımını teyit etti.",
      ],
    },
    {
      from: "Onur Polat",
      subject: `${CE} — ilk dalga sevkiyat adetleri netleşti`,
      at: { days: 8, time: "16:10" },
      body: [
        "Ömer Bey,",
        "Necla Hanım ilk dalga için 126 eczanenin sipariş formunu onayladı; ikinci dalgada kalan 86 eczane var. İlk dalga toplamı 1,4 M₺, ikinci dalga 1,0 M₺ civarında (toplam 2,4 M₺).",
        "Lot bilgisini içeren sevk listesi şablonunu Mert'le hazırladık; son halini görmenizi istedim.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Kış sezonu e-bülten planı ve hedef liste",
      at: { days: 9, time: "10:50" },
      body: [
        "Ömer merhaba,",
        "Kampanya bitişine kadar üç e-bülten planladık: 12, 19 ve 26 Kasım. Hedef liste eczane kooperatifleri, bölge depoları ve zincir eczane satın alma sorumluları; toplam 640 kişi.",
        "Her müşteri için kişiselleştirilmiş kampanya özetini satış ekibinden Onur derliyor. Kamu müşterilerine gönderilmemesi için listeyi senin bir kez gözden geçirmeni isterim.",
      ],
    },
    {
      from: `Aslı Yaman (${SE})`,
      subject: "Cari limit artış talebi — kış dönemi siparişleri",
      at: { days: 10, time: "16:00" },
      body: [
        "Merhaba Ömer Bey,",
        "48 şube için kış dönemi siparişlerimiz cari limitimizi zorlamaya başladı. Limitin 0,6 M₺'den 0,9 M₺'ye çıkarılmasını, ödeme vadesinin ise 45 günde sabit kalmasını talep ediyoruz.",
        "Son altı aya ait ödeme performansı tablosunu ekledik; Finans ekibinizle paylaşabilirsiniz.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: `${BM} — ihracat etiket ve belge gereksinimleri`,
      at: { days: 11, time: "12:30" },
      body: [
        "Ömer,",
        "Balkan Medika için ürün etiketlerinde çok dilli (İngilizce ve Sırpça) kullanım bilgisi ile lot/SKT alanı gerekiyor. Üretici etiket şablonlarını güncelledi; ilk 40 paletin etiket baskısı için 5 iş günü lazım.",
        "Uygunluk belgelerinin İngilizce özetlerini Kalite ekibiyle hazırlıyorum; proforma ile birlikte gönderebiliriz.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "Ankara bölge ziyareti — randevular ve gündem",
      at: { days: 12, time: "09:10" },
      body: [
        "Ömer Bey merhaba,",
        "Ankara gününde üç devlet hastanesi satın alma birimi ve iki bölge deposuyla randevu aldım; sabah ilk görüşme 10:00'da. Her ziyaret için açık ihale durumu, vadesi geçen faturalar ve yeni ürün kataloğunu içeren birer sayfa hazırlıyorum.",
      ],
    },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları açıklandı", at: { days: 1, time: "09:05" }, body: ["Şirketimiz üçüncü çeyreği geçen yılın aynı dönemine göre %24 büyümeyle tamamladı.", "Büyümenin ana itici gücü sağlık ve ilaç dağıtım kanalı oldu: tek kullanımlık sarf malzeme, teşhis kitleri ve dermokozmetik ürün grubu toplam satışların %58'ine ulaştı. Tüm ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "Yeni dağıtım merkezinde soğuk zincir yatırımı tamamlandı", at: { days: 4, time: "10:20" }, body: ["Dağıtım merkezimizdeki 2–8°C alanı 1.200 palet kapasiteye çıkarıldı; sıcaklık izleme sistemi 7/24 alarm ve otomatik kayıt tutuyor.", "Yeni alan Aralık başından itibaren sevkiyatlara açılıyor. Kış sezonu yoğunluğunda teslim sürelerinin ortalama 6 saat kısalması hedefleniyor."] },
    { feed: "haberler", subject: "İyi Dağıtım Uygulamaları denetimi sorunsuz tamamlandı", at: { days: 8, time: "11:00" }, body: ["Bu ayki iyi dağıtım uygulamaları (GDP) denetimi açık uygunsuzluk bulgusu çıkmadan tamamlandı. Yenilenen uygunluk belgeleri Kalite klasöründe.", "İki gözlem notu için aksiyon planı Kalite ekibi tarafından 15 Aralık'a kadar kapatılacak."] },
    { feed: "haberler", subject: "Balkan pazarına ilk ihracat siparişi alındı", at: { days: 10, time: "14:00" }, body: ["Balkan Medika d.o.o. ile 40 palet, toplam 1,6 M₺'lik ilk ihracat siparişi için proforma süreci başladı.", "Sevkiyat belgeleri ve lot listeleri Operasyon ve Finans ekiplerinin ortak çalışmasıyla hazırlanıyor."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: depo yönetim sistemi cumartesi 02:00–04:00 arası kapalı", at: { days: 2, time: "15:00" }, body: ["Cumartesi günü 02:00–04:00 arasında depo yönetim sistemi ve sipariş portalı bakımda olacak. Bu sürede eczane ve depo siparişleri alınamayacak; planlı siparişlerinizi cuma gününden girmenizi rica ederiz."] },
    { feed: "duyuru", subject: "Kış sezonu kampanyası başladı", at: { days: 6, time: "09:00" }, important: true, body: ["Kış sezonu kampanyası bugün başladı: eczane ve depo kanalında OTC ve dermokozmetik ürün gruplarında 12 koli üzeri siparişlerde %7 ek iskonto, özel sektör müşterilerinde 60 gün vade.", "Kamu ihalelerinde uygulanmaz. Kampanya 30 Kasım'a kadar; detaylar ekteki broşürde."] },
    { feed: "duyuru", subject: "Mevzuat bilgilendirmesi: ürün kayıt ve lot bildirim süreci", at: { days: 11, time: "14:30" }, body: ["Ürün kayıt ve takip sistemindeki lot/seri bildirimleri için iç prosedürümüz güncellendi. Yeni sevkiyatlarda lot bilgisi sevk irsaliyesiyle birlikte 24 saat içinde sisteme girilecek.", "Prosedür metni Kalite klasöründe; sorularınız için Kalite ve Mevzuat ekibine ulaşabilirsiniz."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Burcu Sezer", at: { days: 3, time: "09:30" }, body: ["Kalite ve Mevzuat ekibimize Uzman olarak katılan Burcu Sezer'e hoş geldin diyoruz. Burcu, ürün kayıtları ve uygunluk belgelerinden sorumlu olacak.", "Kendisine yeni görevinde başarılar dileriz."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan arkadaşlarımız: Mert Aksoy ve Gizem Tunç. İyi ki doğdunuz, nice mutlu yıllara!"] },
    { feed: "ik", subject: "Yıllık izin planlama dönemi ve yıl sonu ihale yoğunluğu", at: { days: 9, time: "10:00" }, body: ["2027 yıllık izin planlarınızı 30 Kasım'a kadar yöneticinizle birlikte girmenizi rica ederiz.", "Yıl sonu bütçe kapanışı ve ihale dönemi nedeniyle 15–31 Aralık arasında satış ve operasyon ekiplerinde aynı anda en fazla iki kişi izinli olabilecek."] },
    { feed: "egitim", subject: "Ürün eğitimi: yeni hızlı test kiti ailesi", at: { days: 5, time: "11:15" }, body: ["Yeni hızlı test kiti ailesinin ürün eğitimi bu hafta 10:00'da Maslak Eğitim Salonu'nda. Kit çeşitleri, saklama koşulları ve sık gelen müşteri soruları ele alınacak. Kontenjan 30 kişidir."] },
    { feed: "egitim", subject: "Soğuk zincir ve lot takibi farkındalık eğitimi", at: { days: 12, time: "09:20" }, body: ["Zorunlu soğuk zincir ve lot takibi eğitimini bu ay sonuna kadar tamamlamanız gerekiyor. Eğitim 35 dakika sürüyor ve Akademi'den açılıyor."] },
    { feed: "akademi", subject: "Yeni modül: İhale şartnamesi okuma ve teklif hazırlama", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: şartname maddelerini okuma, evrak listesi çıkarma, geçici teminat ve teklif dosyası hazırlama. 30 dakikalık video, kontrol listesi ve örnek dosya."] },
    { feed: "akademi", subject: "Yeni modül: Kamu ve özel sektörde vade yönetimi", at: { days: 14, time: "15:30" }, body: ["Vade, fiyat farkı ve tahsilat süreçlerini sağlık kanalı örnekleriyle anlatan 20 dakikalık modül yayında."] },
    { feed: "kulup", subject: "Sağlıklı Yaşam Kulübü: Cuma sabahı yürüyüş ve ortak kahvaltı", at: { days: 3, time: "12:30" }, body: ["Sağlıklı Yaşam Kulübü Cuma sabahı 07:45'te ofis çevresinde 5 km yürüyüş yapıyor; ardından ortak kahvaltı var. Katılmak isteyen herkes davetlidir."] },
    { feed: "kulup", subject: "Gönüllülük günü: Kasım ayı kan bağışı standı", at: { days: 10, time: "13:00" }, body: ["Kasım ayı gönüllülük günü etkinliği olarak Maslak ofisinde kan bağışı standı kurulacak. Katılmak isteyenler İK'dan kayıt oluşturabilir."] },

    // ───── Keşfet akışı: ek içerik ─────
    { feed: "haberler", subject: "Eczane ve depo kanalında kış sezonu siparişleri güçlü başladı", at: { days: 2, time: "16:40" }, body: [`Eczane ve depo kanalındaki siparişler geçen yılın aynı haftasına göre %${KPI.winterGrowth} yüksek seyrediyor. Hızlı test kiti, eldiven ve el bakım serisi en çok talep gören gruplar.`, "Dağıtım merkezi yoğunluğu karşılamak için iki vardiyaya geçti; sevkiyat planı Operasyon ve Satış ekiplerinin ortak toplantısında izleniyor."] },
    { feed: "haberler", subject: "Servis ekibimiz sözleşme yenileme oranını %91'e çıkardı", at: { days: 12, time: "11:20" }, body: [`Cihaz servis sözleşmelerinde yıllık yenileme oranı %91'e ulaştı; ${KPI.serviceContracts} aktif sözleşmede hizmet seviyesi (SLA) hedeflerinin %96'sı karşılandı.`, "Başarıda yerinde müdahale süresinin ortalama 18 saate inmesi ve yedek parça stokunun merkezileştirilmesi etkili oldu."] },
    { feed: "duyuru", subject: "Yıl sonu envanter sayımı: dağıtım merkezi 28–29 Aralık'ta sevkiyata kapalı", at: { days: 8, time: "09:30" }, body: ["Yıl sonu envanter sayımı nedeniyle dağıtım merkezimiz 28–29 Aralık tarihlerinde çıkış sevkiyatı yapmayacak. Bu tarihlere denk gelen eczane, depo ve ihale teslimatlarının 23 Aralık'a kadar sipariş portalından girilmesi gerekiyor.", "Sayım ekibi kritik ürünler için Operasyon ile 2–8°C alanında vardiyalı çalışma planı yapacak."] },
    { feed: "duyuru", subject: "Sipariş portalının yeni sürümünde lot ve SKT bilgisi sipariş ekranında", at: { days: 3, time: "16:20" }, body: ["Eczane Sipariş Portalı'nın yeni sürümünde her ürün satırında lot, SKT ve kalan raf ömrü görünüyor. Müşteri temsilcileri sipariş girerken SKT'si yakın ürünleri kampanya önerisiyle birlikte sunabilecek.", "Sürüm geçişinde eski sipariş şablonları korunuyor; yeni ekranın kısa kullanım kılavuzu Satış klasöründe."] },
    { feed: "duyuru", subject: "Kamu ihalelerinde teminat mektubu talepleri için yeni süreç", at: { days: 7, time: "15:10" }, body: ["Banka teminat mektubu talepleri artık ihale başına tek formla ve son teklif tarihinden en az 3 iş günü önce Finans'a iletilecek. Form; idare, ihale tutarı, teminat oranı ve geçerlilik süresini içeriyor.", "Gecikmeli taleplerde bankanın çalışma saatleri nedeniyle süreyi garanti edemeyeceğimizi hatırlatırız. Form Finans klasöründe."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Merve Sönmez", at: { days: 6, time: "09:20" }, body: ["Finans ekibimize Tahsilat Uzmanı olarak katılan Merve Sönmez'e hoş geldin diyoruz. Merve, kamu ve özel sektör alacak takibi ile hatırlatma yazılarından sorumlu olacak.", "Kendisiyle tanışmak isteyenler Finans ekibine uğrayabilir."] },
    { feed: "ik", subject: "Kasım ayı doğum günleri", at: { days: 12, time: "08:50" }, body: ["Bu ay doğum günü olan arkadaşlarımız: Kaan Özdemir ve Emre Şahin. İyi ki doğdunuz, nice mutlu yıllara!", "Doğum günü pastası öğle arasında ortak mutfakta kesilecek."] },
    { feed: "ik", subject: "Yıl sonu performans değerlendirme dönemi başlıyor", at: { days: 13, time: "10:00" }, body: ["Yıl sonu performans değerlendirme formları 4 Aralık'ta açılacak; çalışan öz değerlendirmeleri 11 Aralık'a, yönetici değerlendirmeleri 18 Aralık'a kadar tamamlanacak.", "Satış ekiplerinde hedef gerçekleşme rakamları yıl sonu kapanışıyla netleşecek; değerlendirme görüşmeleri bu rakamlarla yapılacak."] },
    { feed: "egitim", subject: "Ürün eğitimi: cihaz servis sözleşmeleri ve SLA kuralları", at: { days: 4, time: "10:15" }, body: ["Cihaz servis sözleşmelerinin kapsamı, yanıt süreleri ve yenileme teklifinin nasıl hazırlanacağı bu eğitimde ele alınacak. Satış ve müşteri ilişkileri ekiplerine açık; süre 90 dakika, kontenjan 25 kişi."] },
    { feed: "egitim", subject: "İş sağlığı ve güvenliği yıllık tazeleme eğitimi: ofis ve depo", at: { days: 9, time: "09:00" }, body: ["Yıllık İSG tazeleme eğitimini ay sonuna kadar tamamlamanız gerekiyor. Ofis çalışanları için 40 dakikalık çevrim içi modül, dağıtım merkezi çalışanları için 2 saatlik uygulamalı oturum var."] },
    { feed: "egitim", subject: "Müzakere atölyesi: iskonto ve vade pazarlığı", at: { days: 11, time: "14:00" }, body: ["Eğitim ekibi satış ve satış operasyon çalışanları için yarım günlük müzakere atölyesi düzenliyor. Kış sezonu kampanyası ve ihale sonrası fiyat konuşmaları örnek olay olarak çalışılacak. Kontenjan 20 kişi; kayıtlar Akademi üzerinden alınıyor."] },
    { feed: "akademi", subject: "Yeni modül: SKT ve lot yönetimi — FEFO ile stok eritme", at: { days: 6, time: "15:45" }, body: ["SKT'si yaklaşan lotların FEFO sırasıyla çıkışı, müşteri bazlı eritme planı ve iskontolu çıkışın marj etkisini anlatan 25 dakikalık modül yayında. Modülde örnek tablo ve hesaplama şablonu yer alıyor."] },
    { feed: "akademi", subject: "Yeni modül: Çerçeve sözleşme ve SLA maddeleri", at: { days: 10, time: "16:10" }, body: ["Çerçeve sözleşmelerde teslimde kalan raf ömrü, aylık asgari sipariş, hizmet seviyesi (SLA) ve cezai şart maddelerini sade bir dille anlatan 30 dakikalık modül Akademi'de."] },
    { feed: "akademi", subject: "Yeni modül: Soğuk zincirde sevkiyat belgeleri ve veri kaydedici okuma", at: { days: 13, time: "11:30" }, body: ["Sevkiyat belgelerinde lot/seri bilgisi, veri kaydedici çıktısının okunması ve müşteriye raporlanması için 20 dakikalık video ve kontrol listesi yayında."] },
    { feed: "kulup", subject: "Satranç Kulübü: Kasım turnuvası kayıtları açıldı", at: { days: 5, time: "12:15" }, body: ["Satranç Kulübü'nün iç turnuvası ay sonuna kadar öğle aralarında oynanacak. 16 kişilik kontenjan için kayıtlar kulüp kanalından alınıyor; her seviyeden katılımcı davetlidir."] },
    { feed: "kulup", subject: "Fotoğraf Kulübü: Maslak'ta kış mini yarışması", at: { days: 9, time: "13:20" }, body: ["Fotoğraf Kulübü kış temalı mini yarışmasını başlattı. Ofis çevresinden çekilen kareler 30 Kasım'a kadar kulüp kanalına yüklenebilir; en beğenilen üç fotoğraf yıl sonu kutlamasında sergilenecek."] },
    { feed: "kulup", subject: "Yardımlaşma Kulübü: kışlık giysi ve battaniye toplama", at: { days: 12, time: "12:40" }, body: ["Yardımlaşma Kulübü kışlık giysi ve battaniye toplama kampanyasını başlattı. Temiz ve kullanılabilir ürünler Maslak ofisi girişindeki koliye bırakılabilir; kampanya ay sonunda yerel bir derneğe teslimle kapanacak."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${MK} çerçeve sözleşme teklifini güncelle ve gönder`, due: 0, importance: "high", steps: ["Birim fiyat ve iskonto tablosunu doğrula", "SKT taahhüdü maddesini hukuka onaylat", "İlk sevkiyat planını Mert'le netleştir", "Teklifi PDF olarak gönder"], note: "Teslimde kalan raf ömrü en az %70 olacak; üç hastane için ayrı teslimat noktası ve sipariş kodu tanımlanacak." },
          { title: `${YV} ihale dosyasını tamamla`, due: 2, importance: "high", steps: ["Uygunluk belgeleri ve kayıt örnekleri", "Üretici beyanı ve yetki belgesi", "Geçici teminat mektubu için Can'la görüş", "Teknik şartname karşılaştırma tablosu"], note: "Son teklif tarihi 20 Kasım; teklif son günden en az iki gün önce sisteme yüklenecek." },
          { title: `${PE} iskonto kademelerini Selin'e onaylat`, due: 1, importance: "high", steps: ["Kademe tablosunu hazırla", "Marj etkisini tyroPricing ile simüle et"] },
          { title: "Q4 hedef sunumunu hazırla", due: 2, steps: ["Rakamları Derya'dan al", "İhale ve kamu alacak slaytı", "Riskli fırsatlar slaytı", "Selin ile prova yap"] },
          { title: "Kamu alacak yaşlandırma raporunu Can'dan iste", due: -1, importance: "high", status: "inProgress" },
          { title: `SKT'si yaklaşan ${KPI.sktLots} lot için satış aksiyon planı çıkar`, due: 1, importance: "high", note: `Toplam stok değeri ${m(KPI.sktValue)}; kısa vadeli kampanya veya ek sevkiyat ile eritilecek.` },
          { title: "Haftalık pipeline ve ihale raporunu ekibe gönder", due: -2, status: "inProgress" },
          { title: `${CE} teslimat takvimini Mert ile kesinleştir`, due: 3 },
          { title: `${BL} soğuk zincir sevkiyat planını onayla`, due: 4 },
          { title: `${BM} proforma ve akreditif belgelerini kontrol et`, due: 5, steps: ["Proforma fatura bilgilerini doğrula", "Uygunluk belgeleri ve lot listesini ekle", "Can'ın akreditif onayını al"] },
          { title: "Kış sezonu kampanya brifini satış ekibiyle paylaş", due: 1, steps: ["Broşürü son kez kontrol et", "Ekip e-postasını yaz"] },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: `${KM} iskonto ve vade talebini yanıtla`, due: 3, importance: "low" },
          { title: `${SE} numune gönderimini onayla`, completedDaysAgo: 2 },
          { title: `${SE} raf planı için fiyat listesini gönder`, completedDaysAgo: 1 },
          { title: "Kış sezonu fiyat ve iskonto listesini onayla", completedDaysAgo: 4 },
          { title: `${GD} ihale değerlendirme sürecini ve ek evrak taleplerini takip et`, due: 3, importance: "high", note: "Komisyon 17 Kasım'da toplanacak; aritmetik düzeltme bildirimi gelirse yanıt süresi 3 iş günü." },
          { title: `${LP} için 38 kalemlik ilk çerçeve teklifi hazırla`, due: 4, importance: "high", steps: ["Poliklinik ihtiyaç listesini fiyatlandır", "Vade ve iskonto seçeneklerini tyroPricing ile simüle et", "Merkez depo teslimat planını Mert'le çıkar", "Teklifi Zeynep'le gözden geçirip gönder"], note: "Yıllık hacim yaklaşık 2,2 M₺; 60 gün vade talep ediliyor." },
          { title: `${KE} kış sezonu ön siparişini onayla`, due: 2 },
          { title: `${CE} ilk dalga sevk listesini lot bilgisiyle gönder`, due: -1, importance: "high", status: "inProgress" },
          { title: `${ZT} için kit tedariği ve servis sözleşmesi paket teklifi hazırla`, due: 5, steps: ["Aylık 1.800 kitlik tüketim varsayımını doğrula", "Servis sözleşmesi yenileme fiyatını Gizem'den al", "Paket marjını tyroPricing ile simüle et"] },
          { title: `${SE} cari limit artış talebini Can'a ilet`, due: 1 },
          { title: "Kış kampanyası kullanım ve marj raporunu çıkar", due: 6, importance: "low", note: `${KPI.campaignDeals} teklifte uygulandı; siparişe dönen tutar ${m(KPI.campaignOrdered)}.` },
          { title: `${KM} 2027 alım taahhüdü için karşı teklifi gönder`, completedDaysAgo: 3 },
          { title: `${BM} ilk görüşme notlarını CRM'e gir`, completedDaysAgo: 5 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Kaan ile ihale hedefi toplantısı", due: 3 },
          { title: "Derya için ürün kayıt ve lot takibi eğitimi planla", due: 8 },
          { title: "Gizem'in laboratuvar müşterileri servis planını incele", due: 6, importance: "low" },
          { title: "Zeynep ile Mavi Kıyı hesap planını gözden geçir", due: 4 },
          { title: "Derya için ihale evrak desteği planı (Kalite ve Finans'tan birer sorumlu)", due: 2, importance: "high", steps: ["Kalite ekibinden belge doğrulama sorumlusunu belirle", "Finans'tan teminat takibi için sorumlu iste", "Haftalık evrak kapanış toplantısını takvime ekle"] },
          { title: "Kaan'ın Ankara ziyaret programını ve randevularını onayla", due: 5 },
          { title: "Onur ile kış sezonu eczane dalga planını gözden geçir", due: 3 },
          { title: "Ekip yıl sonu performans görüşmelerini planla", due: 10, steps: ["Görüşme saatlerini belirle", "Hedef–gerçekleşme tablosunu Derya'dan al", "Gelişim notlarını hazırla"] },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Yıllık check-up randevusu al", due: 7, importance: "low" },
          { title: "Spor salonu üyeliğini yenile", due: 6, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Araç kış lastiği randevusu al", due: 2, importance: "low" },
          { title: "Yıllık izin için konaklama rezervasyonu yap", due: 12, importance: "low" },
          { title: "Telefon ve internet paketini yenile", completedDaysAgo: 6 },
        ],
      },
      {
        name: "İhale Takibi",
        tasks: [
          { title: `${YV} teklif dosyasını elektronik sisteme yükle`, due: 7, importance: "high", steps: ["Evrak sırasını ve imzaları son kez kontrol et", "Geçici teminat mektubunu ekle", "Fiyat cetvelini elektronik imzayla onayla", "Yükleme makbuzunu kaydet"], note: "Son teklif tarihi 20 Kasım; yükleme en geç iki gün önce yapılacak." },
          { title: `${KI} şartname açıklama talebini idareye ilet`, due: 3, importance: "high", steps: ["Uyumsuz görünen maddeleri listele", "Teknik gerekçeyi Deniz'den al", "Başvuruyu 16 Kasım mesai bitiminden önce gönder"], note: "Süreden sonra gelen talepler değerlendirilmeyecek." },
          { title: `${SC} küçük kalem ihalesi için numune ve teknik föy paketini hazırla`, due: 6, importance: "high", steps: ["12 kalem için ürün kayıt örneklerini topla", "Teknik föy ve Türkçe kullanım kılavuzlarını ekle", "Numuneleri 21 Kasım'dan önce teslim et"] },
          { title: "Geçici teminat limitini ihale bazında tabloya dök", due: 2, importance: "high", note: `Açık ihaleler için toplam ${KPI.guaranteeNeed} bin ₺ gerekiyor; boş limit ${KPI.guaranteeFree} bin ₺.` },
          { title: `${GD} geçici teminat iadesi için idareye yazı gönder`, due: 6 },
          { title: "Kaybedilen ihalelerin fiyat ve evrak analizini tamamla", due: -2, importance: "high", status: "inProgress" },
          { title: "2027 ihale takvimi taslağını Selin'e gönder", due: 9, importance: "low" },
          { title: "İhale takip listesini Kasım sonu için güncelle", completedDaysAgo: 1 },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Satış Hedefleri ve Gerçekleşme.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${MK} — Çerçeve Sözleşme Teklifi v3.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${YV} — İhale Şartname İnceleme.docx`, folder: "İhaleler", by: "Kaan Özdemir", daysAgo: 1 },
    { name: "İhale Takip Listesi — Kasım.xlsx", folder: "İhaleler", by: "Derya Çelik", daysAgo: 2 },
    { name: "Kamu Alacak Yaşlandırma Raporu.xlsx", folder: "Raporlar", by: "Can Yıldız", daysAgo: 2 },
    { name: "SKT ve Stok Risk Raporu.xlsx", folder: "Depo ve Lojistik", by: "Mert Aksoy", daysAgo: 3 },
    { name: "Lot Takip Listesi — Kasım.csv", folder: "Depo ve Lojistik", by: "Mert Aksoy", daysAgo: 4 },
    { name: "Kış Sezonu Fiyat ve İskonto Listesi 2026.xlsx", folder: "Teklifler", by: "Emre Şahin", daysAgo: 4 },
    { name: `${PE} Dağıtım Anlaşması Taslağı.docx`, folder: "Sözleşmeler", by: "Onur Polat", daysAgo: 4 },
    { name: "Ürün Uygunluk Belgeleri Arşivi.pdf", folder: "Kalite", by: "Deniz Arslan", daysAgo: 5 },
    { name: "Soğuk Zincir Sevkiyat Prosedürü.pdf", folder: "Kalite", by: "Mert Aksoy", daysAgo: 6 },
    { name: "Bölge Hastane Ziyaret Planı Aralık.xlsx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 7 },
    { name: "Ekip Performans Özeti.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 7 },
    { name: "Haftalık Toplantı Notları.docx", folder: "Satış", by: "Ömer Gümüş", daysAgo: 3 },
    { name: "Satış Eğitim Sunumu — İhale Teklif Hazırlama.pptx", folder: "Eğitim", by: "Ayşe Demir", daysAgo: 9 },
    { name: `${LP} — Poliklinik İhtiyaç Listesi.xlsx`, folder: "Teklifler", by: "Zeynep Acar", daysAgo: 0 },
    { name: `${KI} — Şartname Açıklama Talebi Taslağı.docx`, folder: "İhaleler", by: "Kaan Özdemir", daysAgo: 1 },
    { name: "Geçici Teminat ve Banka Limit Tablosu.xlsx", folder: "Finans", by: "Can Yıldız", daysAgo: 2 },
    { name: "Cihaz Servis Sözleşmeleri — Yenileme Takvimi.xlsx", folder: "Sözleşmeler", by: "Gizem Tunç", daysAgo: 2 },
    { name: "SKT Lot Eritme Planı.xlsx", folder: "Depo ve Lojistik", by: "Mert Aksoy", daysAgo: 2 },
    { name: `${SC} — Küçük Kalem İhale Fiyat Cetveli.xlsx`, folder: "İhaleler", by: "Derya Çelik", daysAgo: 3 },
    { name: `${ZT} — Hızlı Test Kiti Numune Raporu.pdf`, folder: "Kalite", by: "Deniz Arslan", daysAgo: 3 },
    { name: "Soğuk Zincir Veri Kaydedici Çıktıları — Kasım.csv", folder: "Depo ve Lojistik", by: "Mert Aksoy", daysAgo: 1 },
    { name: "2027 İhale Takvimi Taslağı.xlsx", folder: "İhaleler", by: "Ömer Gümüş", daysAgo: 4 },
    { name: `${KE} — Kış Sezonu Ön Sipariş Formu.xlsx`, folder: "Satış", by: "Onur Polat", daysAgo: 5 },
    { name: `${CE} Kış Paketi — İlk Dalga Sevk Listesi.xlsx`, folder: "Depo ve Lojistik", by: "Onur Polat", daysAgo: 6 },
    { name: `${BM} — Proforma ve Sevkiyat Belgeleri.pdf`, folder: "İhracat", by: "Can Yıldız", daysAgo: 6 },
    { name: "GDP Denetimi — Gözlem Notları ve Aksiyon Planı.docx", folder: "Kalite", by: "Mert Aksoy", daysAgo: 7 },
    { name: "İç Kalite Denetimi Kontrol Listesi.docx", folder: "Kalite", by: "Deniz Arslan", daysAgo: 8 },
    { name: "Kış Sezonu E-Bülten Planı.pptx", folder: "Pazarlama", by: "Emre Şahin", daysAgo: 9 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${MK} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü, merkez eczane sorumlusu ve üç hastanenin başhekim yardımcıları.", "İstekler: teslim edilen ürünlerde kalan raf ömrünün en az %70 olması, ilk sevkiyatın aralığın ilk haftasına çekilmesi, her hastane için ayrı teslimat noktası ve sipariş kodu.", "Sonraki adım: güncellenmiş teklif, SKT taahhüt maddesi için hukuk görüşü ve referans hastane ziyareti."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Yeşilvadi ihale dosyasında evrak sorumlusu Derya, teminat mektubu sorumlusu Can; son teklif tarihi 20 Kasım.", `SKT riskli ${KPI.sktLots} lot için kampanya ve depo transferi planı bu hafta sonuna kadar hazırlanacak.`, `Kamu alacağı: vadesi geçen ${m(KPI.overdueReceivable)} için hatırlatma yazıları gidecek.`] },
    { title: "İhale teklif hazırlığı — kontrol listesi", notebook: "Satış", section: "İhale Notları", daysAgo: 5, body: ["Şartname: teknik özellik maddeleri tek tek eşleştirilir; uyumsuz görünen kalem için açıklama süresi içinde idareden yazılı yanıt istenir.", "Evrak: uygunluk belgeleri, ürün kayıt örnekleri, üretici ve yetki belgesi, geçici teminat mektubu (%3), referans listesi.", "Fiyat: vade ve fiyat farkı varsayımı Can'la netleştirilir; teklif son günden en az iki gün önce sisteme yüklenir."] },
    { title: `${PE} müzakere hazırlığı`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: ["Açılış: üç kademeli iskonto yapısı, depoda raf ve sevkiyat önceliği.", "Esneklik alanları: ikinci kademe %9'dan %10'a çıkabilir; karşılığında yıllık asgari alım taahhüdü ve soğuk zincir ürünlerde ortak stok planı.", "Sınır: üçüncü kademe %12'nin üzerine çıkmaz; onay Selin Aydın'da."] },
    { title: `${GD} ihale süreci ve itiraz takvimi`, notebook: "Satış", section: "İhale Notları", daysAgo: 2, body: ["Teklif 9 kalem için verildi (1,8 M₺); komisyon 17 Kasım'da toplanacak. Fiyat cetvelinde iki kalemde yuvarlama farkı var; yazılı bildirim gelirse yanıt süresi 3 iş günü.", "Sonuç bildirimi elektronik sistemden yapılacak. İtiraz süresi şartnamede yazan gün sayısıyla sınırlı olduğundan bildirim gününü Derya takvime işleyecek.", "Kazanılan kalemlerde teslim süresi taahhüdü ve geçici teminatın kesin teminata dönüşümü Can'la planlanacak; kaybedilen kalemlerde fiyat farkı analizi çıkarılacak."] },
    { title: "Soğuk zincir ve depo kapasitesi — Aralık planı", notebook: "Satış", section: "Operasyon Notları", daysAgo: 4, body: [`Aralık için 2–8°C alanının %${KPI.coldChainFill}'si rezerve (yaklaşık 1.100 palet). Berrak Lab, Mavi Kıyı çerçeve sözleşmesi ve Balkan Medika sevkiyatları aynı haftalara yığılıyor.`, "Yeşilvadi için 180 palet ön rezervasyon tutuluyor; ihale kazanılmazsa Aralık ortasında serbest bırakılacak.", "Öncelik sırası önerisi: ihracat ve laboratuvar kit sevkiyatı, ardından hastane grubu çerçeve sözleşmesi. Mert veri kaydedici çıktı formatını müşteri taleplerine göre güncelleyecek."] },
    { title: `${LP} ön görüşme notları (telefon)`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["14 polikliniklik grup, tek merkez depodan teslimat ve 60 gün vade istiyor. Yıllık hacim yaklaşık 2,2 M₺, 38 kalem.", "Karar vericiler: satın alma müdürü Sevgi Hanım ve mali işler direktörü. İlk sipariş hedefi Aralık; çerçeve teklif 20 Kasım'a kadar bekleniyor.", "Açık sorular: poliklinik başına asgari sipariş, acil sipariş için ek kargo ve teslimde kalan raf ömrü taahhüdü (Mavi Kıyı'dakine benzer bir madde istenebilir)."] },
    { title: "Cihaz servis sözleşmeleri — yenileme stratejisi", notebook: "Satış", section: "Müşteri Notları", daysAgo: 5, body: [`${KPI.serviceContracts} sözleşmenin ${KPI.serviceRenewals}'i Aralık–Ocak döneminde yenileniyor; yıllık değer ${m(KPI.serviceRenewalValue)}. En büyük kalem Berrak Lab (9 cihaz, 0,9 M₺, 31 Aralık).`, "Strateji: iki yıllık yenileme karşılığında %5 iskonto ve kit tedariği ile servisi tek pakette sunmak. Zümrüt Tanı kit ve servis paketini birlikte bekliyor.", "Dikkat edilecekler: 4 iş saati yanıt süresi taahhüdü sürdürülebilir kalmalı; bölge depolarında ek yedek parça stoğu gerekebilir. Gizem haftalık SLA toplantısında izleyecek."] },
    { title: "Kamu tahsilat görüşmesi — Can ile aksiyonlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 4, body: ["Yeşilvadi: üç fatura (1,8 M₺) 96 gündür açık. Hatice Hanım'la ödeme takvimi görüşmesi yapılacak; yazılı ödeme taahhüdü istenecek.", `Vadesi geçen toplam ${m(KPI.overdueReceivable)}; ortalama tahsilat ${KPI.receivableDays} gün (geçen yıl ${KPI.receivableLastYear}). Yeni ihale tekliflerinde vade varsayımı 90 gün ve fiyat farkı maddesiyle hesaplanacak.`, "Finans'a yeni katılan tahsilat uzmanı hatırlatma yazılarını hazırlayacak; yazılar Ömer'in onayıyla çıkacak."] },
    { title: "Q3 ihale kazanım ve kayıp değerlendirmesi", notebook: "Satış", section: "İhale Notları", daysAgo: 7, body: ["Çeyrekte sonuçlanan dört ihaleden ikisi kazanıldı; biri fiyat, biri teknik uyumsuzluk nedeniyle kaybedildi. Bir dosya evrak eksiği yüzünden değerlendirme dışı kaldı.", "Fiyat kaybında rakip teklif yaklaşık %6 altındaydı; marjımız bu seviyeye inmeye izin vermiyordu. Teknik kayıpta kalem eşdeğerliği için açıklama süresi içinde yazılı soru sorulmamıştı.", "Aksiyonlar: şartname soru-cevap süresi takvime işlenecek, evrak kontrol listesi iki kişi tarafından çift kontrol edilecek, ihale bazlı marj tabanı tyroPricing'de tanımlanacak."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, ihale dosyaların, stok ve SKT riskin, kamu tahsilatın ve ekibin hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "İhale durumu nedir?", "SKT riski olan stok var mı?", "Haftalık satış özeti hazırla"],
    },
    answers: [
      // ───── ayrıntılı konu cevapları: genel kalıplardan ÖNCE gelmeli ─────
      {
        match: "limit",
        steps: ["Banka ve cari limit kayıtları okunuyor…"],
        text: `**Teminat ve cari limit durumu**\n\n- Banka teminat mektubu limiti: **${KPI.guaranteeLimit} bin ₺**; kullanılan 410 bin ₺, boş **${KPI.guaranteeFree} bin ₺**.\n- Açık ihaleler için gereken geçici teminat: **${KPI.guaranteeNeed} bin ₺** (${YV} 156 bin ₺, ${KI} 69 bin ₺, ${SC} 33 bin ₺).\n- ${GD} teminatının (54 bin ₺) iadesi bekleniyor; gecikirse yeni bir ihale için ek limit gerekebilir.\n- ${SE} cari limitinin 0,6 M₺'den 0,9 M₺'ye çıkarılmasını istiyor; son altı aydaki ödeme performansı düzenli.\n\nBanka limit artışı ve cari limit onayı için Can Yıldız'la görüşmen gerekiyor.`,
        chips: ["İhale takvimi nasıl?", "Kamu tahsilatı nasıl gidiyor?"],
      },
      {
        match: "ihale takvim|son teklif|teklif tarih|yaklaşan ihale|ihale tarihleri|ihale sonuç",
        steps: ["İhale takip listesi okunuyor…", "Son teklif tarihleri sıralanıyor…"],
        text: `**İhale takvimi**\n\nÖnümüzdeki haftalarda **${KPI.tenders} dosyanın** teklif ya da sonuç tarihi var; toplam **${m(KPI.tenderValue)}**.\n\n| İdare | Tutar | Kritik tarih | Durum |\n|---|---|---|---|\n| ${YV} | 5,2 M₺ | Son teklif 20 Kasım | Yükleme hedefi iki gün önce |\n| ${GD} | 1,8 M₺ | Komisyon 17 Kasım | Teklif verildi, sonuç bekleniyor |\n| ${KI} (1. ihale) | 1,4 M₺ | Son teklif 27 Kasım | Açıklama talebi 16 Kasım'a kadar |\n| ${KI} (2. ihale) | 0,9 M₺ | Son teklif 4 Aralık | Şartname inceleniyor |\n| ${SC} | 0,7 M₺ | Son teklif 25 Kasım | Numune teslimi 21 Kasım'a kadar |\n| Diğer üniversite hastanesi | 0,4 M₺ | Son teklif 2 Aralık | Teklif hazırlanıyor |\n\nEn sıkışık dönem 16–27 Kasım: üç dosyanın evrakı aynı günlere denk geliyor. Derya Çelik için destek planı görev listende.`,
        chips: ["İhale durumu nedir?", "Teminat limitimiz yeterli mi?"],
      },
      {
        match: "sıcaklık|veri kaydedici|palet|kapasite|doluluk",
        steps: ["Depo doluluk kayıtları okunuyor…", "Sevkiyat rezervasyonları toplanıyor…"],
        text: `**2–8°C alanı ve soğuk zincir planı**\n\nYeni 2–8°C alanı Aralık başında **1.200 palet** kapasiteyle devreye giriyor; Aralık için doluluk **%${KPI.coldChainFill}** (yaklaşık 1.100 palet).\n\n| Müşteri / iş | Rezerve palet | Not |\n|---|---|---|\n| ${BL} reaktif ve kit | 310 | Her sevkiyatta veri kaydedici çıktısı e-postayla |\n| ${MK} çerçeve sözleşme | 220 | İlk sevkiyat aralığın ilk haftası |\n| ${YV} (ihale sonucu bekleniyor) | 180 | Ön rezervasyon; ihale kazanılmazsa serbest kalır |\n| ${BM} ihracat | 40 | Tamamı 2–8°C taşıma gerektiriyor |\n| Diğer laboratuvar ve depo kit sevkiyatları | 354 | Haftalık plana göre |\n\nBerrak Lab ve Balkan Medika sevkiyatları aynı haftaya denk geliyor; öncelik sırasını Mert Aksoy'la netleştirmen gerekiyor.`,
        chips: ["SKT riski olan stok var mı?", "Sevkiyat takvimi nasıl?"],
      },
      {
        match: "eritme|fefo|lot aksiyon|skt aksiyon|çıkış planı|hangi lot|iskontolu çıkış",
        steps: ["Lot ve SKT kayıtları okunuyor…", "FEFO sırası hesaplanıyor…"],
        text: `**SKT'si yaklaşan lotlar için eritme planı**\n\nÇıkış sırası FEFO'ya göre; hedef, dört lotun (**${m(KPI.sktValue)}**) SKT'den önce müşteriye ulaşması.\n\n| Lot | Müşteri / kanal | Stok değeri | Hedef tarih | Önerilen koşul |\n|---|---|---|---|---|\n| 25A-031 (61 gün) | ${CE} kış paketi | 0,3 M₺ | İlk dalga, 23 Kasım haftası | Pakete dahil, ek iskonto yok |\n| 24K-118 (74 gün) | ${BL} ve ${ZT} | 0,5 M₺ | 27 Kasım'a kadar | Kısa vadeli teklif, %8'e kadar iskonto |\n| 24L-072 (82 gün) | ${MK} ek sevkiyat | 0,3 M₺ | İlk sevkiyatla birlikte | Çerçeve fiyatı |\n| 25B-009 (88 gün) | ${PE} | 0,2 M₺ | Aralık ortası | İskontolu teklif |\n\nİskontonun toplam maliyeti yaklaşık 0,05 M₺; SKT'si geçen ürün satılamayacağı için stok değerinin tamamı zarara döner. Mert Aksoy transferi hazırlıyor, satış tarafı müşteri teyidini bekliyor.`,
        chips: ["Soğuk zincir kapasitemiz nasıl?", "Kış kampanyası nasıl gidiyor?"],
      },
      {
        match: "servis sözleşme|cihaz|\\bsla\\b|bakım sözleşme|yenileme",
        steps: ["Servis sözleşmeleri okunuyor…"],
        text: `**Cihaz servis sözleşmeleri**\n\n${KPI.serviceContracts} aktif sözleşmenin **${KPI.serviceRenewals}'i** Aralık–Ocak döneminde yenileniyor; yıllık değer **${m(KPI.serviceRenewalValue)}**.\n\n| Müşteri | Kapsam | Yıllık değer | Bitiş | Durum |\n|---|---|---|---|---|\n| ${BL} | 9 cihaz | 0,9 M₺ | 31 Aralık | Teklif hazırlanıyor |\n| ${MK} | 6 cihaz | 0,8 M₺ | 15 Ocak | Çerçeve sözleşmeyle birleştirme önerilecek |\n| ${ZT} | 4 cihaz | 0,5 M₺ | 20 Aralık | Kit ile birlikte paket teklif isteniyor |\n| Özel poliklinikler (2 sözleşme) | 5 cihaz | 0,5 M₺ | Ocak | Yenileme hatırlatması gitti |\n\nYenilemelerde iki yıllık sözleşme karşılığında %5 iskonto öneriliyor; yanıt süresi hedefi 4 iş saati. Takip Gizem Tunç'ta, haftalık servis ve SLA toplantısında izleniyor.`,
        chips: ["Kalite denetimi nasıl gidiyor?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "kalite|denetim|gdp|uygunsuzluk|gözlem notu",
        steps: ["Kalite kayıtları okunuyor…"],
        text: "**Kalite ve denetim durumu**\n\n- İyi Dağıtım Uygulamaları (GDP) denetimi açık uygunsuzluk olmadan tamamlandı; iki gözlem notu için aksiyon planı **15 Aralık'a** kadar kapanacak.\n- Soğuk zincir depo iç denetimi iki iş günü sonra: 2–8°C kayıtları, lot ayrımı ve SKT sıralaması kontrol edilecek.\n- İç kalite denetimi (ürün kayıt ve uygunluk belgeleri): ihale dosyalarında kullanılan belgelerin geçerlilik tarihleri taranacak.\n- Aylık kalite ve uygunluk gözden geçirmesi her ayın 17'sinde; açık iade ve şikayet kayıtları orada ele alınıyor.\n\nİhale evrakı için uygunluk belgelerinin güncelliğini Deniz Arslan ve Kalite ekibi doğruluyor.",
        chips: ["İade ve şikayet kayıtları neler?", "İhale takvimi nasıl?"],
      },
      {
        match: "iade|reklamasyon|şikayet|hasarlı",
        steps: ["İade ve reklamasyon kayıtları okunuyor…"],
        text: `**İade ve şikayet kayıtları**\n\nAçık **6 iade/reklamasyon talebi** var, toplam değer yaklaşık **0,21 M₺**.\n\n| Neden | Adet | Not |\n|---|---|---|\n| Paketleme veya nakliye hasarı | 3 | Nakliyeci tazmin süreci başlatıldı |\n| Teslimde kısa raf ömrü | 2 | ${KM} ve bir bölge deposu; lot değişimi planlandı |\n| Yanlış lot veya ürün gönderimi | 1 | Sevk irsaliyesi düzeltildi, değişim yolda |\n\nOrtalama kapanış süresi 9 iş günü. Kayıtlar aylık kalite ve uygunluk gözden geçirmesinde Mert Aksoy ve Deniz Arslan'la birlikte ele alınıyor.`,
        chips: ["SKT riski olan stok var mı?"],
      },
      {
        match: "kampanya sonuç|kampanya performans|kampanya(sı)? nasıl|ilk dalga|ikinci dalga|dalga",
        steps: ["Kampanya kullanım verileri okunuyor…"],
        text: `**Kış kampanyası performansı**\n\n- Kampanya **${KPI.campaignDeals} teklifte** uygulandı; toplam teklif değeri **${m(KPI.campaignOffered)}**, siparişe dönen kısım **${m(KPI.campaignOrdered)}** (5 teklif).\n- ${CE}: 2,4 M₺, iki dalga: ilk dalga 126 eczane (1,4 M₺), ikinci dalga 86 eczane (1,0 M₺).\n- ${KE}: 0,9 M₺ ön sipariş; ${SE}: 0,8 M₺ raf planı kapsamında.\n- Diğer altı teklifin toplamı 3,1 M₺.\n- Kullanılan ek iskonto bütçesi 0,14 M₺ / 0,32 M₺.\n\nKampanya 30 Kasım'da bitiyor; onay bekleyen teklifleri Selin Aydın'la hızlandırmak gerekiyor.`,
        chips: ["Dermokozmetik kanal durumu nedir?", "Sevkiyat takvimi nasıl?"],
      },
      {
        match: "dermokozmetik|sedir|raf planı|el bakım|numune seti",
        steps: ["Dermokozmetik hesaplar okunuyor…"],
        text: `**Dermokozmetik kanal durumu**\n\n- ${PE}: yıllık 4,1 M₺ dağıtım anlaşması müzakerede (olasılık %70). Talep: ikinci kademenin %9'dan %10'a çıkması; üçüncü kademe sınırı %12, onay Selin Aydın'da.\n- ${SE}: 48 şubede kış dönemi raf planı; şube başına iki numune seti (toplam 96 set) ve güncel fiyat listesi gönderildi. Cari limit artışı (0,6 → 0,9 M₺) Finans'ta.\n- El bakım serisi kış sezonunda en hızlı dönen grup; 25A-031 lotu kooperatif kış paketine ekleniyor.\n\nRaf önceliği karşılığında yıllık asgari alım taahhüdünü sözleşmeye yazdırmak öneriliyor.`,
        chips: ["Kış kampanyası nasıl gidiyor?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ihracat|balkan|akreditif|proforma|gümrük",
        steps: ["İhracat dosyası okunuyor…"],
        text: `**İhracat siparişi — ${BM}**\n\n- Sipariş: **40 palet**, yaklaşık **1,6 M₺**; ödeme akreditifle. Tamamı 2–8°C taşıma gerektiren kit ve reaktif.\n- Belgeler: proforma fatura, ticari fatura ve çeki listesi, uygunluk belgelerinin İngilizce özeti, lot listesi; etiketlerde çok dilli kullanım bilgisi ve lot/SKT alanı.\n- Etiket baskısı için 5 iş günü gerekiyor; sevkiyat öncesi akreditif onayı Can Yıldız'da.\n- Aralıkta ${BL} sevkiyatıyla aynı haftaya denk geliyor; öncelik sırası Mert Aksoy'la netleştirilecek.\n\nDimitar Petrov ile ihracat görüşmesi takvimde.`,
        chips: ["Soğuk zincir kapasitemiz nasıl?"],
      },
      {
        match: "sevkiyat|teslimat|kargo|nakliye",
        steps: ["Sevkiyat planı okunuyor…"],
        text: `**Sevkiyat ve teslimat takvimi**\n\n| Sevkiyat | Hedef | Hacim | Durum |\n|---|---|---|---|\n| ${CE} ilk dalga | 23 Kasım haftası | 126 eczane · 1,4 M₺ | Sevk listesi lot bilgisiyle hazırlanıyor |\n| ${MK} ilk sevkiyat | Aralığın ilk haftası | 3 hastane, ayrı teslimat noktası | Sözleşme maddeleri bekleniyor |\n| ${BL} kalıcı plan | Aralık | 310 palet (2–8°C) | Veri kaydedici çıktısı e-postayla |\n| ${KE} ön sipariş | Aralık başı | 7 ürün grubu · 0,9 M₺ | Onay bekliyor |\n| ${BM} ihracat | Aralık | 40 palet | Etiket ve akreditif bekleniyor |\n\nKış yoğunluğunda ortalama teslim süresi 2,4 iş günü; yeni soğuk zincir alanıyla 6 saat kısalması hedefleniyor. Yıl sonu envanter sayımı nedeniyle 28–29 Aralık'ta çıkış sevkiyatı yapılmayacak.`,
        chips: ["Soğuk zincir kapasitemiz nasıl?", "SKT riski olan stok var mı?"],
      },
      {
        match: "yıl sonu kapanış|yıl sonu hedef|kapanış planı|bütçe kapanış|yıl sonuna",
        steps: ["Fırsat ve sevkiyat takvimi okunuyor…", "Q4 faturalama tahmini hesaplanıyor…"],
        text: `**Yıl sonu kapanış planı**\n\nQ4 hedefine kalan: **${m(KPI.quota - KPI.achieved)}**. Q4 içinde faturalanabilecek tahmini tutarlar:\n\n| Kalem | Tahmini Q4 faturası | Koşul |\n|---|---|---|\n| ${MK} çerçeve sözleşme, ilk dilim | 2,6 M₺ | SKT maddesi onayı, ilk sevkiyat aralığın ilk haftası |\n| ${CE} kış paketi | 2,4 M₺ | İki dalga teslimat |\n| ${PE} dağıtım anlaşması, ilk yükleme | 1,2 M₺ | İskonto kademeleri ve imza |\n| ${BL} reaktif ve kit | 0,8 M₺ | Numune sonrası sipariş |\n| Kış kampanyası, diğer teklifler | 0,9 M₺ | 30 Kasım'a kadar onay |\n\nToplam yaklaşık 7,9 M₺; ${YV} ihalesi ana senaryoya dahil değil, sonuç Aralık sonuna denk gelirse ek olur. Vadesi geçen ${m(KPI.overdueReceivable)} kamu alacağının tahsili nakit kapanışı için ayrıca izleniyor.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Kamu tahsilatı nasıl gidiyor?"],
      },
      {
        match: "uygulamalar|hangi uygulama|tyroforecast|tyrotrace|tyrotender|tyrocold|tyrocollect|tyroservice|tyropricing|tyroinsight|tyrosign",
        steps: ["Uygulama kataloğu okunuyor…"],
        text: "**TYRO uygulamaları (sağlık kanalı)**\n\n- *tyroForecast*: mevsimsel talep, SKT ve stok riski tahmini\n- *tyroPricing*: iskonto, vade ve ihale fiyatı simülasyonu\n- *tyroTrace*: lot/seri takibi ve uygunluk belgesi kontrolü\n- *tyroTender*: şartname okuma, evrak listesi ve son teklif tarihi uyarıları\n- *tyroCold*: 2–8°C alanı doluluğu ve sevkiyat sıcaklık kayıtları\n- *tyroCollect*: alacak yaşlandırma ve hatırlatma yazısı taslakları\n- *tyroService*: servis sözleşmesi yenileme ve SLA uyarıları\n- *tyroSign* ve *tyroInsight*: e-imza akışı ve hesap içgörüleri\n\nİş uygulamaları: Eczane Sipariş Portalı, İhale Takip Panosu, Lot ve SKT Paneli, Servis Sözleşme Yönetimi.",
        chips: ["İhale takvimi nasıl?", "SKT riski olan stok var mı?"],
      },
      // ───── genel cevaplar ─────
      {
        match: "ihale|şartname|teminat",
        steps: ["İhale takip listesi okunuyor…"],
        text: `**İhale durumu**\n\nAçık **${KPI.tenders} ihale dosyası** var, toplam **${m(KPI.tenderValue)}**.\n\n| İdare | Kapsam | Tutar | Aşama |\n|---|---|---|---|\n| ${YV} | Teşhis kiti ve cihaz servisi | 5,2 M₺ | Evrak tamamlanıyor (son tarih 20 Kasım) |\n| Gökçay Devlet Hastanesi | Sarf malzeme (9 kalem) | 1,8 M₺ | Teklif verildi, sonuç bekleniyor |\n| Bölge sağlık müdürlüğü (2 ihale) | Sarf malzeme ve kit | 2,3 M₺ | Şartname inceleniyor |\n| Üniversite hastanesi (2 ihale) | Küçük kalem sarf | 1,1 M₺ | Teklif hazırlanıyor |\n\nYeşilvadi için geçici teminat mektubu (156 bin ₺) ve iki kalemin üretici beyanı eksik; Kaan ve Derya takipte.`,
        chips: ["Kamu tahsilatı nasıl gidiyor?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "\\bskt\\b|son kullanma|stok|soğuk zincir|\\blot\\b|raf ömrü",
        steps: ["Depo ve lot kayıtları taranıyor…", "SKT sıralaması hesaplanıyor…"],
        text: `**SKT ve stok riski**\n\nÖnümüzdeki 90 günde son kullanma tarihi dolacak **${KPI.sktLots} lot** var; toplam stok değeri **${m(KPI.sktValue)}**.\n\n| Ürün grubu | Lot | Stok değeri | SKT'ye kalan | Önerilen aksiyon |\n|---|---|---|---|---|\n| Hızlı test kiti (25'li kutu) | 24K-118 | 0,5 M₺ | 74 gün | ${BL}'na kısa vadeli teklif |\n| Steril eldiven (100'lü kutu) | 24L-072 | 0,3 M₺ | 82 gün | ${MK} ek sevkiyatı |\n| El kremi ve dudak bakım seti | 25A-031 | 0,3 M₺ | 61 gün | ${CE} kış paketine ekle |\n| Yara bandı ve pansuman seti | 25B-009 | 0,2 M₺ | 88 gün | ${PE}'na iskontolu teklif |\n\n2–8°C alanındaki ürünlerin sıcaklık kayıtları eksiksiz; lot ve seri takibi ürün kayıt sistemiyle uyumlu.`,
        chips: ["Kış sezonu talebi nasıl?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "tahsilat|alacak|yaşlandırma|vade|kamu ödeme",
        steps: ["Finans kayıtları okunuyor…"],
        text: `**Kamu tahsilatı**\n\n- Açık kamu alacağı: **${m(KPI.publicReceivable)}**; ortalama tahsilat süresi **${KPI.receivableDays} gün** (geçen yıl aynı dönemde ${KPI.receivableLastYear} gün).\n- Vadesi geçen kısım: **${m(KPI.overdueReceivable)}**; en büyük kalem ${YV} (1,8 M₺, 96 gün).\n- Özel hastane ve depo kanalında ortalama vade 47 gün.\n\nCan Yıldız'la haftalık tahsilat toplantısı var. Yeni tekliflerde vade ve fiyat farkı varsayımını *tyroPricing* ile simüle edebilirsin.`,
        chips: ["İhale durumu nedir?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${m(KPI.achieved)}** / hedef ${m(KPI.quota)} (**%${KPI.achievedPct}**).\n\n- Hedefe kalan: ${m(KPI.quota - KPI.achieved)}\n- Açık pipeline: ${m(KPI.pipeline)} (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Bu ay kapanan: ${m(KPI.closedThisMonth)}\n- Açık ihale: ${KPI.tenders} dosya · kamu alacak süresi ${KPI.receivableDays} gün\n\nYıl sonu kapanışı için en kritik fırsat ${MK} çerçeve sözleşmesi (6,4 M₺); ardından ${YV} ihalesi (5,2 M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Kalem | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n| ${MK} | Tek kullanımlık sarf malzeme çerçeve sözleşmesi | 6,4 M₺ | Teklif | %60 |\n| ${YV} | Teşhis kiti ve cihaz servis sözleşmesi (ihale) | 5,2 M₺ | İhale | %45 |\n| ${PE} | Dermokozmetik dağıtım anlaşması | 4,1 M₺ | Müzakere | %70 |\n| ${BL} | Reaktif ve kit tedariği (soğuk zincir) | 3,3 M₺ | Numune | %50 |\n| ${CE} | Kış sezonu OTC paketi | 2,4 M₺ | Teklif | %65 |\n\nİlk beş fırsat 21,4 M₺; toplam açık pipeline **${m(KPI.pipeline)}** (${KPI.openDeals} fırsat).`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:15 Sabah sipariş ve stok turu\n- 14:00 ${MK} — çerçeve sözleşme teklif sunumu\n\nBu hafta ayrıca ${YV} şartname görüşmesi, ${PE} müzakeresi, soğuk zincir depo kalite denetimi ve Q4 hedef değerlendirmesi var.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu ay ${m(KPI.closedThisMonth)} kapanış gerçekleşti, kazanma oranı %${KPI.winRate}.\n- Bugün ${MK} teklif sunumu (14:00); yarın ${YV} şartname görüşmesi ve ${PE} iskonto müzakeresi.\n- Q4 hedef değerlendirmesi iki iş günü sonra: sunum hazır değil, görev listende.\n- Riskler: ${YV} ödemeleri (96 gün), SKT'si yaklaşan ${KPI.sktLots} lot (${m(KPI.sktValue)}) ve aralıkta 2–8°C alanın %92 dolu olması.`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Alan | Gerçekleşme |\n|---|---|---|\n| Kaan Özdemir | Devlet hastaneleri ve ihale | %103 |\n| Onur Polat | Depo ve eczane kanalı | %91 |\n| Gizem Tunç | Laboratuvar ve servis sözleşmeleri | %74 |\n| Zeynep Acar | Özel hastane grupları | %69 |\n| Derya Çelik | Satış operasyon ve ihale evrakı | %62 |\n\nKaan hedefi aştı; Zeynep'in Mavi Kıyı çerçeve sözleşmesi kapanırsa %90'ın üzerine çıkıyor. Derya'nın ihale evrak yükü yüksek, destek planı görev listende.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kış sezonu kampanyası**\n\n- Eczane ve depo kanalında OTC ve dermokozmetik gruplarında **12 koli üzeri siparişte %7 ek iskonto**, özel sektörde 60 gün vade.\n- Kamu ihalelerinde uygulanmaz; ihale fiyatı şartnameye göre belirlenir.\n- Şimdiye kadar 9 teklifte uygulandı; en büyüğü Çınaraltı Eczacı Kooperatifi (2,4 M₺).\n- Kampanya 30 Kasım'a kadar; ek iskonto onayı Selin Aydın'da.\n\nMarj etkisini görmek için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle", "Kış sezonu talebi nasıl?"],
      },
      {
        match: "sezon|grip|eczane|kooperatif",
        steps: ["Sipariş verileri okunuyor…"],
        text: "**Kış sezonu talebi**\n\n- Eczane siparişleri geçen yılın aynı haftasına göre **%27 yüksek**; hızlı test kiti, eldiven ve el bakım ürünleri öne çıkıyor.\n- Çınaraltı Eczacı Kooperatifi 212 eczane için iki dalgalı sipariş planlıyor: 23 Kasım haftası ve Aralık'ın ilk haftası.\n- Dağıtım merkezinde 2–8°C alanın %92'si Aralık için rezerve; yeni 1.200 palet kapasiteli alan Aralık başında devreye giriyor.\n\nStok ve SKT dengesi için *tyroForecast* tahminini inceleyebilirsin.",
        chips: ["SKT riski olan stok var mı?"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nBu yıl hakkın 22 gün, kullandığın 14 gün; **kalan 8 gün**. Aralık'ta 2 günlük bir talebin yönetici onayında.\n\nYıl sonu ihale yoğunluğu nedeniyle 15–31 Aralık arasında ekipte aynı anda en fazla iki kişi izinli olabiliyor. Yeni talep için *Self Servis*'ten ya da buradan yazabilirsin.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori (ulaşım, konaklama, müşteri yemeği, numune kargosu), tutar ve fişi ekle\n3. Gönder; yöneticin onaylar.\n\nŞu an bölge hastane ziyaretlerinden onay bekleyen bir masraf raporun var (HRMS-062418).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **3 onayın** var: Pınarlı Ecza Deposu iskonto kademeleri, Gizem Tunç'un laboratuvar ziyareti masrafı ve Kaan Özdemir'in Ankara bölge ziyareti talebi.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Satış hedefin, ihale ve fırsatların, SKT ve stok durumun, kamu tahsilatın, takvimin ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

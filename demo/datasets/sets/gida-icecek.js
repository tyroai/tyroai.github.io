// GIDA & İÇECEK veri seti — paketli gıda ve içecek satan bir FMCG satış yöneticisi haftası.
// TYRO Tech'in makarna/bakliyat, yağ, konserve-salça, atıştırmalık, süt ürünleri ve içecek gruplarını
// zincir marketlere, toptancılara, HoReCa dağıtıcılarına ve ihracat alıcılarına sattığı kurgusal bir çeyrek sonu.
// Tüm kişi, firma ve rakamlar KURGUSALDIR.
import { defineDataset } from "../define.js"

// ───── Rakamlar tek yerde: posta, görev ve asistan cevapları aynı sayıları kullanır ─────
const KPI = {
  quota: "62,0", // Q4 hedefi (milyon ₺)
  achieved: "35,3", // gerçekleşen (milyon ₺)
  achievedPct: 57,
  tonQuota: "4.100", // Q4 hacim hedefi (ton)
  tonDone: "2.340",
  koliQuota: "342 bin", // ortalama koli 12 kg
  koliDone: "195 bin",
  pipeline: "48,6", // açık pipeline (milyon ₺)
  openDeals: 19,
  winRate: 38,
  closedThisMonth: "9,4",
  otif: "93,6",
  otifTarget: 96,
  priceUp: "6,8", // Q1 liste fiyatı ortalama artışı (%)
  receivables: "21,7", // açık alacak (milyon ₺)
  overdue: "3,2", // vadesi geçen alacak (milyon ₺)
  dso: 54, // ortalama tahsilat süresi (gün)
  dsoTarget: 50,
  exportShare: 17, // ihracatın cirodaki payı (%)
  newAccounts: "12,3", // altı yeni hesabın pipeline toplamı (milyon ₺)
}

const YM = "Yeşilvadi Market Grubu" // ulusal market zinciri
const EB = "Egebahçe Hipermarketleri" // bölgesel zincir
const KG = "Kızılırmak Gıda Dağıtım" // toptancı / dağıtıcı
const LF = "Lezzetyolu Foodservice" // HoReCa dağıtıcısı
const TC = "Tazeçarşı İndirim Marketleri" // indirim marketi
const HK = "Hemenkapı Hızlı Market" // hızlı teslimat uygulaması
const ZK = "Zahrat Al-Khaleej Trading" // Körfez ihracat
const RF = "Rheinmark Feinkost GmbH" // Avrupa ithalatçısı
const KY = "Karadeniz Yolu Süpermarketleri" // bölgesel zincir (28 mağaza)
const OM = "Ormanevi Organik Market Zinciri" // premium / doğal beslenme zinciri
const SZ = "Sepetzamanı Online Market" // e-ticaret market
const BS = "Bereket Sofrası Toptan Gıda" // Konya bölgesi toptancısı
const SK = "Sofrapark Kurumsal Yemek Hizmetleri" // kurumsal yemek / HoReCa
const AD = "Adriya Foods d.o.o." // Balkan ihracat alıcısı

// En büyük açık fırsatlar (milyon ₺): beşi listelenir, kalan 14 fırsat toplamı 15,8 M₺.
const DEALS = [
  { who: YM, scope: "2027 yıllık anlaşma + yılbaşı listesi", amount: "12,4", stage: "Müzakere", prob: 70 },
  { who: ZK, scope: "Ramazan sezonu, 4 × 40' konteyner", amount: "7,1", stage: "Teklif", prob: 60 },
  { who: EB, scope: "Yeni listeleme: süt ürünleri ve atıştırmalık", amount: "5,4", stage: "Listeleme", prob: 50 },
  { who: KG, scope: "2027 Q1 fiyat listesi ve palet taahhüdü", amount: "4,6", stage: "Müzakere", prob: 65 },
  { who: LF, scope: "HoReCa yağ ve konserve yıllık anlaşması", amount: "3,3", stage: "Teklif", prob: 45 },
]
const dealRows = DEALS.map((d) => `| ${d.who} | ${d.scope} | ${d.amount} M₺ | ${d.stage} | %${d.prob} |`).join("\n")

// Yeni hesaplar: toplamı 12,3 M₺; kalan 14 fırsatın (15,8 M₺) içinde yer alır.
const NEW_DEALS = [
  { who: BS, scope: "Konya bölgesi bayi ağı, aylık 24 palet anlaşması", amount: "3,1", stage: "Müzakere", prob: 55 },
  { who: KY, scope: "28 mağaza listeleme ve Ocak ilk siparişi", amount: "2,8", stage: "Listeleme", prob: 60 },
  { who: SZ, scope: "Online market listeleme, 38 ürün kodu", amount: "1,9", stage: "Listeleme", prob: 50 },
  { who: AD, scope: "Balkan ihracat pilotu, 2 TIR makarna ve bakliyat", amount: "1,8", stage: "Teklif", prob: 40 },
  { who: OM, scope: "Organik bakliyat ve tam buğday makarna", amount: "1,4", stage: "Listeleme", prob: 45 },
  { who: SK, scope: "Kurumsal yemek yıllık fiyat anlaşması", amount: "1,3", stage: "Teklif", prob: 45 },
]
const newDealRows = NEW_DEALS.map((d) => `| ${d.who} | ${d.scope} | ${d.amount} M₺ | ${d.stage} | %${d.prob} |`).join("\n")

export default defineDataset({
  id: "gida-icecek",

  // ───────────── katalog ─────────────
  salesAgentDescription: "Hedef, fırsat, raf payı, promosyon ve ihracat siparişi sorularını yanıtlar; haftalık satış özeti hazırlar.",
  agents: [
    {
      name: "tyroTrader",
      type: "agent",
      description: "Ham madde ve döviz piyasasını izler; maliyet ve parite sorularını yanıtlar.",
      agentId: "crfc1_tyroTrader",
      icon: "ChartHistogramIcon",
    },
  ],
  apps: [
    { name: "tyroForecast", type: "ai", description: "Promosyon etkisi ve talep tahmini.", icon: "AnalyticsUpIcon" },
    { name: "tyroSign", type: "ai", description: "Zincir fiyat anlaşmaları ve ihracat sözleşmeleri için e-imza akışı.", icon: "SignatureIcon" },
    { name: "tyroPricing", type: "ai", description: "Fiyat listesi, iskonto ve ciro primi simülasyonu.", icon: "Analytics01Icon" },
    { name: "tyroInsight", type: "ai", description: "Zincir bazında satış, raf payı ve fire/iade içgörüleri.", icon: "Telescope02Icon" },
    { name: "tyroSupply", type: "ai", description: "Sevkiyat, OTIF ve ihracat konteyneri takibi.", icon: "CargoShipIcon" },
    { name: "tyroShelf", type: "ai", description: "Raf fotoğraflarından raf payı ve planogram uyumunu çıkarır.", icon: "AiBrain02Icon" },
    { name: "tyroQuality", type: "ai", description: "SKT, parti izlenebilirliği ve gıda güvenliği belgelerini izler; ihracat belge setini derler.", icon: "DocumentValidationIcon" },
    { name: "Key Account Portalı", type: "business", description: "Zincir sipariş, fiyat listesi ve mutabakat kayıtları", url: "#", icon: "Package01Icon" },
    { name: "Promosyon Planlama Sistemi", type: "business", description: "Zincir promosyon takvimi, bütçe kullanımı ve onay akışı", url: "#", icon: "Target02Icon" },
    { name: "İhracat Evrak Takibi", type: "business", description: "Konteyner, menşe şahadetnamesi ve sağlık sertifikası kayıtları", url: "#", icon: "DocumentValidationIcon" },
    { name: "Tahsilat ve Cari Takip", type: "business", description: "Vade, tahsilat ve müşteri cari bakiye görünümü", url: "#", icon: "AddInvoiceIcon" },
  ],

  weather: { now: "fog", base: 12, amp: 4, moods: ["fog", "cloudy", "lightrain", "partlycloudy", "rain", "fair"] },
  market: { rates: { USD: 44.4, EUR: 51.6, GBP: 58.3, CHF: 54.9 }, bist: 11410 },

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
      body: "Geçen haftanın sipariş ve sevkiyat sonuçları, zincir bazında pipeline ve bu haftanın öncelikleri. Gündem toplantıdan önce paylaşılır.",
    },
    {
      title: "Satış günlük 15 dk",
      recur: "daily",
      time: "09:15",
      minutes: 15,
      where: "Microsoft Teams",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat", "Gizem Tunç"],
      body: "Kısa durum turu: dünkü sevkiyatlar, bugünkü siparişler, stok ve OTIF engelleri.",
    },
    {
      title: "Pipeline ve promosyon takvimi gözden geçirme",
      recur: "weekly",
      weekday: 4,
      time: "16:00",
      minutes: 45,
      where: "Maslak · Toplantı Odası 3",
      organizer: "Ömer Gümüş",
      with: ["Zeynep Acar", "Kaan Özdemir", "Derya Çelik", "Onur Polat"],
      body: "Açık fırsatların aşama, olasılık ve kapanış tarihi kontrolü; zincir promosyon takvimi ve bütçe kullanımı.",
    },
    {
      title: "Aylık satış ve operasyon planlama (S&OP)",
      recur: "monthly",
      dom: 12,
      time: "11:00",
      minutes: 60,
      where: "Microsoft Teams",
      organizer: "Mert Aksoy",
      with: ["Ömer Gümüş", "Selin Aydın", "Can Yıldız", "Deniz Arslan", "Elif Kaya"],
      body: "Talep tahmini, üretim ve palet kapasitesi, Ramazan öncesi stok planı ve ham madde tedarik durumu.",
    },
    { title: `${YM} — yıllık anlaşma sunumu`, day: 0, time: "14:00", minutes: 90, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Taşdelen (${YM})`, "Zeynep Acar", "Mert Aksoy"], body: "2027 yıllık fiyat anlaşmasının son sunumu: ciro primi kademeleri, vade ve yılbaşı promosyon bütçesi." },
    { title: "Ham madde maliyeti ve Q1 fiyat listesi", day: 0, time: "11:00", minutes: 30, where: "Maslak · Toplantı Odası 1", organizer: "Can Yıldız", with: ["Ömer Gümüş", "Selin Aydın", "Deniz Arslan"], body: "Ayçiçek yağı, buğday, domates ve ambalaj maliyetlerinin Q1 liste fiyatına etkisi." },
    { title: `${ZK} — Ramazan sezonu sipariş görüşmesi`, day: 1, time: "10:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Tariq Mansouri (${ZK})`, "Derya Çelik", "Can Yıldız"], body: "4 konteynerlik Ramazan siparişi: ürün karması, Arapça etiket onayı, yükleme takvimi ve ödeme koşulu." },
    { title: `${KG} — Q1 fiyat listesi müzakeresi`, day: 1, time: "15:30", minutes: 60, where: "Maslak · Toplantı Odası 2", organizer: "Ömer Gümüş", with: [`Bülent Karaaslan (${KG})`, "Onur Polat", "Can Yıldız"], body: "Q1 liste fiyatı artışı, palet bazlı sipariş taahhüdü ve vade." },
    { title: "Q4 hedef değerlendirme", day: 2, time: "15:00", minutes: 60, where: "Maslak · Toplantı Odası 1", organizer: "Selin Aydın", with: ["Ömer Gümüş", "Can Yıldız", "Emre Şahin"], body: "Çeyrek sonu ton ve ciro gerçekleşmesi, yılbaşı kampanyası beklentisi ve son altı haftanın aksiyon planı." },
    { title: "Strateji çalıştayı: 2027 listeleme ve fiyat anlaşmaları (davet)", day: 3, time: "13:30", minutes: 120, where: "Microsoft Teams", organizer: "Selin Aydın", status: "notResponded", with: ["Ömer Gümüş", "Mert Aksoy", "Emre Şahin", "Deniz Arslan"], body: "2027 yıllık fiyat anlaşmaları, listeleme ve raf payı stratejisi çalıştayı. Katılımınızı bekliyoruz." },
    { title: `${EB} — raf planı ve listeleme görüşmesi`, day: 3, time: "11:00", minutes: 90, where: "İzmir · Egebahçe Genel Müdürlük", organizer: "Ömer Gümüş", with: [`Nilay Ersöz (${EB})`, "Kaan Özdemir", "Emre Şahin"], body: "Süt ürünleri ve atıştırmalıkta 14 yeni ürün kodunun listelenmesi, Ocak raf planı revizyonu." },
    { title: `${LF} — ürün tadım günü`, day: 4, time: "10:00", minutes: 120, where: "Gebze · Lezzetyolu Test Mutfağı", organizer: "Onur Polat", with: [`Tuğba Sevinç (${LF})`, "Onur Polat", "Deniz Arslan"], body: "Şeflerle 5 L yağ, 3 kg salça ve 1 kg yoğurt tadımı; HoReCa menü planlaması." },
    { title: "Gıda güvenliği ve etiket mevzuatı eğitimi", day: 5, time: "10:00", minutes: 180, where: "Maslak · Eğitim Salonu", organizer: "Ayşe Demir", with: ["Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir", "Onur Polat"], body: "TYRO Eğitim: alerjen bildirimi, etiket mevzuatı ve gıda güvenliği; satış ekipleri için zorunlu oturum." },
    { title: `${RF} — numune ve belge görüşmesi`, day: 6, time: "16:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Matthias Kellner (${RF})`, "Derya Çelik", "Mert Aksoy"], body: "Salça ve konserve numune analizi sonuçları, IFS belge seti ve Almanca içerik bildirimi." },
    { title: `${TC} — Ocak kampanya takvimi`, day: 7, time: "11:00", minutes: 60, where: "Microsoft Teams", organizer: "Kaan Özdemir", with: [`Volkan Erim (${TC})`, "Ömer Gümüş", "Kaan Özdemir"], body: "Atıştırmalık çoklu paket ve meyve suyu kampanyası, afiş katkı payı ve ciro primi." },
    { title: "Balkan pazarı ilk müşteri ziyareti — Bükreş (iş gezisi)", day: 11, allDay: true, span: 3, where: "Bükreş", organizer: "Ömer Gümüş", with: ["Ömer Gümüş", "Selin Aydın", "Gizem Tunç"], body: "İlk ihracat sevkiyatı öncesi zincir mağaza alımcılarıyla tanışma ve raf planı görüşmeleri. Uçuş ve otel ayarlandı." },
    { title: "Gıda ve İçecek Sektör Fuarı — ziyaretçi günü", day: 8, allDay: true, span: 2, where: "İstanbul · Fuar Alanı", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Emre Şahin", "Kaan Özdemir"], body: "TYRO standında zincir ve ihracat alıcı görüşmeleri; yeni 350 g makarna ve bar serisi tanıtımı." },
    { title: `${HK} — hızlı teslimat pilot kapsamı`, day: 9, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Ece Taşkın (${HK})`, "Ömer Gümüş", "Gizem Tunç"], body: "Küçük gramaj ürün listesi, minimum SKT şartı ve haftalık sevkiyat düzeni." },
    // geçmiş
    { title: `${YM} — kampanya ve promosyon bütçesi`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Taşdelen (${YM})`, "Zeynep Acar"], body: "Yılbaşı döneminde makarna ve salça için ikinci ürün promosyonu ve 1,8 M₺ bütçe çerçevesi." },
    { title: `${TC} — fiyat artışı ön görüşmesi`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Kaan Özdemir", with: [`Volkan Erim (${TC})`, "Ömer Gümüş", "Kaan Özdemir"], body: "Ham madde kaynaklı fiyat artışının gerekçeleri ve ciro primi talebi." },
    { title: "Depo çıkış ve OTIF değerlendirmesi", day: -3, time: "10:00", minutes: 45, where: "Maslak · Toplantı Odası 2", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Gizem Tunç", "Derya Çelik"], body: "Palet tamamlama gecikmeleri, sevkiyat hataları ve Aralık yoğunluğu için önlemler." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -4, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Hızlı teslimat kanalı hedefi, iade süreci ve gelişim planı." },

    // ───── ek tekrarlı toplantılar ─────
    { title: "Key account haftalık durum turu", recur: "weekly", weekday: 3, time: "14:00", minutes: 30, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: ["Zeynep Acar", "Kaan Özdemir", "Onur Polat", "Gizem Tunç"], body: "Zincir ve dağıtıcı hesaplarında bekleyen kararlar: ciro primi, vade, listeleme ve promosyon onayları. Her karar için sahibi ve tarih belirlenir." },
    { title: "İhracat operasyon haftalık kontrolü", recur: "weekly", weekday: 2, time: "16:30", minutes: 30, where: "Microsoft Teams", organizer: "Derya Çelik", with: ["Ömer Gümüş", "Mert Aksoy", "Can Yıldız"], body: "Konteyner rezervasyonu, yükleme tarihleri, etiket onayları ve ihracat belgeleri; alıcı bazında ödeme durumu." },
    { title: "Haftalık OTIF ve depo çıkış kontrolü", recur: "weekly", weekday: 5, time: "10:30", minutes: 30, where: "Maslak · Toplantı Odası 2", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Gizem Tunç", "Derya Çelik"], body: "Geçen haftanın OTIF sonuçları, gecikme nedenleri ve zincir bazında sevkiyat öncelikleri." },
    { title: "Aylık tahsilat ve vade takibi", recur: "monthly", dom: 20, time: "14:30", minutes: 45, where: "Microsoft Teams", organizer: "Can Yıldız", with: ["Ömer Gümüş", "Selin Aydın", "Zeynep Acar", "Onur Polat"], body: "Vadesi geçen bakiyeler, müşteri bazında tahsilat sözleri, kredi limiti istisnaları ve DSO hedefi." },

    // ───── ek tek seferlik toplantılar: gelecek ─────
    { title: "Ekip 1:1 — Zeynep Acar", day: 1, time: "16:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Zeynep Acar"], body: "Yeşilvadi sunumu sonrası geri bildirim, ciro primi kademeleri ve Q4 gerçekleşmesi." },
    { title: `${KY} — Ocak ilk sipariş ve palet planı`, day: 2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Fikret Doğan (${KY})`, "Kaan Özdemir", "Mert Aksoy"], body: "14 paletlik ilk sipariş, merkez depo kabul koşulları (07:00–15:00, en fazla 1,6 m palet) ve barkodlu ürün kartlarının teslimi." },
    { title: "Ekip 1:1 — Kaan Özdemir", day: 2, time: "13:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Kaan Özdemir"], body: "Bölgesel zincir hedefi, Egebahçe süt ürünleri rafı fotoğraf analizi ve Ege–Trakya ziyaret planı." },
    { title: `${BS} — bayi anlaşması ve palet siparişi`, day: 3, time: "16:00", minutes: 60, where: "Microsoft Teams", organizer: "Onur Polat", with: [`Recep Akbulut (${BS})`, "Ömer Gümüş", "Onur Polat", "Can Yıldız"], body: "Konya bölgesindeki 140 bayi için aylık 24 palet karışık sipariş, 45 gün vade talebi ve ilk iki ay geçiş indirimi." },
    { title: "Ekip 1:1 — Onur Polat", day: 4, time: "15:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Onur Polat"], body: "Toptancı taahhütleri, dağıtıcı müzakere eğitimi talebi ve Bereket Sofrası sonrası aksiyonlar." },
    { title: `${OM} — doğal beslenme reyonu ürün sunumu`, day: 5, time: "15:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Cansu Bilgiç (${OM})`, "Deniz Arslan", "Kaan Özdemir"], body: "Organik bakliyat ve tam buğday makarna için ürün kartları, sertifika dosyası ve listeleme komitesi takvimi." },
    { title: `${SK} — kurumsal yemek menüsü ve yıllık fiyat`, day: 6, time: "11:00", minutes: 60, where: "İstanbul · Sofrapark Merkez Mutfağı", organizer: "Onur Polat", with: [`Şule Kırmızıgül (${SK})`, "Onur Polat", "Deniz Arslan"], body: "Aylık yaklaşık 18 tonluk tüketim için 5 L yağ, 3 kg salça, 5 kg makarna ve 2,5 kg bakliyatta yıl boyu sabit fiyat bandı ve 45 gün vade." },
    { title: "Yılbaşı kampanyası lansman hazırlığı (davet)", day: 6, time: "14:30", minutes: 60, where: "Microsoft Teams", organizer: "Emre Şahin", status: "notResponded", with: ["Ömer Gümüş", "Kaan Özdemir", "Zeynep Acar", "Mert Aksoy"], body: "Afiş ve broşür dağıtımı, mağaza içi uygulama kontrolü ve iskonto onay akışı hazırlığı. Katılımınızı bekliyoruz." },
    { title: "Ekip 1:1 — Derya Çelik", day: 7, time: "14:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Derya Çelik"], body: "İhracat belge süreci, Zahrat etiket onayı ve yeni ihracat operasyon uzmanıyla iş bölümü." },
    { title: `${AD} — Balkan ihracat tanışma görüşmesi`, day: 9, time: "10:00", minutes: 45, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Marko Jelić (${AD})`, "Derya Çelik", "Mert Aksoy"], body: "İki TIR'lık ilk sipariş için CPT fiyat, yerel dilde etiket ve ürün analiz belgeleri." },
    { title: `${YM} — Ocak planogram revizyonu çalışma oturumu`, day: 10, time: "11:30", minutes: 90, where: "İstanbul · Yeşilvadi Genel Müdürlük", organizer: "Zeynep Acar", with: [`Serkan Taşdelen (${YM})`, "Ömer Gümüş", "Zeynep Acar", "Kaan Özdemir"], body: "Makarna ve bakliyat rafında göz hizası blokları, 40 örnek mağaza fotoğrafı ve promosyon sonrası stok doluluğu şartı." },
    { title: "Ekip 1:1 — Gizem Tunç", day: 10, time: "15:00", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Hemenkapı pilot sevkiyatı, Sepetzamanı listeleme içeriği ve iade sürecindeki iyileştirmeler." },
    { title: "Ege ve Trakya bölge ziyareti", day: 11, allDay: true, span: 2, where: "İzmir · Tekirdağ", organizer: "Kaan Özdemir", with: ["Ömer Gümüş", "Kaan Özdemir"], body: "Egebahçe mağazalarında raf kontrolü ve Trakya'daki üç toptancı ziyareti; çekilen raf fotoğrafları raf payı analizine eklenecek." },
    { title: `${SZ} — ilk sipariş ve kampanya takvimi`, day: 12, time: "15:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Pelin Karagöz (${SZ})`, "Ömer Gümüş", "Gizem Tunç"], body: "38 ürünün yayına alınması, ilk sipariş miktarları ve liste fiyatı değişikliklerinde 10 günlük bildirim süresi." },

    // ───── ek tek seferlik toplantılar: geçmiş ─────
    { title: `${KY} — tanışma ve ilk liste görüşmesi`, day: -1, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Fikret Doğan (${KY})`, "Kaan Özdemir"], body: "28 mağazalı zincirin kategori yapısı, listeleme kriterleri ve ilk fiyat çerçevesi." },
    { title: `${SZ} — online market listeleme görüşmesi`, day: -2, time: "15:30", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Pelin Karagöz (${SZ})`, "Ömer Gümüş", "Gizem Tunç"], body: "Ürün içerik şablonu, görsel standartları ve online kanalda fiyat güncelleme süreci." },
    { title: "İhracat belge ve IFS kontrol toplantısı", day: -5, time: "11:00", minutes: 45, where: "Maslak · Toplantı Odası 1", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Derya Çelik", "Can Yıldız"], body: "Rheinmark ve Zahrat için belge setleri, IFS kopyası ve pestisit analiz raporlarının eksiksiz listesi." },
    { title: `${SK} — numune geri bildirim görüşmesi`, day: -6, time: "10:30", minutes: 45, where: "Microsoft Teams", organizer: "Onur Polat", with: [`Şule Kırmızıgül (${SK})`, "Onur Polat", "Ömer Gümüş"], body: "Numune ürünlerin kurumsal mutfaklarda testi, gramaj ve ambalaj geri bildirimleri." },
    { title: "Müşteri iade ve şikâyet analizi", day: -7, time: "14:00", minutes: 60, where: "Maslak · Toplantı Odası 3", organizer: "Gizem Tunç", with: ["Ömer Gümüş", "Zeynep Acar", "Mert Aksoy"], body: "Üçüncü çeyrek iade ve şikâyet nedenleri, SKT kaynaklı iadelerin zincirlere dağılımı ve önleyici aksiyonlar." },
  ],

  // ───────────── posta ─────────────
  mail: [
    {
      from: `Serkan Taşdelen (${YM})`,
      subject: "Re: 2027 yıllık fiyat anlaşması taslağı",
      at: { hoursAgo: 2 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Taslağınızı satın alma ve kategori ekipleriyle inceledik. Genel çerçeve uygun; ciro primi kademelerinde ikinci basamağı %2,5'ten %3'e çekmenizi ve ödeme vadesini 60 günden 75 güne uzatmanızı rica ediyoruz. Bugünkü sunumda konuşalım.",
        "Yılbaşı döneminde ilk 400 mağazada makarna ve salça için ikinci ürün promosyonunu devreye almak istiyoruz; bütçe önerinizi sunuma ekleyebilir misiniz?",
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
        `Q4 değerlendirmesi için ekibin rakamlarını tek sayfada görmek istiyorum. Şu an hedefin %${KPI.achievedPct}'indeyiz (${KPI.achieved} M₺ / ${KPI.quota} M₺; ${KPI.tonDone} ton / ${KPI.tonQuota} ton); açık pipeline ${KPI.pipeline} M₺.`,
        "Yeşilvadi yıllık anlaşması ile Zahrat'ın Ramazan siparişi çeyreği kapatmanın anahtarı. İkisi için benden istediğin desteği ve OTIF'teki sapmanın nedenini de sayfaya ekle lütfen.",
      ],
    },
    {
      from: `Tariq Mansouri (${ZK})`,
      subject: "Ramazan sezonu: 4 konteyner niyet mektubu",
      at: { days: 1, time: "17:40" },
      unread: true,
      body: [
        "Sayın Ömer Bey,",
        "Ramazan sezonu için dört adet 40' konteyner planlıyoruz: makarna (500 g), ayçiçek yağı (1 L ve 2 L), domates salçası (700 g) ve bakliyat. İlk iki konteynerin Ocak'ın ilk haftasında yüklenmesi gerekiyor.",
        "Arapça etiket onaylarını bu hafta gönderebiliriz. Fiyatları USD bazlı ve FOB olarak güncel liste üzerinden teyit eder misiniz?",
      ],
    },
    {
      from: "Can Yıldız",
      subject: `${TC} — ciro primi ve vade onayı`,
      at: { days: 1, time: "11:10" },
      flagged: true,
      body: ["Merhaba Ömer,", "Tazeçarşı için talep edilen %2 ek ciro primi ve 45 günden 60 güne vade uzatımı için satış onayı bekliyorum. Kredi limiti uygun; ancak vade uzarsa Q4 tahsilat planı 0,6 M₺ kayıyor. Onayını yazılı iletirsen kayda geçeceğim."],
    },
    {
      from: `Nilay Ersöz (${EB})`,
      subject: "Yeni listeleme: süt ürünleri ve atıştırmalık raf planı",
      at: { days: 1, time: "14:20" },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Toplantıdan üç gün önce 14 yeni ürün kodunun (SKU) barkod, koli ve palet ölçülerini iletmenizi rica ederiz. Ocak raf planı revizyonuna yetişmesi için listeleme dosyasının Aralık ortasına kadar tamamlanması gerekiyor.",
        "Süt ürünleri rafında şu an %6 payınız var; hedefiniz %10 ise yeni ürünlerin yanında promosyon desteğini de konuşmamız gerekecek.",
      ],
    },
    {
      from: `Bülent Karaaslan (${KG})`,
      subject: "2027 Q1 fiyat listesi geri bildirimi",
      at: { days: 2, time: "16:05" },
      body: ["Ömer Bey,", `Q1 listesindeki ortalama %${KPI.priceUp}'lik artışı bayilerimize taşımakta zorlanıyoruz. Ayçiçek yağı ve makarnada artışın %4,5'i geçmemesini, karşılığında Ocak'ta palet bazlı sipariş taahhüdü vermeyi öneriyoruz. Görüşmemizde rakamlarla konuşalım.`],
    },
    {
      from: "Mert Aksoy",
      subject: "Aralık sevkiyat takvimi ve palet kapasitesi",
      at: { days: 2, time: "10:30" },
      body: ["Ömer,", "Yılbaşı kampanyası nedeniyle Aralık'ın ilk iki haftasında depo çıkış kapasitesi %92 dolu görünüyor. İki zincirin kampanya siparişi aynı güne denk geliyor; öncelik sırasını satış tarafından netleştirebilir misin? Aksi halde OTIF'te yine 2–3 puan kaybederiz."],
    },
    {
      from: "Derya Çelik",
      subject: "Haftalık satış raporu — 45. hafta",
      at: { days: 3, time: "17:15" },
      flagged: true,
      body: ["Merhaba Ömer Bey,", `Bu ay şimdiye dek ${KPI.closedThisMonth} M₺ kapanış gerçekleşti; kazanma oranı %${KPI.winRate}, OTIF %${KPI.otif}. İhracat konteyner takibi ve zincir bazlı kırılımlar raporda; dosya paylaşılan klasörde.`],
    },
    {
      from: "Gizem Tunç",
      subject: "Zincir iade ve SKT riski raporu — Ekim",
      at: { days: 3, time: "11:00" },
      body: ["Merhaba Ömer Bey,", "Ekim iade raporunu hazırladım: zincir iadeleri ciroda %1,4 (Eylül'de %1,9). SKT'si 60 günün altına inen 38 palet var; çoğu meyve suyu ve süt ürünü. Hangi zincire öncelik vereceğimizi toplantıda konuşabilir miyiz?"],
    },
    {
      from: `Tuğba Sevinç (${LF})`,
      subject: "Tadım günü ve numune listesi",
      at: { days: 4, time: "09:50" },
      body: ["Merhaba Ömer Bey,", "Tadım gününde şefler 1 kg'lık yoğurt, 5 L ayçiçek yağı ve 3 kg'lık domates salçasını test etmek istiyor. Numunelerin bir gün önceden Gebze'ye ulaşması yeterli. Menü planlaması için yıllık HoReCa fiyat listesini de bekliyoruz."],
    },
    {
      from: `Matthias Kellner (${RF})`,
      subject: "Numune sevkiyatı ve gıda güvenliği belgeleri",
      at: { days: 5, time: "11:30" },
      body: ["Sayın Ömer Bey,", "Salça ve konserve numunelerini aldık, kalite ekibimiz analiz sürecini başlattı. Konteyner siparişi öncesinde IFS belgenizin güncel kopyasını ve pestisit kalıntı analiz raporlarını iletmenizi rica ederiz. Etiketlerde Almanca içerik bildirimi de gerekecek."],
    },
    {
      from: `Volkan Erim (${TC})`,
      subject: "Ocak kampanya takvimi ve afiş bütçesi",
      at: { days: 5, time: "13:25" },
      body: ["Merhaba Ömer Bey,", "Ocak ayı için atıştırmalık çoklu paket ve meyve suyu kampanyasını planlıyoruz. Mağaza içi afiş ve broşür katkı payı için 0,35 M₺ bütçe bekliyoruz. Takvim ve bütçe önerinizi görüşmemizde netleştirelim."],
    },
    {
      from: `Ece Taşkın (${HK})`,
      subject: "Hızlı teslimat pilotu: küçük gramaj listesi",
      at: { days: 6, time: "15:40" },
      important: true,
      body: ["Merhaba Ömer Bey,", "Uygulamamız için 250–500 ml arası içecekler, atıştırmalık ve 200 g makarna gibi küçük gramaj ürünler istiyoruz. İstanbul'da 6 noktamız var; haftada iki sevkiyatla başlayalım. Teslimatta minimum SKT 120 gün olmalı."],
    },
    { from: "Kaan Özdemir", subject: "Bölge ziyaret planı — Ege ve Trakya", at: { days: 7, time: "12:00" }, body: ["Ömer Bey, Egebahçe mağazaları ile Trakya'daki üç toptancı ziyaretini iki güne topladım. Plan ekte; onayınızla randevuları sabitleyeceğim. Ziyaretlerde raf fotoğraflarını da çekip raf payı analizine ekleyeceğim."] },
    { from: "Emre Şahin", subject: "Yılbaşı kampanya afişi ve broşür onayı", at: { days: 8, time: "10:10" }, body: ["Ömer merhaba, yılbaşı kampanyasının mağaza içi afiş ve broşür tasarımı ekte. Palet iskonto oranlarını ve kampanya tarihlerini son bir kez satış tarafı da kontrol etsin istedik."] },
    { from: "Elif Kaya", subject: "Talep tahmini modeli güncellendi", at: { days: 9, time: "16:30" }, body: ["Ömer Bey, tyroForecast'teki talep tahmini modelini yılbaşı ve Ramazan sezonunu içerecek şekilde güncelledim. Promosyon haftalarında tahmin hatası %11'den %7'ye indi."] },
    { from: "Deniz Arslan", subject: "350 g makarna: yeni gramaj ve ambalaj", at: { days: 10, time: "10:20" }, body: ["Ömer, 350 g tam buğday makarna için ambalaj tasarımı ve barkodlar tamamlandı; ilk üretim Aralık sonunda. Satış sunumundaki ürün kartını güncelledim, zincirlerle paylaşabilirsin."] },

    // ───── yeni müşteriler ve ek iç yazışmalar ─────
    {
      from: `Fikret Doğan (${KY})`,
      subject: "İlk sipariş için palet düzeni ve teslimat penceresi",
      at: { minutesAgo: 40 },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Görüşmemizin ardından 28 mağazamızı besleyen merkez depomuzun kabul koşullarını iletiyorum: teslimat yalnızca 07:00–15:00 arasında kabul ediliyor, palet yüksekliği en fazla 1,6 m olmalı ve her palette tek ürün kodu tercih ediyoruz.",
        "İlk siparişi 14 palet olarak planlıyoruz; ağırlık makarna, bakliyat ve 5 L yağda. Barkodlu ürün kartlarını ve palet etiketi örneğinizi bu hafta gönderirseniz sistem tanımlarını Aralık başında açabiliriz.",
      ],
    },
    {
      from: `Şule Kırmızıgül (${SK})`,
      subject: "Kurumsal yemek menüleri için yıllık fiyat talebi",
      at: { hoursAgo: 3 },
      unread: true,
      body: [
        "Merhaba Ömer Bey,",
        "Fabrika ve okul yemekhanelerine hizmet veren üç merkez mutfağımızın 2027 menü planı Aralık'ta kesinleşiyor. 5 L ayçiçek yağı, 3 kg domates salçası, 5 kg makarna ve 2,5 kg bakliyat için yıl boyu geçerli sabit bir fiyat bandı teklif edebilir misiniz?",
        "Aylık tüketimimiz yaklaşık 18 ton; teslimat haftada iki kez merkez depoya, ödeme vadesi ise 45 gün olacak şekilde düşünüyoruz.",
      ],
    },
    {
      from: "Kaan Özdemir",
      subject: "Egebahçe raf fotoğrafları: süt ürünleri rafı",
      at: { hoursAgo: 6 },
      body: [
        "Ömer Bey,",
        "İzmir'deki üç mağazada süt ürünleri rafını fotoğrafladım. Bizim ürünlerimiz altı raf bloğundan yalnızca birinde ve en üst rafta kalıyor; rakip yoğurt serisi iki blok işgal ediyor.",
        "Listeleme görüşmesinde göz hizası talebini bu fotoğraflarla destekleyebiliriz. Dosyayı ortak klasöre yükledim.",
      ],
    },
    {
      from: "Zeynep Acar",
      subject: "Yeşilvadi sunumu için son kontrol listesi",
      at: { days: 1, time: "09:40" },
      flagged: true,
      body: [
        "Ömer Bey merhaba,",
        "Sunum öncesi üç kalem için onayını bekliyorum: ciro primi tablosundaki üçüncü kademe eşiği (yıllık 9,5 M₺), promosyon bütçesinin mağaza sayısına göre dağılımı ve SKT eşiği için önerdiğimiz cümle.",
        "Serkan Bey'in ekibi geçen görüşmede makarna raf payını %19'a çıkarma hedefimizi sorgulamıştı; planogram örneğini ek slayt olarak ekledim.",
      ],
    },
    {
      from: `Cansu Bilgiç (${OM})`,
      subject: "Organik bakliyat serisi: sertifika ve ürün kartı talebi",
      at: { days: 2, time: "10:15" },
      unread: true,
      important: true,
      body: [
        "Merhaba Ömer Bey,",
        "Ormanevi'nde organik etiketli ürünler için organik sertifika kopyası, izlenebilirlik formu ve ürün bazında menşe beyanı zorunlu. Tam buğday makarna için ayrıca lif ve şeker oranı ile katkı maddesi beyanını görmek isteriz.",
        "Listeleme komitemiz ayda bir toplanıyor; dosyayı Aralık'ın ilk haftasına kadar iletirseniz Ocak komitesine yetişir. Promosyondan çok mağaza içi tadım köşesi ve broşür katkısı konuşmayı tercih ediyoruz.",
      ],
    },
    {
      from: `Recep Akbulut (${BS})`,
      subject: "Ocak palet siparişi ve vade önerimiz",
      at: { days: 2, time: "12:40" },
      body: [
        "Ömer Bey merhaba,",
        "Konya, Karaman ve Aksaray'daki 140 bayimizin Ocak ihtiyacı için 24 palet karışık sipariş planlıyoruz: makarna, bakliyat ve 5 L yağ. Palet bazlı anlaşmada vadeyi 45 gün istiyoruz; karşılığında siparişi her ay başında tek seferde vereceğiz.",
        `Liste fiyatındaki %${KPI.priceUp}'lik artışın bayilere yansıması için ilk iki ay geçiş indirimi konuşabilir miyiz?`,
      ],
    },
    {
      from: `Marko Jelić (${AD})`,
      subject: "Balkan pazarı: ilk sipariş için fiyat ve belge talebi",
      at: { days: 3, time: "15:50" },
      unread: true,
      body: [
        "Sayın Ömer Bey,",
        "Balkan ülkelerindeki 60 perakende noktamıza makarna ve bakliyat tedarik etmek istiyoruz. İlk sipariş olarak iki TIR (66 palet) için CPT teslim fiyat teklifinizi bekliyoruz.",
        "Etiketlerde yerel dilde içerik ve alerjen bildirimi, ayrıca ürün analiz sertifikaları gerekiyor. Belge listenizi paylaşırsanız eksikleri birlikte tamamlayabiliriz.",
      ],
    },
    {
      from: `Pelin Karagöz (${SZ})`,
      subject: "Online listeleme: ürün görselleri ve içerik dosyası",
      at: { days: 3, time: "09:20" },
      body: [
        "Merhaba Ömer Bey,",
        "Uygulamamızda ürün sayfalarının yayına alınması için 38 ürün kodunun beyaz zeminli görselleri (en az 1200 px), net ağırlık, içindekiler ve alerjen bilgisi tek bir şablon dosyada gerekiyor. Şablon ektedir.",
        "Online kanalda kampanya fiyatlarını kendi sistemimizde güncellediğimiz için liste fiyatı değişikliklerini en az 10 gün önceden bildirmenizi rica ederiz.",
      ],
    },
    {
      from: "Can Yıldız",
      subject: "Vadesi geçen bakiyeler ve Q4 tahsilat planı",
      at: { days: 4, time: "15:20" },
      flagged: true,
      important: true,
      body: [
        "Ömer,",
        `Açık alacak ${KPI.receivables} M₺; bunun ${KPI.overdue} M₺'si vadesi geçmiş durumda. DSO ${KPI.dso} gün, hedefimiz ${KPI.dsoTarget}.`,
        "En büyük kalemler Kızılırmak (1,2 M₺) ve Egebahçe (0,8 M₺). Satış tarafında müşteri bazlı bir arama listesi çıkarırsan çeyrek kapanışından önce tahsilat toplantılarını ayarlayabiliriz.",
      ],
    },
    {
      from: "Onur Polat",
      subject: "Toptancı ziyaretleri: sipariş taahhütleri",
      at: { days: 5, time: "09:35" },
      body: [
        "Ömer Bey,",
        "Kızılırmak ve Bereket Sofrası bayi toplantılarından sonra aylık toplam 52 palet taahhüt almaya yakınız (28 + 24 palet). En hassas konu yağ ve makarnadaki fiyat artışı; esneyebileceğimiz sınırı konuşmak için sizden 10 dakika rica ediyorum.",
      ],
    },
    {
      from: "Deniz Arslan",
      subject: "Maliyet kartları güncellendi: ayçiçek yağı ve ambalaj",
      at: { days: 5, time: "14:15" },
      body: [
        "Ömer,",
        "Ürün maliyet kartlarını son tedarikçi tekliflerine göre güncelledim: ayçiçek yağında +%9, teneke ve PET ambalajda +%7. Mevcut listeyle 5 L yağ bidonunda brüt marj 1,6 puan düşüyor.",
        "Kartları ortak klasöre koydum; fiyat artışı müzakeresinde kalem bazlı gerekçe olarak kullanabilirsin.",
      ],
    },
    {
      from: "Emre Şahin",
      subject: "Sektör fuarı: stant planı ve randevu listesi",
      at: { days: 6, time: "10:45" },
      body: [
        "Ömer merhaba,",
        "Fuar standının yerleşim planı onaylandı: 36 m², tadım köşesi ve görüşme masası var. Randevu listesinde şu an 11 zincir ve ihracat alıcısı yer alıyor; senden öncelikli ek hesapları bekliyorum. 350 g makarna ve bar serisi numunelerini Mert'le birlikte sevk edeceğiz.",
      ],
    },
    {
      from: "Mert Aksoy",
      subject: "Konteyner rezervasyonu: Ocak ilk hafta yükleme penceresi",
      at: { days: 6, time: "09:10" },
      flagged: true,
      body: [
        "Ömer,",
        "Zahrat'ın ilk iki konteyneri için armatörden Ocak'ın ilk haftasına rezervasyon opsiyonu aldım; opsiyon 12 gün geçerli. Kesinleştirmek için alıcıdan Arapça etiket onayı gelmeli, yoksa üretimi bekletmek zorunda kalırız.",
        "Derya ile birlikte alıcıya bu hafta hatırlatma yapabilir misiniz?",
      ],
    },
    {
      from: "Selin Aydın",
      subject: "2027 kota dağılımı için ekip önerileri",
      at: { days: 8, time: "16:45" },
      unread: true,
      body: [
        "Ömer merhaba,",
        "2027 kota çalışmasında kanal bazlı dağılımı ilk kez ihracat ve online kanalı ayrı kalemler olarak görmek istiyorum. Ekibin bölge ve zincir bazında gerçekçi önerilerini birleştirip bana iletir misin?",
        "Gerçekleşmeye göre %18'lik bir büyüme çerçevesiyle başlayalım; yeni hesapların (Karadeniz Yolu, Bereket Sofrası, Sepetzamanı) katkısını ayrı göster lütfen.",
      ],
    },
    {
      from: `Serkan Taşdelen (${YM})`,
      subject: "Planogram revizyonu: raf fotoğrafları ve mağaza listesi",
      at: { days: 9, time: "11:20" },
      body: [
        "Ömer Bey,",
        "Ocak planogram revizyonu için 40 örnek mağazadaki mevcut raf fotoğraflarını kategori ekibimiz paylaştı. Makarna rafında bazı rakip ürünler üçüncü bloğa taşınıyor; 500 g serinizi göz hizasına alabiliriz.",
        "Buna karşılık promosyon sonrası stok doluluğunu %95'in üzerinde tutmanızı bekliyoruz.",
      ],
    },
    {
      from: `Nilay Ersöz (${EB})`,
      subject: "Meyve suyu rafı: promosyon penceresi ve fiyat etiketleri",
      at: { days: 10, time: "13:50" },
      body: [
        "Merhaba Ömer Bey,",
        "Meyve suyunda raf payınız %9; Ocak–Şubat döneminde %11'e çıkmak için üç haftalık bir promosyon penceresi açabiliriz. Elektronik raf etiketlerine fiyatların 7 gün önceden girilmesi gerektiğinden indirim oranlarını erken bildirmenizi rica ederiz.",
      ],
    },
    {
      from: `Volkan Erim (${TC})`,
      subject: "SKT ve iade mutabakatı: Ekim dönemi",
      at: { days: 11, time: "10:05" },
      body: [
        "Ömer Bey,",
        "Ekim iade mutabakatımızda 14 faturanın SKT kaynaklı iade tutarı ile sizin kayıtlarınız arasında 0,12 M₺ fark çıktı. İade onay formlarını ekledik; farkı kapatmak için finans ekiplerimizi bu hafta buluşturmayı öneriyoruz.",
      ],
    },
    {
      from: `Tuğba Sevinç (${LF})`,
      subject: "Tadım sonrası geri bildirim ve numune talebi",
      at: { days: 12, time: "14:35" },
      body: [
        "Merhaba Ömer Bey,",
        "Şeflerimiz salçanın asitliğinden ve yoğurdun kıvamından memnun kaldı; 5 L yağda ise dökme kolaylığı için musluklu bidon istiyorlar. Ayrıca iki yeni restoran konseptimiz için 1 kg bulgur ve nohut numunelerini rica ediyoruz.",
      ],
    },
    {
      from: "Ayşe Demir",
      subject: "Ekibin 2027 izin planı girişleri",
      at: { days: 13, time: "09:25" },
      body: [
        "Ömer Bey merhaba,",
        "Ekibinizden henüz Onur Polat ve Gizem Tunç izin planını sisteme girmedi. 30 Kasım'a kadar girilmeyen planlar için varsayılan olarak yılbaşı haftası işaretlenecek. Satış ekibinin Aralık ortasındaki yoğunluğu not edildi.",
      ],
    },
    {
      from: "Gizem Tunç",
      subject: "Hemenkapı pilot: haftalık sevkiyat takvimi taslağı",
      at: { days: 14, time: "14:10" },
      body: [
        "Ömer Bey,",
        "Hemenkapı pilotunun sevkiyat takvimini taslak olarak çıkardım: Gebze çıkışlı haftada iki sevkiyat, her biri 6 noktaya 4 palet. Minimum SKT 120 gün şartı nedeniyle meyve suyunda ilk partiyi taze üretimden ayırdım.",
      ],
    },

    // ───── Keşfet akışı: kurumsal kaynaklar ─────
    { feed: "haberler", subject: "TYRO Tech 2026 üçüncü çeyrek sonuçları açıklandı", at: { days: 1, time: "09:05" }, body: ["Şirketimiz üçüncü çeyreği geçen yılın aynı dönemine göre %14 büyümeyle tamamladı; satış hacmi 9.800 tona ulaştı.", "Büyümenin itici gücü zincir market kanalı ve ihracat oldu; ihracatın cirodaki payı %17'ye çıktı. Tüm ekiplerimize teşekkür ederiz."] },
    { feed: "haberler", subject: "Gebze tesisinde yeni içecek dolum hattı devreye alındı", at: { days: 4, time: "10:20" }, body: ["Gebze tesisimizdeki yeni dolum hattı dün ilk üretimini yaptı. Saatte 24.000 şişe kapasiteli hat, meyve suyu ve gazsız içecek üretimimizi %30 artıracak.", "Ürün geçişleri hızlandığı için küçük gramajlı siparişleri de daha kısa sürede karşılayabileceğiz."] },
    { feed: "haberler", subject: "Yeni ürün lansmanı: 350 g tam buğday makarna ve kuruyemişli bar serisi", at: { days: 8, time: "11:00" }, body: ["Ocak ayında raflarda olacak iki yeni ürün grubunu duyuruyoruz: 350 g tam buğday makarna ve üç çeşit kuruyemişli bar.", "Ürün kartları, barkod bilgileri ve liste fiyatları Akademi'de yayında."] },
    { feed: "haberler", subject: "Gıda güvenliği sertifikamız yenilendi", at: { days: 10, time: "15:00" }, body: ["Yıllık IFS denetimi yüksek puanla tamamlandı; sertifikamız 12 ay daha geçerli.", "Güncel sertifika ve analiz raporları ihracat ve zincir dosyalarında paylaşıldı."] },
    { feed: "duyuru", subject: "Yılbaşı kampanyası 1 Aralık'ta başlıyor", at: { days: 6, time: "09:00" }, important: true, body: ["Yılbaşı kampanyası 1 Aralık'ta başlıyor: 20 ve üzeri koli alımlarında %3, 50 ve üzeri koli alımlarında %5, tam palet alımlarında %7 koli iskontosu uygulanacak.", "Kampanya 31 Aralık'a kadar geçerli; iskonto onayı Satış Direktörlüğü'nde. Afiş ve broşür dosyaları ekte."] },
    { feed: "duyuru", subject: "Depo envanter sayımı: 28–29 Kasım", at: { days: 2, time: "15:00" }, body: ["Tekirdağ ve Gebze depolarında yıl sonu envanter sayımı 28–29 Kasım'da yapılacak; bu iki günde depo çıkışı olmayacak.", "Zincir ve dağıtıcı siparişlerinin 26 Kasım'a kadar sisteme girilmesini rica ederiz."] },
    { feed: "duyuru", subject: "Hafta sonu planlı bakım: sipariş ve depo sistemleri cumartesi 02:00–04:00 arası kapalı", at: { days: 11, time: "14:30" }, body: ["Cumartesi günü 02:00–04:00 arasında sipariş ve depo yönetim sistemleri bakımda olacak. Bu sürede sipariş girişi yapılamaz, e-posta etkilenmez."] },
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Burcu Alpaslan", at: { days: 3, time: "09:30" }, body: ["Satış Planlama Uzmanı olarak ekibimize katılan Burcu Alpaslan'a hoş geldin diyoruz.", "Burcu, zincir promosyon takvimi ve talep planlama süreçlerinde Satış ve Operasyon ekipleriyle birlikte çalışacak."] },
    { feed: "ik", subject: "Bu haftanın doğum günleri", at: { days: 1, time: "08:45" }, body: ["Bu hafta doğum günü olan Mert Aksoy ve Gizem Tunç'a iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "2027 yıllık izin planlama dönemi başladı", at: { days: 9, time: "10:00" }, body: ["2027 yıllık izin planlarınızı 30 Kasım'a kadar yöneticinizle birlikte girmenizi rica ederiz.", "Satış ekipleri için Aralık yılbaşı haftası ve Ramazan öncesi yoğun dönem planlamada dikkate alınacak."] },
    { feed: "egitim", subject: "Gıda güvenliği ve etiket mevzuatı eğitimi: kayıtlar açık", at: { days: 5, time: "11:15" }, body: ["Alerjen bildirimi, etiket mevzuatı ve gıda güvenliği eğitimi bu hafta Maslak Eğitim Salonu'nda. Satış ve operasyon ekipleri için katılım zorunludur; kontenjan 30 kişidir."] },
    { feed: "egitim", subject: "Siber güvenlik farkındalık eğitimi tamamlandı mı?", at: { days: 12, time: "09:20" }, body: ["Zorunlu siber güvenlik eğitimini bu ay sonuna kadar tamamlamanız gerekiyor."] },
    { feed: "akademi", subject: "Yeni modül: Promosyon etkisi ve talep tahmini", at: { days: 7, time: "16:00" }, body: ["Akademi'ye yeni bir modül eklendi: promosyon haftalarında talep nasıl tahmin edilir, baz satış ile promosyon etkisi nasıl ayrıştırılır? 30 dakikalık video ve örnek tablo."] },
    { feed: "akademi", subject: "Kategori yönetimi ve raf planı (planogram) temelleri", at: { days: 11, time: "12:00" }, body: ["Zincir müzakerelerinde raf payı ve planogram konuşmak için hazırlanan 3 bölümlük eğitim yayında. Örnek raf fotoğrafları ve kontrol listesi dahildir."] },
    { feed: "kulup", subject: "Mutfak kulübü: Cuma öğle arası makarna atölyesi", at: { days: 3, time: "12:30" }, body: ["Mutfak kulübü Cuma öğle arasında ofis mutfağında buluşuyor; yeni 350 g tam buğday makarnamızla üç farklı tarif denenecek. Katılmak isteyenler kulüp kanalına yazabilir."] },
    { feed: "kulup", subject: "Gönüllülük günü: gıda bankası koli hazırlığı", at: { days: 10, time: "13:00" }, body: ["Kasım gönüllülük gününde yerel gıda bankası için koli hazırlığı yapılacak. Şirketimiz 500 koli kuru gıda bağışlayacak; gönüllü kayıtları açık."] },

    // haberler
    { feed: "haberler", subject: "Tekirdağ tesisinde enerji verimliliği yatırımı tamamlandı", at: { days: 2, time: "10:40" }, body: ["Tekirdağ tesisindeki yeni ısı geri kazanım sistemi devreye alındı. Buhar tüketiminde %12, yıllık doğal gaz giderinde yaklaşık 4,8 M₺ tasarruf bekleniyor.", "Yatırımın makarna ve konserve hatlarının birim maliyetine yansıması 2027 maliyet kartlarında Ocak ayında paylaşılacak."] },
    { feed: "haberler", subject: "İhracatta yeni pazar: Balkan ülkeleri için ilk sevkiyat hazırlığı", at: { days: 6, time: "14:20" }, body: ["Balkan pazarı için iki TIR'lık ilk pilot sevkiyatın hazırlıkları başladı. Yerel dilde etiket ve ürün analiz belgeleri Ocak başına kadar tamamlanacak.", "Satış ve Operasyon ekipleri belge setini Gıda Güvenliği ekibiyle birlikte hazırlıyor."] },
    { feed: "haberler", subject: "2026 Sürdürülebilirlik Raporu yayımlandı", at: { days: 12, time: "09:50" }, body: ["Raporumuz bu yıl ilk kez ambalajda geri dönüştürülmüş PET oranını (%22) ve gıda bağışı verilerini içeriyor.", "Zincir müşterilerimizin tedarikçi sürdürülebilirlik anketlerinde bu raporu referans olarak kullanabilirsiniz."] },
    // duyuru
    { feed: "duyuru", subject: "Aralık sipariş kesim saatleri değişiyor", at: { days: 3, time: "13:20" }, important: true, body: ["Aralık boyunca zincir ve dağıtıcı siparişlerinin aynı gün sevkiyat için kesim saati 15:00'ten 13:00'e çekildi. Amaç, palet tamamlama gecikmelerini azaltmak.", "Kesim saatinden sonra gelen siparişler bir sonraki iş günü planlanacak; acil istisnalar Mert Aksoy'un onayıyla açılır."] },
    { feed: "duyuru", subject: "2027 Q1 fiyat listesi yayın takvimi", at: { days: 5, time: "16:10" }, body: ["2027 Q1 fiyat listesi zincirlere ve dağıtıcılara 20 Kasım'da iletilecek. Liste dışı özel fiyat talepleri 14 Kasım'a kadar Satış Direktörlüğü'ne yazılı olarak iletilmeli."] },
    { feed: "duyuru", subject: "Yeni ürün kodu (SKU) açılışı için barkod formu güncellendi", at: { days: 9, time: "11:30" }, body: ["Yeni ürün kodu açılışlarında kullanılan barkod ve koli ölçü formu güncellendi; palet ölçüleri artık zorunlu alan.", "Zincir listeleme dosyalarında eksik bilgiyi önlemek için formu Ürün Yönetimi'ne iletmeden önce kontrol edin."] },
    // ik
    { feed: "ik", subject: "Aramıza katılan yeni arkadaşımız: Ceren Yalçın", at: { days: 7, time: "09:15" }, body: ["İhracat Operasyon Uzmanı olarak ekibimize katılan Ceren Yalçın'a hoş geldin diyoruz.", "Ceren, Körfez ve Avrupa siparişlerinin konteyner, belge ve gümrük süreçlerini Satış Operasyon ekibiyle birlikte yürütecek."] },
    { feed: "ik", subject: "Kasım ayının doğum günleri", at: { days: 4, time: "08:50" }, body: ["Kasım ayında doğum günü olan Kaan Özdemir ve Elif Kaya'ya iyi ki doğdunuz diyoruz. Nice mutlu yıllara!"] },
    { feed: "ik", subject: "Yıl sonu performans değerlendirme takvimi", at: { days: 11, time: "10:30" }, body: ["Yıl sonu performans değerlendirmeleri 7–18 Aralık arasında yapılacak. Öz değerlendirme formlarınızı 5 Aralık'a kadar sisteme girmeniz gerekiyor.", "Satış ekipleri için hedef gerçekleşme verileri 3 Aralık'ta Satış Operasyon tarafından paylaşılacak."] },
    // egitim
    { feed: "egitim", subject: "Zincir müzakere teknikleri atölyesi: son kontenjanlar", at: { days: 4, time: "10:05" }, body: ["Key account ve bölge satış ekipleri için iki günlük müzakere atölyesi gelecek ay Maslak'ta yapılacak. Ciro primi, vade ve promosyon takası senaryoları rol yapma ile çalışılacak; kontenjan 14 kişidir."] },
    { feed: "egitim", subject: "Excel ile promosyon ve ciro primi analizi eğitimi", at: { days: 8, time: "14:00" }, body: ["Satış Operasyon ekibinin hazırladığı yarım günlük eğitimde baz satış ile promosyon etkisinin ayrıştırılması ve ciro primi kademe hesabı örnek tablolarla çalışılacak. Katılım isteğe bağlıdır."] },
    { feed: "egitim", subject: "Depo ve üretim ziyaretçileri için iş sağlığı ve güvenliği oryantasyonu", at: { days: 13, time: "09:40" }, body: ["Müşteri ve ihracat alıcı ziyaretlerinde tesise konuk alacak ekiplerin kısa bir İSG oryantasyonunu tamamlaması gerekiyor. 20 dakikalık çevrim içi modül Akademi'de yayında."] },
    // akademi
    { feed: "akademi", subject: "Yeni modül: OTIF ve sevkiyat performansını okumak", at: { days: 3, time: "15:30" }, body: ["OTIF hesabında zamanında ve eksiksiz kırılımı, zincir bazlı ceza kuralları ve gecikme nedenlerinin analizi 25 dakikalık yeni modülde. Örnek zincir raporu dahildir."] },
    { feed: "akademi", subject: "İhracat evrakları ve teslim şekilleri (FOB, CIF) temelleri", at: { days: 9, time: "13:15" }, body: ["İhracat siparişlerinde fatura, çeki listesi, menşe şahadetnamesi ve sağlık sertifikası gibi belgeler ile FOB ve CIF arasındaki fark anlatılıyor. Körfez ve Avrupa için örnek kontrol listesi eklendi."] },
    { feed: "akademi", subject: "Ham madde fiyatından liste fiyatına: maliyet kartı okuma", at: { days: 13, time: "11:50" }, body: ["Maliyet kartı nasıl okunur, ayçiçek yağı ve irmik gibi kalemlerdeki değişim liste fiyatına nasıl yansır? Fiyat artışı müzakeresinde kullanabileceğiniz hazır bir tablo şablonu modülde bulunuyor."] },
    // kulup
    { feed: "kulup", subject: "Koşu kulübü: hafta sonu 5 km buluşması", at: { days: 5, time: "12:10" }, body: ["Koşu kulübü bu ay hafta sonu yakındaki parkta 5 km'lik rahat tempo koşusunda buluşuyor. Hız hedefi yok, sonrasında kahvaltı var. Katılmak isteyenler kulüp kanalına yazabilir."] },
    { feed: "kulup", subject: "Satranç kulübü: ofis turnuvası yarı finali", at: { days: 8, time: "12:45" }, body: ["Ofis içi satranç turnuvasının yarı finalistleri belli oldu; maçlar öğle arasında kafeteryada oynanacak. İzleyiciler için çay ve kurabiye ikramı olacak."] },
    { feed: "kulup", subject: "Fotoğraf kulübü: gıda fotoğrafçılığı atölyesi", at: { days: 12, time: "16:20" }, body: ["Fotoğraf kulübü ürün fotoğrafçılığı üzerine öğle arası atölyesi düzenliyor: beyaz zemin, ışık ve açı ipuçları. Online market ve katalog görselleri hazırlayan ekipler için de faydalı olacak."] },
  ],

  // ───────────── görevler ─────────────
  todo: {
    lists: [
      {
        name: "Satış Görevleri",
        default: true,
        tasks: [
          { title: `${YM} yıllık fiyat anlaşması teklifini güncelle`, due: 0, importance: "high", steps: ["Ciro primi kademelerini doğrula", "Vade ve promosyon bütçesini Can ile netleştir", "Teklifi PDF olarak gönder"], note: "Vade 75 gün talebi için Can Yıldız'ın onayı gerekli." },
          { title: `${KG} Q1 fiyat listesi müzakeresine hazırlan`, due: 1, importance: "high", steps: ["Ham madde maliyet tablosunu çıkar", "Ayçiçek yağı ve makarna için artış bandını belirle"] },
          { title: "Q4 hedef sunumunu hazırla", due: 2, steps: ["Ton ve ₺ rakamlarını Derya'dan al", "Riskli fırsatlar slaytı", "Selin ile prova yap"] },
          { title: `${ZK} Ramazan konteyner planını Derya ile netleştir`, due: 1 },
          { title: "Haftalık pipeline raporunu ekibe gönder", due: -1, status: "inProgress" },
          { title: "Zincir iade ve SKT riskli stok raporunu incele", due: -2, importance: "high" },
          { title: `${EB} listeleme dosyasını tamamla`, due: 3, steps: ["Ürün kartları ve barkodlar", "Koli ve palet ölçüleri", "Fiyat ve promosyon teklifi"] },
          { title: "Yılbaşı kampanya stok ve palet planını Mert ile doğrula", due: 2 },
          { title: "Haftalık satış toplantısı gündemini hazırla", due: 0, importance: "low" },
          { title: `${RF} numune ve sertifika dosyasını tamamla`, due: 4 },
          { title: `${TC} Ocak kampanya takvimini onayla`, due: 5 },
          { title: "Ramazan erken planlama için talep tahmini iste", due: 6, importance: "low" },
          { title: `${HK} pilot ürün listesini yanıtla`, completedDaysAgo: 1 },
          { title: "Kasım fiyat listesini sisteme yükle", completedDaysAgo: 3 },
          { title: "350 g makarna fiyatlandırmasını onayla", completedDaysAgo: 5 },
          { title: "Vadesi geçen bakiyeler için müşteri arama listesini Can ile çıkar", due: -1, importance: "high", note: `Toplam ${KPI.overdue} M₺; en büyük kalemler Kızılırmak (1,2 M₺) ve Egebahçe (0,8 M₺).` },
          { title: `${SK} yıllık HoReCa fiyat teklifini hazırla`, due: 5, steps: ["Aylık 18 tonluk tüketim varsayımını doğrula", "5 L yağ, 3 kg salça ve 5 kg makarna için sabit fiyat bandını çıkar", "45 gün vade için Can'ın onayını al"] },
          { title: "Aralık sipariş kesim saati değişikliğini zincirlere duyur", due: 2 },
          { title: "Fuar randevu listesini kesinleştir", due: 6, importance: "low" },
          { title: "Deniz'den güncel maliyet kartlarını iste", due: 0, importance: "low" },
          { title: "Haftalık key account durum özetini yaz", due: 3, status: "inProgress" },
          { title: "2027 kota dağılımı için ekip önerilerini birleştir", due: 7, steps: ["Zeynep, Kaan ve Onur'dan bölge ve zincir önerilerini topla", "İhracat ve online kanalı ayrı kalem olarak ekle", "Yeni hesapların katkısını ayrıca göster"] },
          { title: `${EB} raf fotoğrafları ve meyve suyu raf payı analizini tamamla`, completedDaysAgo: 2 },
          { title: "Eylül iade mutabakatını kapat", completedDaysAgo: 4 },
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Yeşilvadi hedef toplantısı", due: 3 },
          { title: "Onur için dağıtıcı müzakere eğitim planı hazırla", due: 8 },
          { title: "Gizem'in iade ve şikâyet süreci sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın Ege ve Trakya ziyaret raporunu incele", due: 4 },
          { title: "Zeynep'in Yeşilvadi sunum kontrol listesini onayla", due: 0, importance: "high" },
          { title: "Onur'un toptancı taahhüt listesini onayla", due: 3 },
          { title: "Gizem'in Hemenkapı sevkiyat takvimi taslağını incele", due: 6 },
          { title: "Derya'nın ihracat belge süreci eğitim talebini yanıtla", due: 5, importance: "low" },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Kış lastiği değişimi için randevu al", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
          { title: "Yıllık sağlık kontrolü randevusu al", due: 11, importance: "low" },
          { title: "Spor salonu üyeliğini yenile", due: 12, importance: "low" },
        ],
      },
      {
        name: "Key Account Takibi",
        tasks: [
          { title: `${YM}: ciro primi ikinci kademe yanıtını hazırla`, due: 0, importance: "high", steps: ["%3 talebinin maliyet etkisini Can ile hesapla", "Hacim koşuluyla birlikte karşı teklifi yaz", "Selin'den onay al"] },
          { title: `${TC}: ciro primi ve vade onayını yazılı ilet`, due: 1, importance: "high" },
          { title: `${ZK}: Arapça etiket onay durumunu takip et`, due: 1, importance: "high", steps: ["Tariq Bey'e hatırlatma yaz", "Onay gelmezse üretimin bekleme riskini Mert'le paylaş"] },
          { title: `${KG}: vadesi geçen 1,2 M₺ bakiyeyi tahsilat toplantısına taşı`, due: 3, importance: "high" },
          { title: `${BS}: bayi anlaşması taslağını Zeynep ile gözden geçir`, due: 3, steps: ["Palet bazlı iskonto ve 45 gün vade maddeleri", "İlk iki ay geçiş indirimi önerisi"] },
          { title: `${LF}: tadım sonrası numune ve musluklu bidon talebini yanıtla`, due: 2 },
          { title: `${EB}: meyve suyu rafı promosyon penceresini teyit et`, due: 4 },
          { title: `${AD}: CPT fiyat teklifi ve belge listesini hazırla`, due: 4, steps: ["EUR bazlı fiyatı kur riskiyle birlikte hesapla", "Yerel dilde etiket ve analiz sertifikası listesini çıkar"] },
          { title: `${SZ}: 38 ürünün görsel ve içerik şablonunu doldur`, due: 5 },
          { title: `${HK}: minimum SKT şartı için üretim planını Gizem ile netleştir`, due: 5 },
          { title: `${YM}: planogram revizyonu için raf fotoğraflarını değerlendir`, due: 6, importance: "low" },
          { title: `${RF}: Almanca içerik bildirimi etiket taslağını onaylat`, due: 7 },
          { title: `${YM}: kampanya bütçesi taslağını paylaş`, completedDaysAgo: 1 },
          { title: `${KY}: tanışma görüşmesi notlarını kayda geçir`, completedDaysAgo: 1 },
          { title: `${KG}: Ekim mutabakatını imzaya gönder`, completedDaysAgo: 2 },
        ],
      },
    ],
  },

  // ───────────── dosyalar ─────────────
  files: [
    { name: "Q4 Satış Hedefleri ve Gerçekleşme (Ton ve ₺).xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 0 },
    { name: `${YM} — 2027 Yıllık Anlaşma Teklifi v3.pptx`, folder: "Teklifler", by: "Ömer Gümüş", daysAgo: 1 },
    { name: `${YM} Yıllık Anlaşma Taslağı.docx`, folder: "Sözleşmeler", by: "Zeynep Acar", daysAgo: 1 },
    { name: "Pipeline Raporu — Kasım.xlsx", folder: "Raporlar", by: "Derya Çelik", daysAgo: 2 },
    { name: "Yılbaşı Kampanyası Promosyon Planı.xlsx", folder: "Kampanyalar", by: "Emre Şahin", daysAgo: 2 },
    { name: "Fiyat Listesi 2027 Q1 (Taslak).xlsx", folder: "Fiyat Listeleri", by: "Deniz Arslan", daysAgo: 3 },
    { name: "İhracat Sipariş Takibi — Ramazan Sezonu.xlsx", folder: "İhracat", by: "Derya Çelik", daysAgo: 3 },
    { name: "Haftalık Toplantı Notları.docx", folder: "Satış", by: "Ömer Gümüş", daysAgo: 3 },
    { name: "Raf Payı ve Planogram Analizi.pptx", folder: "Satış", by: "Kaan Özdemir", daysAgo: 4 },
    { name: "Zincir İade ve SKT Raporu — Ekim.csv", folder: "Raporlar", by: "Gizem Tunç", daysAgo: 5 },
    { name: "OTIF ve Sevkiyat Performansı.xlsx", folder: "Raporlar", by: "Mert Aksoy", daysAgo: 6 },
    { name: "Ürün Kataloğu 2027 — Gramaj ve Ambalaj.pdf", folder: "Teklifler", by: "Emre Şahin", daysAgo: 7 },
    { name: "Ekip Performans Özeti.xlsx", folder: "Raporlar", by: "Ömer Gümüş", daysAgo: 8 },
    { name: "Gıda Güvenliği Sertifikası ve Analiz Raporları.pdf", folder: "İhracat", by: "Mert Aksoy", daysAgo: 9 },
    { name: "Haftalık Key Account Durum Özeti.docx", folder: "Satış", by: "Ömer Gümüş", daysAgo: 1 },
    { name: "Vade ve Tahsilat Raporu — Kasım.xlsx", folder: "Raporlar", by: "Can Yıldız", daysAgo: 1 },
    { name: "Karadeniz Yolu Süpermarketleri — Listeleme Teklifi.pptx", folder: "Teklifler", by: "Kaan Özdemir", daysAgo: 2 },
    { name: "Bereket Sofrası — Bayi Anlaşması Taslağı.docx", folder: "Sözleşmeler", by: "Onur Polat", daysAgo: 2 },
    { name: "Ham Madde Maliyet Takibi — Yağ, İrmik, Domates, Ambalaj.xlsx", folder: "Raporlar", by: "Deniz Arslan", daysAgo: 2 },
    { name: "Ormanevi Organik — Ürün Kartları ve Sertifikalar.pdf", folder: "Teklifler", by: "Deniz Arslan", daysAgo: 3 },
    { name: "Egebahçe — 14 Ürün Kodu Barkod ve Palet Ölçüleri.xlsx", folder: "Teklifler", by: "Kaan Özdemir", daysAgo: 3 },
    { name: "Konteyner Rezervasyon ve Yükleme Planı — Ocak.xlsx", folder: "İhracat", by: "Mert Aksoy", daysAgo: 4 },
    { name: "Sofrapark Kurumsal Yemek Fiyat Listesi 2027.xlsx", folder: "Fiyat Listeleri", by: "Onur Polat", daysAgo: 4 },
    { name: "Sepetzamanı — Online Listeleme İçerik Şablonu.xlsx", folder: "Teklifler", by: "Gizem Tunç", daysAgo: 4 },
    { name: "Ramazan Sezonu Talep Tahmini Senaryoları.xlsx", folder: "Raporlar", by: "Elif Kaya", daysAgo: 5 },
    { name: "Tazeçarşı Ocak Kampanya Takvimi.xlsx", folder: "Kampanyalar", by: "Kaan Özdemir", daysAgo: 5 },
    { name: "Adriya Foods — Balkan İhracat Teklifi.pptx", folder: "İhracat", by: "Derya Çelik", daysAgo: 6 },
    { name: "Sektör Fuarı Stant ve Randevu Planı.docx", folder: "Kampanyalar", by: "Emre Şahin", daysAgo: 6 },
    { name: "Zincir Bazlı Ciro Primi Kademeleri 2027.xlsx", folder: "Fiyat Listeleri", by: "Zeynep Acar", daysAgo: 7 },
    { name: "Depo Çıkış Kapasitesi ve Aralık Planı.xlsx", folder: "Raporlar", by: "Mert Aksoy", daysAgo: 7 },
    { name: "Müşteri İade ve Şikâyet Analizi — Q3.pptx", folder: "Raporlar", by: "Gizem Tunç", daysAgo: 8 },
    { name: "Etiket ve Alerjen Kontrol Listesi.pdf", folder: "İhracat", by: "Deniz Arslan", daysAgo: 10 },
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${YM} yıllık anlaşma görüşme notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü, kategori müdürü ve finans yöneticisi. Ana gündem ciro primi kademeleri ve vade.", "İstekler: ciro primi ikinci kademe %3, vade 75 gün, yılbaşında ilk 400 mağazada ikinci ürün promosyonu, SKT eşiğinin 75 güne çekilmesi.", "Sınırlarımız: ortalama fiyat artışı %5'in altına inmez (liste %6,8); vade en çok 65 gün (Can ile teyit); promosyon bütçesi 1,8 M₺'yi aşmaz.", "Sonraki adım: güncellenmiş teklif ve raf payı planı."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Açık 19 fırsattan riskli üç tanesi için aksiyon sahipleri belirlendi: Yeşilvadi vadesi, Tazeçarşı ciro primi, Rheinmark belge seti.", "Yılbaşı kampanya afişleri Cuma'ya kadar onaylanacak; palet iskonto oranları tek sayfada toplanacak.", "OTIF %93,6; Mert ile Aralık depo çıkış planı çıkarılacak."] },
    { title: "Fiyat artışı müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: ham madde maliyet tablosu (ayçiçek yağı +%9, irmik +%6, domates +%11, ambalaj +%7) ve ortalama %6,8'lik liste artışı.", "Esneklik alanları: palet bazlı sipariş karşılığı ek iskonto, vade ve kampanya katkı payı.", "Sınır: ayçiçek yağında artış %5'in altına inmez; vade 65 günü geçmez."] },
    { title: "Ramazan erken planlama notları", notebook: "Satış", section: "Planlama", daysAgo: 8, body: ["Ramazan 2027 Şubat başında; iç pazarda hazırlık Aralık'ta başlamalı: koli bazlı stok, palet ve koli ölçüleri, promosyon ambalajı.", "İhracatta Körfez ve Avrupa için konteyner rezervasyonları Aralık ortasına kadar kesinleşmeli; yükleme Ocak başında.", "Talep tahmini Elif'ten istenecek. Geçen sezon makarnada +%38, yağda +%22, salçada +%19 satış artışı görüldü."] },
    { title: `${KY} — ilk görüşme notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Katılımcılar: satın alma müdürü Fikret Doğan ve lojistik sorumlusu. 28 mağazalı bölgesel zincir; mağazalar merkez depodan besleniyor, ürün çeşidi dar ama devir hızı yüksek.", "İlk sipariş 14 palet karışık (makarna, bakliyat, 5 L yağ). Depo kabul saatleri 07:00–15:00, palet yüksekliği en fazla 1,6 m, palet başına tek ürün kodu. Teslimat hedefi Ocak'ın ilk haftası.", `Fiyat: Q1 listesindeki %${KPI.priceUp}'lik artışı kabul edebilirler, ancak açılış siparişinde %2 tanışma iskontosu istiyorlar. Bizim sınırımız %1,5; Selin ile teyit edilecek.`, "Sonraki adım: barkodlu ürün kartları, palet etiketi örneği ve fiyat teklifi."] },
    { title: "Ekip 1:1 görüşme başlıkları", notebook: "Satış", section: "Ekip", daysAgo: 2, body: ["Zeynep Acar: Yeşilvadi yıllık anlaşma sunumu ve ciro primi kademeleri. Gelişim başlığı: pazarlıkta sessizliği kullanmak.", "Kaan Özdemir: bölgesel zincirlerde %66 ile öne çıkıyor; Egebahçe süt ürünleri rafı için fotoğraf analizi yapıyor. Trakya toptancı ziyaretinde ek desteğe ihtiyacı yok.", "Onur Polat: toptancılarda aylık 52 palet taahhüt hedefi; dağıtıcı müzakere eğitimi talebi onay bekliyor.", "Gizem Tunç: Hemenkapı pilotu ve iade süreci. Derya Çelik: ihracat belge süreçleri ve yeni ihracat operasyon uzmanıyla iş bölümü."] },
    { title: "Ormanevi Organik — listeleme komitesi gereksinimleri", notebook: "Satış", section: "Müşteri Notları", daysAgo: 4, body: ["Listeleme komitesi ayda bir toplanıyor; dosya komiteden en az bir hafta önce tamamlanmalı. Ocak komitesi için son tarih Aralık'ın ilk haftası.", "Gereken belgeler: organik sertifika kopyası, izlenebilirlik formu, ürün bazında menşe ve alerjen beyanı. Tam buğday makarna için ek olarak lif ve şeker oranı ile katkı maddesi beyanı isteniyor.", "Zincirde 12 mağaza var ama sepet ortalaması yüksek, fiyat hassasiyeti düşük. Promosyon yerine mağaza içi tadım köşesi ve broşür katkısı bekliyorlar; ürün hikâyesi ve ambalaj görünümü belirleyici."] },
    { title: "Vade ve tahsilat planı — Q4 kapanışı", notebook: "Satış", section: "Planlama", daysAgo: 6, body: [`Açık alacak ${KPI.receivables} M₺, vadesi geçen ${KPI.overdue} M₺ (DSO ${KPI.dso} gün, hedef ${KPI.dsoTarget}). En büyük iki kalem Kızılırmak 1,2 M₺ ve Egebahçe 0,8 M₺.`, "Aksiyonlar: müşteri bazlı arama listesi Can ile çıkarılacak; Kızılırmak'ın Ekim mutabakatı imza bekliyor, Egebahçe'deki iade kesintisi anlaşmazlığı Gizem ile kapatılacak.", "İlke: vade uzatımı yalnızca hacim ya da palet taahhüdü karşılığında verilir. Standart vade 60 gün, istisna Can Yıldız onayıyla en çok 65 gün. Tazeçarşı'nın 60 gün talebi tahsilat planını 0,6 M₺ kaydırıyor."] },
    { title: "İhracat konteyner planı — Körfez, Avrupa ve Balkanlar", notebook: "Satış", section: "Planlama", daysAgo: 7, body: ["Zahrat: 4 × 40' konteyner; ilk ikisi Ocak'ın ilk haftasında yüklenecek. Arapça etiket onayı gelmeden üretim başlatılmayacak; armatör opsiyonu 12 gün geçerli.", "Rheinmark: 2 konteyner salça ve konserve; analiz sonuçları ve IFS belge seti tamamlandıktan sonra Şubat başı yükleme. Almanca içerik bildirimli etiket taslağı onay bekliyor.", "Adriya Foods (Balkanlar): ilk sipariş 2 TIR, 66 palet, CPT fiyat. Yerel dilde etiket ve analiz sertifikası gerekli; belge takibi yeni ihracat operasyon uzmanıyla birlikte yürütülecek."] },
    { title: "Yılbaşı kampanyası operasyon kontrol listesi", notebook: "Satış", section: "Planlama", daysAgo: 9, body: ["Kampanya 1–31 Aralık: 20+ koli %3, 50+ koli %5, tam palet %7. Afiş ve broşür dosyaları zincirlere iletilecek; iskonto onayı Satış Direktörlüğü'nde.", "Depo çıkış kapasitesi Aralık'ın ilk iki haftasında %92 dolu; iki zincirin kampanya siparişi aynı güne denk geliyor, öncelik sırası Mert ile netleşecek. Sipariş kesim saati 13:00'e çekildi.", "Risk: palet tamamlama gecikmesi OTIF'i 2–3 puan düşürüyor. Kampanya ürünlerinde bir haftalık güvenlik stoku tutulacak; promosyon sonrası iki haftalık satış çukuru planlamaya dahil."] },
  ],

  // ───────────── asistan ─────────────
  assistant: {
    office: {
      greeting: "Merhaba Ömer! İzin, masraf, takvim ve günlük işlerinde yardımcı olabilirim. Ne yapmak istersin?",
      chips: ["İzin bakiyem nedir?", "Bu hafta toplantılarım neler?", "Masraf nasıl girerim?", "Bekleyen onaylarım var mı?"],
    },
    sales: {
      greeting: "Merhaba Ömer! Satış hedefin, zincir müşterilerin, promosyonların ve ihracat siparişlerin hakkında soru sorabilirsin.",
      chips: ["Bu çeyrek hedef durumum nedir?", "Açık fırsatlarımı özetle", "Promosyon performansı nasıl?", "İhracat siparişleri ne durumda?", "Haftalık satış özeti hazırla", "Ekip performansı nasıl?"],
    },
    answers: [
      // ───── dar kalıplı özel cevaplar: genel kalıplardan ÖNCE denenir ─────
      {
        match: "müzakere|pazarlık|karşı teklif|itiraz",
        steps: ["Müşteri pozisyonları okunuyor…", "Takas senaryoları hesaplanıyor…"],
        text: `**Fiyat artışı müzakeresi: pozisyonlar ve takaslar**\n\n| Müşteri | Talep | Sınırımız | Önerilen takas |\n|---|---|---|---|\n| ${YM} | Ciro primi ikinci kademe %3, vade 75 gün, SKT eşiği 75 gün | Ortalama artış %5'in altına inmez; vade en çok 65 gün | Ek %0,5 prim yalnızca yıllık hacim eşiği aşılırsa; promosyon bütçesi 1,8 M₺ |\n| ${KG} | Yağ ve makarnada artış en fazla %4,5 | Yağda artış %5'in altına inmez | Ocak palet taahhüdü karşılığında makarnada %4,5, yağda %5 |\n| ${TC} | Ek %2 ciro primi, vade 45 → 60 gün | Prim ya da vade; ikisi birden verilmez | Vade 60 gün olursa ek prim %1'e iner; Q4 tahsilat etkisi 0,6 M₺ |\n| ${BS} | Palet bazlı fiyat, 45 gün vade | Geçiş indirimi en çok iki ay | İlk iki ay %1 geçiş indirimi, siparişin ay başında tek seferde verilmesi |\n\nKural: her tavize karşılık hacim, kısa vade ya da kampanya katkısı alınır. Liste artışı %${KPI.priceUp}, maliyet etkisi yaklaşık %8; tavizler ortalama artışı %5'in altına çekmemeli. Kalem bazlı gerekçeler için ham madde maliyetini sorabilirsin.`,
        chips: ["Kalem bazlı ham madde maliyeti", "Vade ve tahsilat durumu nedir?"],
      },
      {
        match: "vade|tahsilat|alacak|kredi limiti|\\bdso\\b|cari hesap|cari bakiye",
        steps: ["Cari hesap kayıtları okunuyor…", "Vadesi geçen bakiyeler hesaplanıyor…"],
        text: `**Vade ve tahsilat durumu**\n\nAçık alacak **${KPI.receivables} M₺**; bunun **${KPI.overdue} M₺**'si vadesi geçmiş. DSO **${KPI.dso} gün** (hedef ${KPI.dsoTarget}).\n\n| Müşteri | Vade koşulu | Vadesi geçen | Not |\n|---|---|---|---|\n| ${KG} | 45 gün | 1,2 M₺ | Ekim mutabakatı imza bekliyor |\n| ${EB} | 60 gün | 0,8 M₺ | İade kesintisi tartışmalı |\n| ${TC} | 45 gün | 0,5 M₺ | 60 gün talebi satış onayında |\n| ${LF} | 30 gün | 0,4 M₺ | Fatura teyidi eksik |\n| ${HK} | 30 gün | 0,3 M₺ | Küçük tutarlı pilot faturaları |\n| ${YM} | 60 gün | 0 | Yıllık anlaşmada 75 gün talebi var; sınırımız 65 gün |\n\nÇeyrek kapanışına kadar vadesi geçen bakiyenin en az %70'ini tahsil etmek hedef. Tazeçarşı'ya 60 gün verilirse Q4 tahsilat planı 0,6 M₺ kayıyor; vade istisnaları Can Yıldız'ın onayında.`,
        chips: ["Fiyat artışı müzakeresi için pozisyonlar neler?", "Zincir bazında OTIF nasıl?"],
      },
      {
        match: "promosyon etkisi|promosyon getirisi|promosyon verimlili|baz satış|net artış|çekme etkisi|uplift",
        steps: ["Promosyon haftaları okunuyor…", "Baz satış ve net etki ayrıştırılıyor…"],
        text: `**Promosyon etkisi: baz satış ve net artış**\n\nBrüt artış, promosyon haftalarındaki satışın baz satışa göre farkıdır; promosyon sonrası iki haftadaki çukur (stok çekme etkisi) düşülünce net artış ortaya çıkar.\n\n| Zincir | Mekanik | Brüt artış | Sonraki 2 hafta | Net artış | 1 ₺ bütçe başına net kâr |\n|---|---|---|---|---|---|\n| ${YM} | İkinci ürün %30 | %24 | −%8 | %16 | 1,6 ₺ |\n| ${EB} | 5 L yağ bidonu | %17 | −%6 | %11 | 1,2 ₺ |\n| ${TC} | Atıştırmalık çoklu paket | %31 | −%12 | %19 | 2,1 ₺ |\n| ${HK} | Meyve suyu sepet indirimi | %6 | −%2 | %4 | 0,7 ₺ |\n\nİkinci ürün ve çoklu paket mekanikleri en verimli; meyve suyu sepet indirimi bütçesini geri kazanmıyor. tyroForecast modeli promosyon haftalarında tahmin hatasını %11'den %7'ye indirdi; Ocak planında aynı ayrıştırmayı kullanabilirsin.`,
        chips: ["Promosyon performansı nasıl?", "Ramazan stok planı nasıl?"],
      },
      {
        match: "zincir bazında otif|otif detay|teslimat performans|teslimat gecikme|depo çıkış|palet tamamlama|eksik teslimat|zamanında ve eksiksiz",
        steps: ["Teslimat kayıtları okunuyor…", "Zincir bazında OTIF hesaplanıyor…"],
        text: `**OTIF ve teslimat performansı (zincir bazında)**\n\n| Müşteri | OTIF | Ana sapma nedeni |\n|---|---|---|\n| ${YM} | %94,8 | Kampanya siparişlerinde palet tamamlama |\n| ${EB} | %92,1 | Etiket ve barkod uyumsuzluğu |\n| ${KG} | %93,0 | Araç randevu gecikmesi |\n| ${TC} | %95,2 | Küçük sapmalar |\n| ${HK} | %90,4 | Küçük gramajda eksik teslimat |\n| Diğer hesaplar | %93,0 | Karışık |\n\nAğırlıklı ortalama **%${KPI.otif}**, hedef %${KPI.otifTarget}; hedefe 2,4 puan var. Sapmaların %41'i palet tamamlama gecikmesi, %23'ü araç gecikmesi, %18'i etiket-barkod hatası ve %18'i eksik teslimat. ${EB} %92,1 ile sözleşmedeki ceza eşiğinin (%92) hemen üzerinde.\n\nAralık'ın ilk iki haftasında depo çıkış kapasitesi %92 dolu; sipariş kesim saati 13:00'e çekildi ve öncelik sırası Mert Aksoy ile netleşecek.`,
        chips: ["Haftalık satış özeti hazırla", "Vade ve tahsilat durumu nedir?"],
      },
      {
        match: "konteyner rezervasyon|yükleme takvimi|yükleme tarihi|navlun|\\bfob\\b|incoterm|gümrük|ihracat evrak|menşe|armatör|\\bgemi",
        steps: ["Rezervasyon kayıtları okunuyor…", "Yükleme takvimi ve belge seti kontrol ediliyor…"],
        text: `**İhracat konteyner ve yükleme planı**\n\n| Alıcı | Konteyner | İçerik | Yükleme | Durum |\n|---|---|---|---|---|\n| ${ZK} | 1–2 (40') | Makarna 500 g, ayçiçek yağı 1 L ve 2 L | Ocak'ın ilk haftası | Armatör opsiyonu var; Arapça etiket onayı bekleniyor |\n| ${ZK} | 3–4 (40') | Domates salçası 700 g, bakliyat | Ocak'ın ikinci yarısı | Rezervasyon Aralık ortasında açılacak |\n| ${RF} | 2 × 40' | Salça ve konserve | Şubat başı | Numune analizi ve IFS belge seti bekleniyor |\n\nZahrat fiyatları USD bazlı FOB, Rheinmark fiyatları EUR bazlı; navlun ve sigorta alıcıda. Belge seti: fatura, çeki listesi, menşe şahadetnamesi, sağlık sertifikası, IFS belgesi ve onaylı etiketler. Armatör opsiyonu 12 gün geçerli; etiket onayı gecikirse üretim ve yükleme birlikte kayar. Kur takibi için *tyroTrader*, konteyner izleme için *tyroSupply* uygulamasına bakabilirsin.`,
        chips: ["İhracat siparişleri ne durumda?", "Kalem bazlı ham madde maliyeti"],
      },
      {
        match: "ayçiçek|irmik|teneke|kalem bazlı|kalem bazında|ambalaj maliyet",
        steps: ["Maliyet kartları okunuyor…", "Kalem bazlı etki hesaplanıyor…"],
        text: `**Ham madde maliyeti: kalem bazında**\n\n| Kalem | Son 3 ay | Maliyet payı | Not |\n|---|---|---|---|\n| Ayçiçek yağı | +%9 | %30 | Hasat sonrası arz sıkı; 3 aylık sabit fiyat opsiyonu değerlendiriliyor |\n| İrmik | +%6 | %25 | Un fabrikalarıyla Ocak sözleşmesi görüşülüyor |\n| Domates (salça) | +%11 | %20 | Sezon stoku yüksek maliyetle alındı |\n| Ambalaj (teneke ve PET) | +%7 | %25 | Tedarikçi teklifi Ocak sonuna kadar geçerli |\n\nPay ağırlıklı etki yaklaşık **%8,1**; Q1 listesindeki ortalama %${KPI.priceUp} artış bunun yaklaşık 1,3 puan altında kalıyor, fark verimlilik ve ürün karmasıyla kapatılacak. Tekirdağ'daki enerji yatırımının etkisi 2027 maliyet kartlarına Ocak'ta yansıyacak. Parite ve emtia takibi için *tyroTrader*'a bakabilirsin.`,
        chips: ["Fiyat artışı müzakeresi için pozisyonlar neler?", "Kampanya ve iskonto kuralları neler?"],
      },
      {
        match: "iç pazar|ramazan stok|ramazan hazırlık|ramazan planlama|yılbaşı hazırlık|yılbaşı stok|talep tahmini|sezon planı|mevsimsel",
        steps: ["Geçen sezon satışları okunuyor…", "Sezon talep tahmini hesaplanıyor…"],
        text: `**Ramazan ve yılbaşı sezon stok planı (iç pazar)**\n\nRamazan Şubat başında; iç pazar hazırlığı Aralık'ta başlamalı. Geçen sezonun satış artışları makarnada +%38, yağda +%22, salçada +%19 oldu.\n\n| Ürün | Baz haftalık satış | Sezon haftalık tahmin | Ek koli |\n|---|---|---|---|\n| Makarna 500 g | 21 bin koli | 29 bin koli | +8 bin |\n| Ayçiçek yağı 1 L | 14 bin koli | 17 bin koli | +3 bin |\n| Domates salçası 700 g | 9 bin koli | 10,7 bin koli | +1,7 bin |\n\nÜç kalemde toplam ek ihtiyaç haftada yaklaşık 12,7 bin koli. Aralık depo çıkış kapasitesi %92 dolu olduğundan ek stokun Ocak ortasına kadar üretim ve palet planına işlenmesi gerekiyor. Tahmin Elif Kaya'nın güncellediği tyroForecast modelinden alındı; zincirlere Ramazan kampanya ambalajı için erken bildirim yapılmalı.`,
        chips: ["İhracat siparişleri ne durumda?", "Promosyon performansı nasıl?"],
      },
      {
        match: "yeni müşteri|yeni zincir|yeni hesap|karadeniz|ormanevi|sepetzamanı|bereket|sofrapark|adriya",
        steps: ["Yeni hesap kayıtları okunuyor…", "Listeleme aşamaları kontrol ediliyor…"],
        text: `**Yeni müşteri ve listeleme durumu**\n\n| Hesap | Kapsam | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n${newDealRows}\n\nAltı yeni hesabın toplamı **${KPI.newAccounts} M₺**; bu tutar açık pipeline'daki ${KPI.openDeals - 5} küçük fırsatın toplamı olan 15,8 M₺'nin içinde. En yakın kapanış beklentisi ${KY} (14 palet ilk sipariş, Ocak teslimat) ve ${BS} (aylık 24 palet) tarafında. ${OM} için sertifika ve ürün kartı dosyası, ${SZ} için 38 ürünlük içerik şablonu ve ${AD} için CPT fiyat teklifi önce tamamlanmalı.\n\n${EB} listelemesi (14 yeni ürün kodu) ayrı izleniyor.`,
        chips: ["Açık fırsatlarımı özetle", "Kanal bazında satış dağılımı nasıl?"],
      },
      {
        match: "kanal bazında|kanal dağılımı|kanal payı|ciro dağılımı|satış dağılımı",
        steps: ["Kanal bazlı satışlar okunuyor…"],
        text: `**Kanal bazında satış dağılımı (Q4 gerçekleşme)**\n\n| Kanal | Pay | Gerçekleşen |\n|---|---|---|\n| Zincir market | %46 | 16,2 M₺ |\n| Toptancı ve dağıtıcı | %22 | 7,8 M₺ |\n| İhracat | %${KPI.exportShare} | 6,0 M₺ |\n| HoReCa | %9 | 3,2 M₺ |\n| Hızlı teslimat ve online | %6 | 2,1 M₺ |\n\nToplam ${KPI.achieved} M₺. İhracat payı üçüncü çeyrekte açıklanan %${KPI.exportShare} ile uyumlu; Ramazan siparişleri kapanırsa kanal payı %20'ye yaklaşır. Hızlı teslimat ve online küçük ama en hızlı büyüyen kanal; Hemenkapı pilotu ve Sepetzamanı listelemesi bu payı artıracak.`,
        chips: ["Yeni müşteri listeleme durumu nedir?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "hedef|kota|gerçekleşme",
        steps: ["Satış verileri taranıyor…"],
        text: `**Q4 hedef durumu**\n\nGerçekleşen: **${KPI.achieved} M₺** / hedef ${KPI.quota} M₺ (**%${KPI.achievedPct}**). Hacimde **${KPI.tonDone} ton** / ${KPI.tonQuota} ton (${KPI.koliDone} / ${KPI.koliQuota} koli).\n\n- Açık pipeline: ${KPI.pipeline} M₺ (${KPI.openDeals} fırsat)\n- Kazanma oranı: %${KPI.winRate}\n- Bu ay kapanan: ${KPI.closedThisMonth} M₺\n- OTIF: %${KPI.otif} (hedef %${KPI.otifTarget})\n\nHedefi yakalamak için en kritik iki fırsat ${YM} yıllık anlaşması (${DEALS[0].amount} M₺) ve ${ZK} Ramazan siparişi (${DEALS[1].amount} M₺).`,
        chips: ["Açık fırsatlarımı özetle", "Ekip performansı nasıl?"],
      },
      {
        match: "ihracat|konteyner|körfez|ramazan|zahrat|rheinmark|avrupa",
        steps: ["İhracat sipariş kayıtları okunuyor…", "Konteyner takvimi kontrol ediliyor…"],
        text: `**İhracat siparişleri — Ramazan sezonu**\n\n| Alıcı | Kapsam | Tutar | Durum |\n|---|---|---|---|\n| ${ZK} | 4 × 40' konteyner (makarna, yağ, salça, bakliyat) | ${DEALS[1].amount} M₺ | Teklif; Arapça etiket onayı bekleniyor |\n| ${RF} | 2 konteyner salça ve konserve | 4,1 M₺ | Numune analizi, IFS belge seti |\n\nİlk iki Körfez konteynerinin Ocak'ın ilk haftasında yüklenmesi gerekiyor; rezervasyonun Aralık ortasına kadar kesinleşmesi lazım. Fiyatlar USD bazlı olduğundan kur takibi için *tyroTrader* asistanını kullanabilirsin.`,
        chips: ["Açık fırsatlarımı özetle", "Fiyat artışı için maliyet durumu ne?"],
      },
      {
        match: "promosyon|promo|ciro primi|kampanya bütçe",
        steps: ["Promosyon takvimi okunuyor…", "Kampanya bütçeleri hesaplanıyor…"],
        text: "**Yılbaşı öncesi promosyon performansı**\n\n| Zincir | Promosyon | Bütçe | Satış artışı |\n|---|---|---|---|\n| Yeşilvadi Market Grubu | Makarna + salça, ikinci ürün %30 | 1,8 M₺ | %24 |\n| Egebahçe Hipermarketleri | 5 L ayçiçek yağı bidon kampanyası | 0,9 M₺ | %17 |\n| Tazeçarşı İndirim Marketleri | Atıştırmalık çoklu paket | 0,7 M₺ | %31 |\n| Hemenkapı Hızlı Market | Meyve suyu sepet indirimi | 0,3 M₺ | %6 |\n\nDört kampanyanın toplam bütçesi 3,7 M₺; Q4 promosyon bütçesinin kalan 0,9 M₺'si diğer kanallarda. Kış döneminde meyve suyu ve gazlı içecekte hacim düşüşü sürüyor; bütçeyi atıştırmalık ve makarna gibi hızlı dönen gruplara kaydırmak mantıklı.",
        chips: ["Raf payımız nasıl?", "Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "raf payı|\\braf|listeleme|planogram|kategori yönetimi",
        steps: ["Raf ölçümleri okunuyor…"],
        text: "**Raf payı ve listeleme durumu**\n\n| Zincir | Kategori | Raf payı | Hedef |\n|---|---|---|---|\n| Yeşilvadi Market Grubu | Makarna ve bakliyat | %17 | %19 |\n| Egebahçe Hipermarketleri | Süt ürünleri | %6 | %10 |\n| Egebahçe Hipermarketleri | Meyve suyu | %9 | %11 |\n| Tazeçarşı İndirim Marketleri | Atıştırmalık | %11 | %12 |\n\nEgebahçe'de 14 yeni ürün kodu (SKU) listeleme dosyasında; raf planı Ocak'ta revize edilecek ve dosyanın Aralık ortasına kadar tamamlanması gerekiyor. Yeşilvadi'de planogram revizyonu Ocak'ta.",
        chips: ["Açık fırsatlarımı özetle", "Promosyon performansı nasıl?"],
      },
      {
        match: "\\bfire|\\biade|\\bskt|\\botif|sevkiyat|tedarik|stok",
        steps: ["Sevkiyat ve iade kayıtları okunuyor…"],
        text: `**Tedarik, fire ve iade durumu**\n\n- OTIF: **%${KPI.otif}** (hedef %${KPI.otifTarget}); en büyük sapma Marmara depo çıkışlarında, palet tamamlama gecikmelerinden.\n- Zincir iadeleri ciroda %1,4 (Eylül'de %1,9).\n- SKT'si 60 günün altına inen stok: 38 palet; çoğu meyve suyu ve süt ürünü.\n- Aralık'ın ilk iki haftasında depo çıkış kapasitesi %92 dolu; zincir kampanya siparişlerinde öncelik sırası Mert Aksoy ile netleşmeli.\n\nYeşilvadi'nin SKT eşiğini 90'dan 75 güne çekme talebi yıllık anlaşma görüşmesinde ele alınacak.`,
        chips: ["Haftalık satış özeti hazırla"],
      },
      {
        match: "ham madde|maliyet|döviz|parite|dolar|euro|fiyat artışı|zam talebi",
        steps: ["Ham madde fiyatları okunuyor…", "Maliyet etkisi hesaplanıyor…"],
        text: `**Ham madde maliyeti ve fiyat artışı**\n\nSon üç ayda ayçiçek yağı **+%9**, irmik **+%6**, domates **+%11**, ambalaj (teneke ve PET) **+%7** arttı. Ağırlıklı maliyet etkisi yaklaşık %8; Q1 listesinde ortalama **%${KPI.priceUp}** artış öngörüyoruz.\n\n- ${KG} yağ ve makarnada artışın %4,5'i geçmemesini istiyor.\n- ${YM} ile yıllık anlaşmada ortalama artış %5'in altına inmez.\n\nKur ve emtia takibi için *tyroTrader* asistanına, iskonto simülasyonu için *tyroPricing* uygulamasına bakabilirsin.`,
        chips: ["Kampanya ve iskonto kuralları neler?"],
      },
      {
        match: "fırsat|pipeline|teklif",
        steps: ["Fırsat kayıtları okunuyor…"],
        text: `**En büyük açık fırsatlar**\n\n| Müşteri | Kapsam | Tutar | Aşama | Olasılık |\n|---|---|---|---|---|\n${dealRows}\n\nListelenen beş fırsat 32,8 M₺; diğer ${KPI.openDeals - 5} fırsatla birlikte toplam açık pipeline **${KPI.pipeline} M₺**.`,
        chips: ["Bu çeyrek hedef durumum nedir?", "Haftalık satış özeti hazırla"],
      },
      {
        match: "toplantı|takvim|program",
        steps: ["Takvim okunuyor…"],
        text: `**Bugünkü programın**\n\n- 09:15 Satış günlük 15 dk\n- 11:00 Ham madde maliyeti ve Q1 fiyat listesi\n- 14:00 ${YM} — yıllık anlaşma sunumu\n\nBu hafta ayrıca ${ZK} Ramazan görüşmesi, ${KG} fiyat müzakeresi, Q4 hedef değerlendirmesi ve ${EB} listeleme görüşmesi var.`,
      },
      {
        match: "haftalık|özet|rapor",
        steps: ["Takvim ve posta taranıyor…", "Haftalık özet derleniyor…"],
        text: `**Haftalık satış özeti**\n\n- Bu ay ${KPI.closedThisMonth} M₺ kapanış gerçekleşti, kazanma oranı %${KPI.winRate}; OTIF %${KPI.otif}.\n- Bugün ${YM} yıllık anlaşma sunumu (14:00); yarın ${ZK} Ramazan görüşmesi ve ${KG} Q1 fiyat müzakeresi.\n- Q4 hedef değerlendirmesi için sunum hazır değil, görev listende.\n- Riskli fırsatlar: ${YM} (vade 75 gün talebi), ${TC} (ciro primi ve vade onayı), ${RF} (belge seti eksik).\n- Aralık'ın ilk iki haftasında depo çıkış kapasitesi %92 dolu; öncelik sırası netleşmeli.`,
        chips: ["Ekip performansı nasıl?", "Açık fırsatlarımı özetle"],
      },
      {
        match: "ekip|performans|kişi",
        steps: ["Ekip hedefleri okunuyor…"],
        text: "**Ekip performansı (Q4 hedefine göre)**\n\n| Kişi | Kanal | Gerçekleşme |\n|---|---|---|\n| Kaan Özdemir | Bölgesel zincir, indirim marketi | %66 |\n| Zeynep Acar | Ulusal zincir | %61 |\n| Onur Polat | Toptancı ve HoReCa | %57 |\n| Gizem Tunç | Hızlı teslimat, müşteri ilişkileri | %52 |\n| Derya Çelik | İhracat ve satış operasyon | %48 |\n\nKaan bölgesel zincirlerde öne çıkıyor; Derya'nın ihracat tarafında iki konteynerlik sipariş kapanınca gerçekleşme belirgin yükselecek.",
        chips: ["Bu çeyrek hedef durumum nedir?"],
      },
      {
        match: "kampanya|iskonto|fiyat",
        steps: ["Kampanya kuralları okunuyor…"],
        text: `**Yılbaşı kampanyası (1–31 Aralık)**\n\n- Koli iskontosu: 20+ koli **%3**, 50+ koli **%5**, tam palet **%7**.\n- Yıllık ciro primi kademeleri: %1,5 / %2,5 / %3,5; standart vade 60 gün.\n- Şimdiye kadar 7 zincir teklifinde uygulandı; en büyüğü ${YM} (${DEALS[0].amount} M₺).\n- İskonto ve ek prim onayı Selin Aydın'da, vade istisnası Can Yıldız'da.\n\nFiyat ve iskonto simülasyonu için *tyroPricing* uygulamasını açabilirsin.`,
        chips: ["Açık fırsatlarımı özetle"],
      },
      {
        match: "izin|bakiye",
        steps: ["İK kayıtları okunuyor…"],
        text: "**İzin bakiyen**\n\nYıllık hakkın 20 gün, kullandığın 11 gün; **kalan 9 gün**. Yılbaşı haftası için 2 günlük izin planın onaylı, 1 günlük bir talebin yönetici onayında.\n\nYeni izin talebi için *Self Servis*'ten ya da buradan yazabilirsin.",
        chips: ["Masraf nasıl girerim?"],
      },
      {
        match: "masraf",
        steps: ["Masraf politikası okunuyor…"],
        text: "**Masraf girişi**\n\n1. *Self Servis* › Masraf gir\n2. Kategori, tutar ve fişi ekle (fiş okuyucu tutarı kendisi çıkarır)\n3. Gönder; yöneticin onaylar.\n\nŞu an onay bekleyen bir masraf raporun var (HRMS-062371, müşteri ziyareti ve tadım günü).",
      },
      {
        match: "onay",
        steps: ["Onay kuyruğu kontrol ediliyor…"],
        text: "Bekleyen **3 onayın** var: Tazeçarşı ciro primi ve vade uzatımı, Yeşilvadi için ek palet iskontosu ve Onur Polat'ın dağıtıcı müzakere eğitimi talebi.",
      },
    ],
    fallback:
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Satış hedefin, fırsatların, promosyon ve raf payı, ihracat siparişleri ya da izin ve masraf işlerin hakkında sorabilirsin.",
  },
})

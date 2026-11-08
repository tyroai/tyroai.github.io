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
}

const YM = "Yeşilvadi Market Grubu" // ulusal market zinciri
const EB = "Egebahçe Hipermarketleri" // bölgesel zincir
const KG = "Kızılırmak Gıda Dağıtım" // toptancı / dağıtıcı
const LF = "Lezzetyolu Foodservice" // HoReCa dağıtıcısı
const TC = "Tazeçarşı İndirim Marketleri" // indirim marketi
const HK = "Hemenkapı Hızlı Market" // hızlı teslimat uygulaması
const ZK = "Zahrat Al-Khaleej Trading" // Körfez ihracat
const RF = "Rheinmark Feinkost GmbH" // Avrupa ithalatçısı

// En büyük açık fırsatlar (milyon ₺): beşi listelenir, kalan 14 fırsat toplamı 15,8 M₺.
const DEALS = [
  { who: YM, scope: "2027 yıllık anlaşma + yılbaşı listesi", amount: "12,4", stage: "Müzakere", prob: 70 },
  { who: ZK, scope: "Ramazan sezonu, 4 × 40' konteyner", amount: "7,1", stage: "Teklif", prob: 60 },
  { who: EB, scope: "Yeni listeleme: süt ürünleri ve atıştırmalık", amount: "5,4", stage: "Listeleme", prob: 50 },
  { who: KG, scope: "2027 Q1 fiyat listesi ve palet taahhüdü", amount: "4,6", stage: "Müzakere", prob: 65 },
  { who: LF, scope: "HoReCa yağ ve konserve yıllık anlaşması", amount: "3,3", stage: "Teklif", prob: 45 },
]
const dealRows = DEALS.map((d) => `| ${d.who} | ${d.scope} | ${d.amount} M₺ | ${d.stage} | %${d.prob} |`).join("\n")

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
    { name: "Key Account Portalı", type: "business", description: "Zincir sipariş, fiyat listesi ve mutabakat kayıtları", url: "#", icon: "Package01Icon" },
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
    { title: "Gıda ve İçecek Sektör Fuarı — ziyaretçi günü", day: 8, allDay: true, span: 2, where: "İstanbul · Fuar Alanı", organizer: "Emre Şahin", with: ["Ömer Gümüş", "Emre Şahin", "Kaan Özdemir"], body: "TYRO standında zincir ve ihracat alıcı görüşmeleri; yeni 350 g makarna ve bar serisi tanıtımı." },
    { title: `${HK} — hızlı teslimat pilot kapsamı`, day: 9, time: "14:00", minutes: 45, where: "Microsoft Teams", organizer: "Gizem Tunç", with: [`Ece Taşkın (${HK})`, "Ömer Gümüş", "Gizem Tunç"], body: "Küçük gramaj ürün listesi, minimum SKT şartı ve haftalık sevkiyat düzeni." },
    // geçmiş
    { title: `${YM} — kampanya ve promosyon bütçesi`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Taşdelen (${YM})`, "Zeynep Acar"], body: "Yılbaşı döneminde makarna ve salça için ikinci ürün promosyonu ve 1,8 M₺ bütçe çerçevesi." },
    { title: `${TC} — fiyat artışı ön görüşmesi`, day: -2, time: "11:00", minutes: 45, where: "Microsoft Teams", organizer: "Kaan Özdemir", with: [`Volkan Erim (${TC})`, "Ömer Gümüş", "Kaan Özdemir"], body: "Ham madde kaynaklı fiyat artışının gerekçeleri ve ciro primi talebi." },
    { title: "Depo çıkış ve OTIF değerlendirmesi", day: -3, time: "10:00", minutes: 45, where: "Maslak · Toplantı Odası 2", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Gizem Tunç", "Derya Çelik"], body: "Palet tamamlama gecikmeleri, sevkiyat hataları ve Aralık yoğunluğu için önlemler." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -4, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Hızlı teslimat kanalı hedefi, iade süreci ve gelişim planı." },
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
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile Yeşilvadi hedef toplantısı", due: 3 },
          { title: "Onur için dağıtıcı müzakere eğitim planı hazırla", due: 8 },
          { title: "Gizem'in iade ve şikâyet süreci sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın Ege ve Trakya ziyaret raporunu incele", due: 4 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Diş randevusunu ayarla", due: 7, importance: "low" },
          { title: "Kış lastiği değişimi için randevu al", due: 9, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
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
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${YM} yıllık anlaşma görüşme notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü, kategori müdürü ve finans yöneticisi. Ana gündem ciro primi kademeleri ve vade.", "İstekler: ciro primi ikinci kademe %3, vade 75 gün, yılbaşında ilk 400 mağazada ikinci ürün promosyonu, SKT eşiğinin 75 güne çekilmesi.", "Sınırlarımız: ortalama fiyat artışı %5'in altına inmez (liste %6,8); vade en çok 65 gün (Can ile teyit); promosyon bütçesi 1,8 M₺'yi aşmaz.", "Sonraki adım: güncellenmiş teklif ve raf payı planı."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Açık 19 fırsattan riskli üç tanesi için aksiyon sahipleri belirlendi: Yeşilvadi vadesi, Tazeçarşı ciro primi, Rheinmark belge seti.", "Yılbaşı kampanya afişleri Cuma'ya kadar onaylanacak; palet iskonto oranları tek sayfada toplanacak.", "OTIF %93,6; Mert ile Aralık depo çıkış planı çıkarılacak."] },
    { title: "Fiyat artışı müzakere hazırlığı", notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: ham madde maliyet tablosu (ayçiçek yağı +%9, irmik +%6, domates +%11, ambalaj +%7) ve ortalama %6,8'lik liste artışı.", "Esneklik alanları: palet bazlı sipariş karşılığı ek iskonto, vade ve kampanya katkı payı.", "Sınır: ayçiçek yağında artış %5'in altına inmez; vade 65 günü geçmez."] },
    { title: "Ramazan erken planlama notları", notebook: "Satış", section: "Planlama", daysAgo: 8, body: ["Ramazan 2027 Şubat başında; iç pazarda hazırlık Aralık'ta başlamalı: koli bazlı stok, palet ve koli ölçüleri, promosyon ambalajı.", "İhracatta Körfez ve Avrupa için konteyner rezervasyonları Aralık ortasına kadar kesinleşmeli; yükleme Ocak başında.", "Talep tahmini Elif'ten istenecek. Geçen sezon makarnada +%38, yağda +%22, salçada +%19 satış artışı görüldü."] },
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

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
}

const EGE = "Ege Ev Bayileri A.Ş."
const EVIM = "Evim Elektronik Mağazaları"
const KERVAN = "Kervan Pazaryeri A.Ş."
const YUVAM = "Yuvam Konut Yapı A.Ş."
const LACI = "Lacivert Koy Otelleri"
const ANAD = "Anadolu Ev Aletleri Dağıtım"
const MTP = "Marmara Teknoloji Pazarı"
const AKSU = "Aksu Toplu Konut Geliştirme"

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
    { name: "Bayi Portalı", type: "business", description: "Bayi sipariş, sevkiyat ve cari bakiye takibi", url: "#", icon: "AddInvoiceIcon" },
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
    // geçmiş
    { title: `${MTP} — yeni seri listeleme sunumu`, day: -1, time: "13:30", minutes: 60, where: "Microsoft Teams", organizer: "Ömer Gümüş", with: [`Serkan Yücel (${MTP})`, "Deniz Arslan"], body: "NovaCool 640 serisinin kategori ekibine tanıtımı ve listeleme koşulları." },
    { title: `${AKSU} — saha ve teslimat keşfi`, day: -2, time: "11:00", minutes: 90, where: "Proje şantiye ofisi", organizer: "Ömer Gümüş", with: [`Pınar Ersoy (${AKSU})`, "Zeynep Acar", "Mert Aksoy"], body: "680 daireli projede montaj nişleri, asansör ve teslimat parti planı." },
    { title: "Ekip 1:1 — Gizem Tunç", day: -3, time: "15:30", minutes: 30, where: "Maslak · Toplantı Odası 3", organizer: "Ömer Gümüş", with: ["Gizem Tunç"], body: "Hedef, servis ve garanti talepleri ve gelişim planı." },
    { title: "Servis ve garanti süreçleri değerlendirmesi", day: -4, time: "10:00", minutes: 60, where: "Microsoft Teams", organizer: "Mert Aksoy", with: ["Ömer Gümüş", "Gizem Tunç", "Elif Kaya"], body: "Yetkili servis müdahale süreleri ve bayi kaynaklı iade oranlarının incelenmesi." },
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
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Zeynep ile hedef toplantısı", due: 3 },
          { title: "Onur için bayi yönetimi eğitim planı hazırla", due: 8 },
          { title: "Gizem'in garanti ve servis sunumunu incele", due: 6, importance: "low" },
          { title: "Kaan'ın İzmir ziyaret raporunu oku", due: 9, importance: "low" },
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
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${YUVAM} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma müdürü ve proje teknik koordinatörü.", "İstekler: ankastre set birim fiyatında 800 ₺ indirim, garantiyi 3 yıla çıkarma, dört parti teslimat.", "Risk: rakip teklifi daha düşük fiyatlı ama servis ağı zayıf; bunu sunumda öne çıkaracağız.", "Sonraki adım: güncellenmiş teklif ve örnek daire teslim tutanağı."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Kasım indirim günleri için bayi sipariş son tarihi 13 Kasım olarak netleşti.", "Anadolu Ev Aletleri'nde stok eritme planı Onur'da; yeni sell-in stok devri 45 günün altına inmeden açılmayacak.", "Broşür ve raf etiketi onayı hafta sonuna kadar tamamlanacak."] },
    { title: `${EGE} kota görüşmesi hazırlığı`, notebook: "Satış", section: "Toplantı Notları", daysAgo: 5, body: ["Açılış: Q3 sell-out performansı ve yeni NovaCool 640 Plus modelleri.", "Esneklik alanı: prim kademesinin kota gerçekleşmesi %95'te başlaması, alt bayilere ek kampanya vadesi.", "Sınır: ek iskonto %6'yı geçmez; %8 üzeri Selin'in onayı olmadan verilmez."] },
    { title: "Kasım indirim günleri hazırlık listesi", notebook: "Satış", section: "Kampanya", daysAgo: 2, body: ["Fiyat listesi ve bayi iskonto tablosu yayında; broşür ve raf etiketi baskıya gidecek.", "Sipariş son tarihi 13 Kasım, teslimat son tarihi 19 Kasım. NovaCool 640 Plus ilk parti 14 Kasım.", "Depo vardiyası 20–30 Kasım arası 06:00–22:00; acil sevkiyat talepleri 16:00'ya kadar.", "Kampanya sonrası sell-out analizi için tyroInsight raporu Aralık başında hazırlanacak."] },
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
      {
        match: "stok|depo|devir hızı|sevkiyat|teslimat|lojistik",
        steps: ["Depo stok verileri okunuyor…"],
        text: "**Stok ve sevkiyat durumu (Gebze dağıtım merkezi)**\n\n| Model | Grup | Stok | Yeterlilik |\n|---|---|---|---|\n| NovaCool 640 | Buzdolabı | 2.150 | 11 gün (kritik) |\n| AquaPure W9 | Çamaşır makinesi | 3.480 | 19 gün |\n| SilentWash D14 | Bulaşık makinesi | 2.960 | 52 gün (fazla) |\n| ChefLine F60 | Ankastre fırın | 1.720 | 33 gün |\n| AirBreeze S18 | Klima | 4.900 | 118 gün (mevsim dışı) |\n\nToplam stok **18.400 adet**; ortalama stok devir hızı **41 gün** (hedef 38 gün), depo doluluğu **%91**.\n\nNovaCool 640 Plus ilk partisi 14 Kasım'da geliyor; o zamana kadar Kervan, Evim ve Ege Ev siparişleri öncelik kuyruğunda.",
        chips: ["Bayi performansını göster", "Kasım kampanyası nasıl işliyor?"],
      },
      {
        match: "kampanya|iskonto|fiyat|indirim",
        steps: ["Kampanya kuralları okunuyor…"],
        text: "**Kasım indirim günleri (20–30 Kasım)**\n\n- Standart bayi iskontosu **%14**; kampanya dönemi ek iskonto: buzdolabı, çamaşır ve bulaşık makinesinde **%6**, fırın/ocak/ankastrede **%4**, klimada **%3**.\n- Kampanya vadesi 90 güne kadar (Finans onayı: Can Yıldız).\n- %8 ve üzeri ek iskonto talepleri Selin Aydın'ın onayında; bekleyen talep: Kervan Pazaryeri (%9).\n- Bayi sell-in siparişleri **13 Kasım'a** kadar, teslimatlar 19 Kasım'a kadar.\n\nMarj etkisini görmek için *tyroPricing* uygulamasını açabilirsin.",
        chips: ["Açık fırsatlarımı özetle", "Stok durumu nasıl?"],
      },
      {
        match: "bayi|sell-?out|sell out|sell-?in",
        steps: ["Bayi ve kanal verileri okunuyor…", "Sell-out oranları hesaplanıyor…"],
        text: "**Bayi ve kanal performansı (Q4 şu ana kadar)**\n\n| Bayi / kanal | Sell-in | Sell-out | Sell-out oranı | Stok devri |\n|---|---|---|---|---|\n| Kervan Pazaryeri A.Ş. | 9,7 M₺ | 9,5 M₺ | %98 | 21 gün |\n| Ege Ev Bayileri A.Ş. | 11,4 M₺ | 10,8 M₺ | %95 | 36 gün |\n| Evim Elektronik Mağazaları | 14,2 M₺ | 13,1 M₺ | %92 | 33 gün |\n| Anadolu Ev Aletleri Dağıtım | 8,1 M₺ | 6,2 M₺ | %77 | 52 gün |\n\nAnadolu Ev Aletleri'nde stok birikiyor; yeni sell-in öncesi stok eritme planı gerekli (Onur Polat'la görüşülecek).\n\nYıl sonu bayi primi: kota gerçekleşmesi %100'de **%2,5**, %115'te **%3,5**. Ege Ev kademenin %95'te başlamasını istiyor.",
        chips: ["Stok durumu nasıl?", "Açık fırsatlarımı özetle"],
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

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
        ],
      },
      {
        name: "Ekip",
        tasks: [
          { title: "Kaan ile ihale hedefi toplantısı", due: 3 },
          { title: "Derya için ürün kayıt ve lot takibi eğitimi planla", due: 8 },
          { title: "Gizem'in laboratuvar müşterileri servis planını incele", due: 6, importance: "low" },
          { title: "Zeynep ile Mavi Kıyı hesap planını gözden geçir", due: 4 },
        ],
      },
      {
        name: "Kişisel",
        tasks: [
          { title: "Yıllık check-up randevusu al", due: 7, importance: "low" },
          { title: "Spor salonu üyeliğini yenile", due: 6, importance: "low" },
          { title: "Yıllık izin planını gir", due: 10 },
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
  ],

  // ───────────── OneNote ─────────────
  notes: [
    { title: `${MK} toplantı notları`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 1, body: ["Karar vericiler: satın alma direktörü, merkez eczane sorumlusu ve üç hastanenin başhekim yardımcıları.", "İstekler: teslim edilen ürünlerde kalan raf ömrünün en az %70 olması, ilk sevkiyatın aralığın ilk haftasına çekilmesi, her hastane için ayrı teslimat noktası ve sipariş kodu.", "Sonraki adım: güncellenmiş teklif, SKT taahhüt maddesi için hukuk görüşü ve referans hastane ziyareti."] },
    { title: "Haftalık satış toplantısı — kararlar", notebook: "Satış", section: "Toplantı Notları", daysAgo: 3, body: ["Yeşilvadi ihale dosyasında evrak sorumlusu Derya, teminat mektubu sorumlusu Can; son teklif tarihi 20 Kasım.", `SKT riskli ${KPI.sktLots} lot için kampanya ve depo transferi planı bu hafta sonuna kadar hazırlanacak.`, `Kamu alacağı: vadesi geçen ${m(KPI.overdueReceivable)} için hatırlatma yazıları gidecek.`] },
    { title: "İhale teklif hazırlığı — kontrol listesi", notebook: "Satış", section: "İhale Notları", daysAgo: 5, body: ["Şartname: teknik özellik maddeleri tek tek eşleştirilir; uyumsuz görünen kalem için açıklama süresi içinde idareden yazılı yanıt istenir.", "Evrak: uygunluk belgeleri, ürün kayıt örnekleri, üretici ve yetki belgesi, geçici teminat mektubu (%3), referans listesi.", "Fiyat: vade ve fiyat farkı varsayımı Can'la netleştirilir; teklif son günden en az iki gün önce sisteme yüklenir."] },
    { title: `${PE} müzakere hazırlığı`, notebook: "Satış", section: "Müşteri Notları", daysAgo: 3, body: ["Açılış: üç kademeli iskonto yapısı, depoda raf ve sevkiyat önceliği.", "Esneklik alanları: ikinci kademe %9'dan %10'a çıkabilir; karşılığında yıllık asgari alım taahhüdü ve soğuk zincir ürünlerde ortak stok planı.", "Sınır: üçüncü kademe %12'nin üzerine çıkmaz; onay Selin Aydın'da."] },
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

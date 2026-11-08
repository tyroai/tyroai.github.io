import { KIND_ORDER, hasIdIn, latestIdIn, sinceIn, visibleIn } from "./changelogRules.js"
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  YENİLİKLER — uygulamanın changelog'u, TEK doğruluk kaynağı
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Üç yüzey bunu okur: girişte açılan pencere (`WhatsNewDialog`), tam liste
 * sayfası (`/whats-new`) ve sol menüdeki okunmamış sayacı.
 *
 * ── NEDEN BU DOSYA ─────────────────────────────────────────────────────
 *
 * **Neden Dataverse değil.** Uygulama tamamen istemci tarafı; kaydı OKUYAN
 * kod zaten deploy istiyor, yani uzak bir tablo ikinci bir "soramadık"
 * durumu ve açılışta ek bir sorgu getirir, karşılığında hiçbir şey vermez.
 *
 * **Neden commit'lerden türetilmiyor.** Commit mesajı geliştiriciye
 * yazılır. "klavye açılınca kabuk görünen alana çakılıyor" cümlesi doğrudur
 * ve kullanıcıya hiçbir şey söylemez. Kayıt, değişikliğin KULLANICI için ne
 * demek olduğunu yazar.
 *
 * **Neden `strings.*.js` değil.** Orası ARAYÜZ metni; bu bir içerik
 * kataloğu: TR + EN yazılır, RU/AR bilinçli olarak İngilizceye düşer. Bir
 * içerik arşivini makineyle çevirmek, okuyanın güvenini metnin kendisinden
 * önce kaybettirir.
 *
 * ── KAYIT YAZARKEN ─────────────────────────────────────────────────────
 *
 *   id        sabit ve sıralanabilir: "YYYY-AA-GG-kısa-ad". Görüldü
 *             işareti buna bakıyor — YAYINLANDIKTAN SONRA DEĞİŞTİRME,
 *             değiştirmek herkese okunmamış gibi gösterir.
 *   date      "YYYY-AA-GG". Sıra bu dosyadaki sıradır (yeni en üste),
 *             tarih yalnız ekranda yazar.
 *   kind      "feature" | "improvement" | "fix"
 *             ⚠️ "fix" SESSİZ bir türdür: pencerede ve sidebar kartında
 *             hiç görünmez, Yenilikler sayfasında yalnız yöneticiye
 *             çıkar (bkz. `visibleEntries`). Kullanıcının bilmesi gereken
 *             bir düzeltmeyse türü "improvement" olmalı — tür, kaydın
 *             kime ulaşacağını belirleyen şeydir.
 *   title     **EN FAZLA 3-4 KELİME** (istek, 2026-09-20: *"başlıklar hâlâ
 *             uzun, max 3-4 kelimelik catchy başlıklar"*). Manşet okunur,
 *             cümle okunmaz — ve sidebar kartı 201px geniş: beş kelimelik
 *             bir başlık orada ÜÇ satıra sarıyor ve kartın boyunu taşırıyor
 *             (ölçüldü). Özne kullanıcı ("Cevabı WhatsApp'a gönder"), sürüm
 *             numarası ve dosya adı YOK. Anlatı `body`nin işi.
 *   body      BRIEF: bir, en fazla iki cümle (TR ≤ 150 karakter). "Ne
 *             değişti ve bu bana ne kazandırıyor".
 *             ⚠️ TEK BAŞINA anlamlı olmak ZORUNDA — girişte açılan
 *             pencerede YALNIZ bu çizilir; maddeler orada görünmez.
 *   points    opsiyonel 0-4 MADDE (`[{ tr, en }]`, her biri TR ≤ 95
 *             karakter, NOKTA İLE BİTMEZ, tek bir olgu taşır). Yalnız
 *             Yenilikler SAYFASINDA çizilir. Madde yoksa alan hiç
 *             yazılmaz — tek konulu kısa bir kayda madde eklemek
 *             gürültüdür.
 *             ⚠️ Arama maddeleri de tarar: ekranda görünen her metin
 *             aranabilir olmak zorunda.
 *   notify    ⚠️ PENCEREYİ AÇAN TEK ŞEY. Varsayılan false.
 *             `true` yalnız kullanıcının işini KESMEYE değecek yenilikte.
 *             Her kaydın pencere açması, kullanıcının pencereyi refleksle
 *             kapatmaya başlaması demektir — o an büyük yenilik de kaçar.
 *   to        opsiyonel "git bak" bağlantısı (uygulamadaki gerçek bir rota)
 *   route     opsiyonel — kaydın ANLATTIĞI sayfa, bir bağlantı değil. Kayıt
 *             bir sayfayı anlatıyor ama götürecek bir yeri yoksa (`to`suz)
 *             bu alan onu o sayfanın kapısına bağlar.
 *   audience  "admins" → yalnız yöneticiler (ADMIN_GROUP_ID üyeleri)
 *
 * ⚠️ **PENCERE İLE SAYFANIN İŞ BÖLÜMÜ** (tyrotrade'den, 2026-09-17):
pencere bir KESİNTİ, sayfa bir REFERANS. Kesintide yalnız manşet ve brief
var — kullanıcıyı durdurduğun yerde madde listesi okutmak, durdurmanın
bedelini iki katına çıkarır. Ayrıntı (maddeler) gidilen yerde duruyor.

⚠️ **ROTA KAPISI** (tyrotrade'den, 2026-09-28'de ALINDI). Bir kayıt, bu
 * kişinin AÇAMADIĞI bir sayfayı anlatıyor (`route`) ya da oraya götürüyorsa
 * (`to`) görünmez — `visibleEntries` › `canOpen`. Önceden alınmamıştı,
 * çünkü tyro'da rota başına kapı yoktu; Keşfet ve Akışım önizleme ekibine
 * daralınca oldu (`lib/pageAccess.js`). Kapı olmasaydı herkes "Keşfet'e
 * Dokümanlar geldi" haberini okuyup basınca dashboard'a düşerdi.
 * ⚠️ Kapı yalnız KAYDI gizler: başka bir sayfaya götüren günlük bir
 * kaydın MADDELERİNDEN birinin Keşfet'i anması engellenmez.
 */

export const CHANGELOG = [
  {
    "id": "2026-11-08-demo-yayinda",
    "date": "2026-11-08",
    "kind": "feature",
    "audience": "all",
    "route": "/myspace",
    "title": {
      "tr": "Demo yayında",
      "en": "Demo is live"
    },
    "body": {
      "tr": "Ömer Gümüş'ün satış yöneticisi çalışma alanı, tamamen kurgusal verilerle yayında. Başlıktaki veri seti simgesiyle sektörler arasında geçiş yapabilirsin.",
      "en": "Ömer Gümüş's sales manager workspace is live with fully fictional data. Use the dataset icon in the header to switch between industries."
    },
    "points": [
      {
        "tr": "Kişi, kurum ve rakamların hepsi uydurma; gerçek bir sisteme bağlı değil",
        "en": "People, companies and figures are all made up; nothing is connected to a real system"
      },
      {
        "tr": "Ana veri seti ve altı sektör: beyaz eşya, teknoloji, tarım, otomotiv, gıda ve içecek, sağlık",
        "en": "A main dataset plus six industries: appliances, technology, agriculture, automotive, food and beverage, healthcare"
      }
    ]
  },
  {
    "id": "2026-11-07-sektor-veri-setleri",
    "date": "2026-11-07",
    "kind": "feature",
    "audience": "all",
    "route": "/myspace",
    "title": {
      "tr": "Sektör veri setleri",
      "en": "Industry datasets"
    },
    "body": {
      "tr": "Takvim, posta, görevler, dosyalar ve Keşfet akışı seçtiğin sektöre göre değişir. Ad ve unvan her sette aynı kalır.",
      "en": "Calendar, mail, tasks, files and the Discover feed change with the industry you pick. Name and title stay the same in every set."
    }
  },
  {
    "id": "2026-11-05-asistan-sohbeti",
    "date": "2026-11-05",
    "kind": "improvement",
    "audience": "all",
    "route": "/chat",
    "title": {
      "tr": "Asistan sohbeti",
      "en": "Assistant chat"
    },
    "body": {
      "tr": "Asistanlar satış hedefi, fırsat durumu ve haftalık özet gibi sorulara hazır yanıtlarla cevap verir.",
      "en": "Assistants answer questions such as sales targets, deal status and the weekly summary with prepared replies."
    }
  },
  {
    "id": "2026-10-28-takvim",
    "date": "2026-10-28",
    "kind": "improvement",
    "audience": "all",
    "route": "/calendar",
    "title": {
      "tr": "Takvim görünümü",
      "en": "Calendar view"
    },
    "body": {
      "tr": "Toplantılar, görevler ve özel günler tek sayfada; bugünden başlayan hafta görünümü açılır.",
      "en": "Meetings, tasks and special days on one page, opening on the week that starts today."
    }
  },
  {
    "id": "2026-10-20-gorevler",
    "date": "2026-10-20",
    "kind": "improvement",
    "audience": "all",
    "route": "/todo",
    "title": {
      "tr": "Görev listeleri",
      "en": "Task lists"
    },
    "body": {
      "tr": "Görevleri listelere ayır, bugüne odaklan, tamamlananları gizle.",
      "en": "Split tasks into lists, focus on today and hide the completed ones."
    }
  }
]

/**
 * Listenin en yenisi.
 *
 * ⚠️ Varsayılan argüman KALDIRILDI (2026-09-17). `entries = CHANGELOG` ile
 * çağrılan bir yer hem `audience` hem `surface` kapısını sessizce atlardı;
 * bugün öyle bir çağrı yok ve olmasın diye varsayılan da yok.
 */
export function latestEntryId(entries) {
  return latestIdIn(entries)
}

/**
 * Bu kimlik katalogda VAR MI — yani işaret gerçekten öksüz mü?
 *
 * ⚠️ "Bu listede yok" ile "artık yok" AYRI SORULAR ve yüzey süzgeci
 * geldiğinden beri cevapları da ayrı. Onarım dalları (işaret öksüzse en
 * yeniye çek) bunu sormak zorunda: süzülmüş bir listeye sormak, yalnızca
 * o yüzeyde gizlenen bir kaydı SİLİNMİŞ sanıp işareti GERİYE çekerdi —
 * kullanıcının zaten okuduğu bir kayıt yeniden "yeni" olurdu.
 */
export function hasEntry(id) {
  return hasIdIn(CHANGELOG, id)
}

/**
 * Kayıt türünün ekrandaki sırası — gün İÇİNDE.
 *
 * Aynı güne düşen kayıtlar dosyada yazıldıkları sırayla duruyor ve o sıra
 * geliştirme sırası: bir düzeltme, bir yenilik, bir düzeltme daha. Okuyan
 * için anlamlı olan sıra bu değil — önce ne KAZANDIĞI, sonra ne İYİLEŞTİĞİ,
 * en sonda ne DÜZELDİĞİ.
 *
 * ⚠️ Yalnız ÇİZİM sırası. Kaynak dizi asla bu sırayla yeniden dizilmez:
 * `latestEntryId` dizinin İLK elemanını "en yeni" sayıyor ve `entriesSince`
 * işareti `findIndex` ile arayıp öncesini kesiyor. Günün içinde sırayı
 * değiştirmek, o günün ilk kaydını değiştirir — yani herkesin okundu
 * işareti bir kayıt kayar ve zaten okunmuş bir şey yeniden "yeni" olur.
 * Sıralama bu yüzden `WhatsNewPage`te ve yalnız süzülmüş listenin KENDİ
 * kopyası üzerinde yapılır: aynı tarihli ardışık koşu sıralanır, günlerin
 * sırasına dokunulmaz, ve kırpmadan (`slice(limit)`) ÖNCE yapılır — sonra
 * yapılsaydı "daha fazla göster"e her basışta liste zıplardı.
 */
export { KIND_ORDER }

/**
 * Bu kullanıcının, BU YÜZEYDE görebileceği kayıtlar.
 *
 * Üç kapı:
 *
 * 1. `audience: "admins"` — yöneticiye özel bir yeniliği herkese yazmak,
 *    olmayan bir düğmeyi vaat etmek olurdu.
 *
 * 2. `kind: "fix"` — **düzeltmeler yalnız Yenilikler SAYFASINDA ve yalnız
 *    YÖNETİCİDE** (2026-09-17, istek üzerine). Gerekçe ölçülebilir:
 *    32 kaydın 6'sı düzeltme ve bunların hiçbiri kullanıcının yapacağı bir
 *    işi değiştirmiyor — "yarım kalan yanıt uyarısı artık doğru tetikleniyor"
 *    cümlesi, o hatayı hiç yaşamamış kişi için yalnız gürültü. Pencere ve
 *    sidebar kartı kullanıcının İŞİNİ KESEN yüzeyler; oraya giren her kayıt
 *    dikkat borcu alıyor. Sayfa ise gidilen bir yer, orada yöneticinin
 *    tam dökümü görmesi gerekiyor.
 *
 * 3. `canOpen` — kişinin açamadığı bir sayfayı anlatan (`route`) ya da oraya
 *    götüren (`to`) kayıt. ÇAĞIRAN verir (`usePageAccess().canOpen`);
 *    verilmezse her yer açık sayılır. ⚠️ İşareti hesaplayan "page" listesi
 *    de bu süzgeçten geçer: işaretin anlamı "GÖREBİLDİĞİM her şeyle başa
 *    baş" — kapalı bir sayfanın kaydını saymak, rozeti hiç açamayacağı bir
 *    kayıt için yakardı. Yer yine KATALOGDAN okunduğu için (`entriesSince`,
 *    `hasEntry`) gizlenen bir kayda yazılmış eski işaret de kaymaz.
 *
 * `surface`:
 *   "page"   (varsayılan) Yenilikler sayfası — düzeltmeler yalnız yöneticiye
 *   "dialog" giriş penceresi — düzeltme YOK, kimseye
 *   "card"   sidebar kartı — düzeltme YOK, kimseye
 *
 * ⚠️ **OKUNDU İŞARETİ VE OKUNMAMIŞ SAYISI HER ZAMAN "page" YÜZEYİNDEN
 * HESAPLANIR**, hangi yüzey soruyorsa sorsun. İşaretin anlamı "sayfada
 * görebileceğim her şeyle başa baş"tır ve rozet de oraya götürüyor. Kart
 * yüzeyinden hesaplansaydı şu olurdu: yönetici sayfayı açar, işaret bir
 * DÜZELTME kaydına yazılır; kartın listesinde düzeltme olmadığı için
 * `entriesSince` işareti bulamaz (`findIndex` → -1), "hiç yeni yok" döner ve
 * o tarayıcıda rozet BİR DAHA HİÇ yanmaz. Sessiz ve bulunması zor.
 */
if (import.meta.env?.DEV) {
  // ⚠️ `notify: true` bir DÜZELTMEDE hiçbir şey yapmaz: pencere yüzeyi
  // düzeltmeleri hiç almıyor. Sessizce yutmak yerine yazana söylenir —
  // kayıt gerçekten pencere açmalıysa türü "improvement" olmalı.
  const silent = CHANGELOG.filter((e) => e.notify && e.kind === "fix")
  if (silent.length) {
    console.warn(
      "[changelog] `notify` düzeltme kaydında etkisiz — pencere düzeltme göstermiyor:",
      silent.map((e) => e.id).join(", "),
    )
  }
}

// Kurallar `changelogRules.js`te: açılıştaki dizin (`changelogIndex.js`) aynılarını kullanır. Rota
// kapısında ikisi de sorulur (`route`, `to`): anlattığı sayfa açık olup götürdüğü yer kapalıysa da
// kayıt bir söz verip tutmuyor.
export function visibleEntries(opts) {
  return visibleIn(CHANGELOG, opts)
}

/**
 * `seenId`den SONRAKİ kayıtlar.
 *
 * ⚠️ **YER KATALOGDAN OKUNUR, VERİLEN LİSTEDEN DEĞİL** (2026-09-17). Eskiden
 * işaret verilen listede `findIndex` ile aranıyordu; bulunamazsa "hiç yeni
 * yok" deniyordu. Düzeltme kayıtları yüzeylerden çekilince bu kural sessiz
 * bir veri kaybına dönüştü ve ÖNEMLİSİ: bu, yayına çıkar çıkmaz SAHADAKİ
 * tarayıcıları vururdu, yeni kayıtları değil.
 *
 * Somut: `2026-09-07-alinti-isaretleri` (kind: fix) o tarihin TEK kaydıydı,
 * yani 07→08 penceresinde uygulamayı açan herkesin işareti tam olarak o id.
 * Düzeltmeler yönetici olmayana kapanınca o id artık kimsenin listesinde
 * değil → `findIndex` −1 → sayaç 0 yazıyor, oysa 10 kayıt gerçekten
 * okunmamış ve 6'sı pencere açacak (`notify`) kayıt. Üstüne pencerenin
 * onarım dalı işareti EN YENİYE çekip `notify` kontrolüne varmadan
 * dönüyordu — birikimin tamamı tek bir sessiz yazışla silinirdi.
 *
 * Artık işaretin yeri KATALOGDA aranıyor ve verilen liste o yere göre
 * süzülüyor. İşaret hangi yüzeyde görünmez olursa olsun, "ondan sonrası"
 * doğru hesaplanır.
 *
 * Katalogda HİÇ yoksa (kayıt silinmiş ya da kimliği değişmiş) eski kural
 * aynen geçerli: hiçbir kayıt yeni sayılmaz. Bilinmeyen bir işaretle "hepsi
 * yeni" demek, kullanıcıya okuduğu her şeyi bir daha göstermek olurdu.
 */
export function entriesSince(seenId, entries) {
  return sinceIn(CHANGELOG, seenId, entries)
}

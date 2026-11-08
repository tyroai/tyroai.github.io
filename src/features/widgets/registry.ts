/**
 * Widget kayıt defteri — her widget TEK yerde tanımlı; katalog (`layout.CATALOG`), erişim
 * (`widgetAvailable`), header yüzü (`faceOptions`, `trayStyles`), header'a girme ve öneri
 * (`headerStore`, `HeaderManager`) ve header gövdesinin veri grubu (`HeaderWidgetBody`) buradan
 * türer. Sıra = katalog sırası. İçe aktarım yok: dosya ilk pakette, ağır şey (bileşen, ikon)
 * buraya girmez — çizici `renderWidget.jsx`te, ikon `widgetIcons.js`te (yalnız tepsiyle iner);
 * ikisinin de bu listeyle birebir aynı kimlikleri taşıdığı testli (`widgetRegistry.test.js`).
 *
 * Alanlar:
 * - `title`: başlık anahtarı; kısa açıklama `widgets.catalog.<id>`, ⓘ metni `widgets.info.<id>`.
 * - `wide` · `zone` · `looks` (`false` = görünüm yok) · `ownPalette`: kart (bkz. `layout.js`).
 * - `handle`: `false` = panoda üzerine gelince tutamak (•••) yok (ayarlar düzenleme kipinde).
 * - `board`: `false` = panoya girmez, yalnız header'da (kayıtlı düzende yerine geçen kart
 *   `layout.js` › `BOARD_RETIRED`).
 * - `access`: açılması için gereken sayfa erişimi (`pageAccess` alanı; tyroRM için `rm`).
 * - `data`: header'da açılınca çağrılacak veri grubu (`HeaderWidgetBody`); yoksa veri kendisinin.
 * - `header`: `false` = header'a girmez. Nesne: `shows` yüz seçenekleri (ilki varsayılan),
 *   `labels` widget'a özel seçenek adı, `width` yüzün tahmini genişliği (px), `suggest` header
 *   önerilerindeki sırası, `renderAs` header'da çizilen kimlik, `desc` ekleme listesindeki açıklama.
 */

/** Kartın görünümü (`layout.js`; Standart · Renkli · Cam · Açık · Koyu · sade). */
export type WidgetLook = "palette" | "glass" | "plain" | "standard" | "light" | "dark"

/** Header yüzünde gösterilebilecek bilgi. */
export type HeaderShow = "value" | "range" | "icon" | "unread" | "late"

/** Header'da açılınca çağrılan veri grubu (`HeaderWidgetBody`). */
export type WidgetData = "weather" | "brief" | "cal" | "focus" | "todo"

export interface WidgetHeader {
  shows?: HeaderShow[]
  labels?: Partial<Record<HeaderShow, string>>
  width?: number
  suggest?: number
  renderAs?: string
  desc?: string
}

export interface WidgetDef {
  title: string
  /** `false`: panoda üzerine gelince tutamak (•••) çıkmaz; ayarlar düzenleme kipinde. */
  handle?: false
  /** `false`: panoya girmez, yalnız header'da. */
  board?: false
  wide?: boolean
  zone?: "left"
  looks?: false | WidgetLook[]
  ownPalette?: boolean
  /** `pageAccess` alanı (tyroRM için `rm`). */
  access?: string
  data?: WidgetData
  header?: false | WidgetHeader
}

export const REGISTRY = {
  // Hava kartları kendi göğünü taşır: görünüm seçeneği yok. Header'da selamlamasız çizilir
  // ("İyi günler, Ömer!" tepside fazlalık).
  weather: {
    title: "widgets.weather.title",
    looks: false,
    data: "weather",
    header: {
      shows: ["value", "range", "icon"],
      width: 68,
      suggest: 1,
      renderAs: "weather-plain",
      desc: "headerWidgets.desc.weather",
    },
  },
  // Hava kartının alternatifleri: eklenince sol sütunun başına. `ownPalette`: Renkli'yi kendisi
  // çizer (genel palet tonu ona uygulanmaz). Selamlama ve süs kartları header'a girmez.
  intro: {
    title: "widgets.intro.title",
    zone: "left",
    looks: ["palette", "glass", "plain"],
    ownPalette: true,
    header: false,
  },
  "weather-plain": { title: "myspace.weather.title", zone: "left", looks: false, header: false },
  // Soru kutusunun yerine TYRO düğmesi zaten header'da.
  ask: { title: "widgets.ask.title", wide: true, header: false },
  // Anasayfa'nın kendi kartları: özet balonu ve yardım küresi.
  // Yardım küresi paletin degradesinde, kendi sahnesi: görünüm seçeneği yok. Anın önerileri de
  // onda (eski "TYRO öneriyor" kartı, `MERGED`).
  help: { title: "widgets.help.title", looks: false, header: false },
  brief: { title: "widgets.brief.title", wide: true, data: "brief" },
  "next-meeting": {
    title: "myspace.meeting.title",
    data: "cal",
    header: { shows: ["value", "icon"], width: 76, suggest: 5 },
  },
  rhythm: { title: "myspace.rhythm.title", wide: true, data: "cal" },
  // Postada widget'a özel ad: "Bayraklı".
  "pending-mail": {
    title: "widgets.mail.title",
    header: {
      shows: ["value", "unread", "icon"],
      labels: { value: "headerWidgets.face.flagged" },
      width: 56,
      suggest: 8,
    },
  },
  planner: { title: "widgets.planner.title" },
  "team-today": { title: "widgets.team.title", wide: true },
  market: {
    title: "widgets.market.title",
    wide: true,
    header: { shows: ["value", "icon"], suggest: 9 },
  },
  focus: { title: "myspace.tasks.title", data: "focus", header: { suggest: 7 } },
  outcomes: { title: "widgets.outcomes.title", wide: true, data: "cal" },
  holiday: { title: "widgets.holiday.title", header: { shows: ["value", "icon"], width: 64 } },
  // Rapor günü: piyasa raporlarının sıradaki yayını (takvim pakette, ağa çıkmaz). Yüzde
  // "20:00" (bugün) ya da "Сегодня" sığsın.
  "report-day": {
    title: "widgets.reports.title",
    header: { shows: ["value", "icon"], width: 76 },
  },
  // Trader masası: çevirici (saf hesap) ve CFTC fon pozisyonları (haftalık).
  trader: { title: "widgets.trader.title" },
  // Döviz çevirici: tutarı iki para birimi arasında çevirir (TL, Piyasa'nın dövizleri, gram altın ve
  // gümüş; kurlar Piyasa'yla aynı önbellekten). Header'da ve Denetim Merkezi'nde penceresi kartın kendisi.
  "tyro-fx": { title: "widgets.fx.title" },
  // Çevir: yapıştırılan metni TR · EN · RU · AR'ye çevirir — cihazda (tarayıcının çeviri modeli),
  // olmazsa TYRO sohbette. Metin kişisel: Sunum modunda bulanık, hiçbir yere kaydedilmez.
  "tyro-translate": { title: "widgets.translate.title" },
  // Bölge havası: üretim bölgelerinde yağış normale göre, toprak nemi ve tahmin (herkese açık veri).
  "region-weather": { title: "widgets.region.title" },
  // Kayıtlı arama: iğnelenen 1–2 dosya aramasının en yeni üç sonucu ve "Yeni" işareti.
  "saved-search": { title: "widgets.saved.title" },
  // OneNote: son düzenlenen sayfalar, defter filtresi ve uygulama içi okuyucu (`Notes.Read`,
  // kullanım anında). Okuyucu bölme açar: header penceresine girmez.
  onenote: { title: "widgets.onenote.title", header: false },
  // Yapışkan notlar: kişinin OneNote'undaki "TYRO Notlar" bölümü. Çentikte ve tepside de durur.
  // Yüzü renkli kâğıt destesi (tepsi ve çentik); tepside kapsül: deste + sayı rozeti + "+".
  sticky: {
    title: "widgets.sticky.title",
    header: {
      shows: ["value", "icon"],
      width: 96,
      suggest: 10,
      desc: "headerWidgets.desc.sticky",
    },
  },
  // tyroRM nabzı: ayın doluluğu, kapasite aşımı, takvim riski — yalnız tyroRM yetkisi olana.
  "rm-pulse": { title: "widgets.rm.title", access: "rm" },
  // Ticket'un üç kartı (kimlikler eski adlarıyla, kayıtlı düzenler korunsun): Sıra sende (benden
  // hamle bekleyen deste), Pist (hedefler gün gün, geniş) ve Tempo (yılın halkası + hafta).
  // Header yüzleri renkli SVG (`components/tibot/TibotGlyphs`): deste · pist · tempo halkası.
  "tibot-summary": {
    title: "widgets.tibotSummary.title",
    access: "tibot",
    header: { shows: ["value", "icon"], width: 44, desc: "headerWidgets.desc.tibot-summary" },
  },
  "tibot-rhythm": {
    title: "widgets.tibotRhythm.title",
    access: "tibot",
    wide: true,
    header: { shows: ["value", "icon"], width: 44, desc: "headerWidgets.desc.tibot-rhythm" },
  },
  "tibot-intro": {
    title: "widgets.tibotIntro.title",
    access: "tibot",
    header: { shows: ["value", "icon"], width: 64, desc: "headerWidgets.desc.tibot-intro" },
  },
  // Ticket Talepler (halka): kovalar iç içe halkalarda + talepler (geniş). Eski liste kartının
  // (`tibot`) yerine geçti (`layout.js` › `MERGED`): header'da üç renkli halka + sana atanan sayısı
  // rozeti (geciken varsa kırmızı), çentikte aynı sayı.
  "tibot-rings": {
    title: "widgets.tibotRings.title",
    access: "tibot",
    wide: true,
    header: {
      shows: ["value", "icon"],
      width: 64,
      suggest: 11,
      desc: "headerWidgets.desc.tibot-rings",
    },
  },
  // İzin bakiyem ve Taleplerim: ERP'deki izin, masraf, avans — yalnız Self Servis'e erişimi olana.
  "leave-balance": { title: "widgets.leave.title", access: "selfService" },
  requests: { title: "widgets.requests.title", access: "selfService" },
  // Dünya saatinin simgesi kadran (`TrayGlyph`): "yalnız simge" de canlı gösterge.
  "world-clock": {
    title: "widgets.worldClock.title",
    header: {
      shows: ["value", "icon"],
      labels: { icon: "headerWidgets.face.dialOnly" },
      width: 76,
      suggest: 4,
    },
  },
  // Odak sayacının simgesi kalan süre halkası (`TrayGlyph`).
  "focus-timer": {
    title: "widgets.focusTimer.title",
    header: {
      shows: ["value", "icon"],
      labels: { icon: "headerWidgets.face.ringOnly" },
      width: 84,
      suggest: 3,
    },
  },
  // Ufukta: seçilen To Do listelerinin tarihli görevleri, hedefler zaman çizelgesinde.
  horizon: {
    title: "widgets.horizon.title",
    wide: true,
    header: { shows: ["value", "icon"], width: 76 },
  },
  travel: {
    title: "widgets.travel.title",
    data: "cal",
    header: { shows: ["value", "icon"], width: 64 },
  },
  "focus-window": { title: "widgets.focusWindow.title", data: "cal" },
  // Tyrofy: header'daki radyo — çalarken yüzü kapsül, penceresi sahne (`TRAY_PANEL`), Denetim
  // Merkezi'nde plaklı kutucuk. Görünümleri kapsülün. Panodaki istasyon listeli ilk kartı kalktı
  // (`board: false`): kayıtlı düzende yerini Tyrofy Disk alır. Eski kimlik `radio-list`
  // kayıtta `radio`ya taşınır (`RENAMED`).
  radio: {
    title: "widgets.radio.title",
    board: false,
    wide: true,
    looks: ["palette", "standard", "light", "dark", "glass"],
    ownPalette: true,
    header: { width: 116, suggest: 2 },
  },
  // Tyrofy Sahne: header'daki sahne kartı panoda (mini dikey, büyük yatay sahne). Kendi
  // görseli var (görünüm yok); header'da zaten Tyrofy'ın penceresi: header'a girmez.
  "tyro-radio-stage": {
    title: "widgets.tyroStage.title",
    looks: false,
    header: false,
    handle: false,
  },
  // Tyrofy Disk: dönen CD'li kompakt radyo kartı. Kendi koyu görünüşü var (görünüm yok);
  // header'da zaten Tyrofy'ın penceresi: header'a girmez.
  "tyro-radio-disc": {
    title: "widgets.tyroDisc.title",
    looks: false,
    header: false,
    handle: false,
  },
} satisfies Record<string, WidgetDef>

export type WidgetId = keyof typeof REGISTRY

export const WIDGET_IDS = Object.keys(REGISTRY) as WidgetId[]

/** Header'daki bilgileri (`header` nesnesi; header'a girmeyende ve yüzsüzde boş). */
export const headerOf = (id: string): WidgetHeader =>
  (REGISTRY as Record<string, WidgetDef | undefined>)[id]?.header || {}

export const catalogKey = (id: string) => `widgets.catalog.${id}`

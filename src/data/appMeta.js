import pkg from "../../package.json"

export const appMeta = {
  name: "TYRO AI",
  brand: "TYROAI · TYRO Tech Business Solutions",
  parent: "TYRO Tech",
  version: pkg.version || "0.0.0",
  releaseDate: "2026",
  stack: ["React 19", "Vite 8", "Tailwind v4", "shadcn/ui"],
  iconLibrary: "Hugeicons",
}

export const localStorageRegistry = [
  {
    key: "tyro-theme",
    labelKey: "settings.general.storage.theme",
    descriptionKey: "settings.general.storage.themeDescription",
  },
  {
    key: "tyro-palette",
    labelKey: "settings.general.storage.palette",
    descriptionKey: "settings.general.storage.paletteDescription",
  },
  {
    key: "tyro-locale-v2",
    labelKey: "settings.general.storage.locale",
    descriptionKey: "settings.general.storage.localeDescription",
  },
  {
    key: "tyro-config-v2",
    labelKey: "settings.general.storage.config",
    descriptionKey: "settings.general.storage.configDescription",
  },
  {
    key: "tyro-favorites-v1",
    labelKey: "settings.general.storage.favorites",
    descriptionKey: "settings.general.storage.favoritesDescription",
  },
  {
    key: "tyro-prompt-favorites-v1",
    labelKey: "settings.general.storage.promptFavorites",
    descriptionKey: "settings.general.storage.promptFavoritesDescription",
  },
  // ⚠️ Gündem Akışının SAKLADIĞI TEK ŞEY bir ISO zaman damgası — gönderi
  // kimliği, konusu ya da göndereni DEĞİL (akış önbellekleri yalnız bellekte,
  // gerekçesi useFeedPosts.js'te). Silinmesi zararsız: rozet bir kez akışın
  // tamamını "yeni" sayar, sonra kendini toparlar. Bu yüzden listede yeri var
  // — "Tümünü temizle" burada hiçbir işi yakmıyor.
  {
    key: "tyro-feed-seen-v1",
    labelKey: "settings.general.storage.feedSeen",
    descriptionKey: "settings.general.storage.feedSeenDescription",
  },
  {
    key: "tyro-bell-seen-v1",
    labelKey: "settings.general.storage.bellSeen",
    descriptionKey: "settings.general.storage.bellSeenDescription",
  },
  // Keşfet › Popüler'de gizlenen türler (Özelleştir): yalnız tür adları.
  {
    key: "tyro-feed-hidden-v1",
    labelKey: "settings.general.storage.feedHidden",
    descriptionKey: "settings.general.storage.feedHiddenDescription",
  },
  // Rehber turları: tur başına görülen sürüm (`tour/tourStore.js`). Silinirse turlar ve form
  // ipuçları yeniden açılır; başka bir şey kaybolmaz. Eski Anasayfa damgası da bu girdide.
  {
    key: "tyro-tours-v1",
    match: ["tyro-tours-v1", "tyro-myspace-tour-v2"],
    labelKey: "settings.general.storage.tours",
    descriptionKey: "settings.general.storage.toursDescription",
  },
  // ⚠️ Tebrikler listesi BAŞKALARININ verisi, o yüzden envanterde yeri var:
  // "Tümünü temizle" onu gerçekten silmeli. Yazılan şey ad · ünvan · doğum
  // gününün GÜN-AYı · işe giriş yılı — doğum YILI yok. 12 saatte bir
  // tazelenir, çıkışta silinir, sahibinin karmasıyla damgalıdır.
  {
    key: "tyro-celebrations-v1",
    labelKey: "settings.general.storage.celebrations",
    descriptionKey: "settings.general.storage.celebrationsDescription",
  },
  // Dünya saatinin şehirleri ve ana şehri — kişisel veri değil, tercih.
  {
    key: "tyro-world-clock-v1",
    labelKey: "settings.general.storage.worldClock",
    descriptionKey: "settings.general.storage.worldClockDescription",
  },
  // Masraf tablosunun sütun düzeni (görünenler ve sırası) — tercih, kişisel veri değil. Önek:
  // eski sürümlerin (v1–v3) artığı da aynı satırda görünür ve silinir.
  {
    match: ["tyro-expense-columns-*"],
    labelKey: "settings.general.storage.expenseColumns",
    descriptionKey: "settings.general.storage.expenseColumnsDescription",
  },
  // `match`: tam anahtar ya da `*` ile biten önek; satır eşleşen bütün kayıtları toplar ve siler.
  { match: ["tyro-request-drafts-v1"], labelKey: "settings.general.storage.requestDrafts" },
  { match: ["tyro-ss-alerts-dismissed"], labelKey: "settings.general.storage.ssAlerts" },
  { match: ["tyro-home-layout-v1"], labelKey: "settings.general.storage.homeLayout" },
  // Anasayfa'nın sayfa düzenleri: sahnelerin düzenleri ve seçimi, TYRO'nun bugünkü seçiminde
  // kaldırılanlar — yalnız widget kimlikleri, sahne adları ve kurallar.
  {
    match: ["tyro-home-scene-*"],
    labelKey: "settings.general.storage.homeLayouts",
  },
  { match: ["tyro-widgets-*"], labelKey: "settings.general.storage.widgets" },
  // Rapor günü: takvime eklenen yayınlar (rapor kimliği ve tarih) — iki kez eklenmesin.
  { match: ["tyro-report-day-v1"], labelKey: "settings.general.storage.reportDay" },
  // Trader masası: son COT verisi (herkese açık CFTC verisi; haftada bir okunur).
  { match: ["tyro-cot-v1"], labelKey: "settings.general.storage.cot" },
  // Piyasa kartı: kişinin listesi (kimlikler) ve son kur verisi — herkese açık veri, tercih.
  { match: ["tyro-market-*"], labelKey: "settings.general.storage.market" },
  { match: ["tyro-myspace-tasks-v1"], labelKey: "settings.general.storage.focusTasks" },
  { match: ["tyro-chat-v1:*"], labelKey: "settings.general.storage.chatSessions" },
  {
    match: ["tyro-feed-likes-v1:*", "tyro-feed-saved-v1:*"],
    labelKey: "settings.general.storage.feedReactions",
  },
  { match: ["tyro-photo-*"], labelKey: "settings.general.storage.photo" },
  { match: ["tyro-orb-*"], labelKey: "settings.general.storage.orb" },
  { match: ["tyro-edge-notch-*"], labelKey: "settings.general.storage.edgeNotch" },
  { match: ["tyro-page-layout-v1"], labelKey: "settings.general.storage.pageLayout" },
  { match: ["tyro-scene-strip-v1"], labelKey: "settings.general.storage.sceneStrip" },
  { match: ["tyro-snap-*"], labelKey: "settings.general.storage.snapshots" },
  { match: ["tyro-radio-v1"], labelKey: "settings.general.storage.radio" },
  { match: ["tyro-weather-estate"], labelKey: "settings.general.storage.weather" },
  { match: ["tyro-shared-calendars"], labelKey: "settings.general.storage.sharedCalendars" },
  // Bölge havası: seçilen bölgeler ve son yağış verisi — herkese açık veri, tercih.
  { match: ["tyro-region-*"], labelKey: "settings.general.storage.regionWeather" },
  // Kayıtlı arama: iğnelenen arama metinleri ve son bakış anı — sonuçlar burada değil.
  { match: ["tyro-saved-searches-v1"], labelKey: "settings.general.storage.savedSearch" },
  { match: ["tyro-daily-brief-v1"], labelKey: "settings.general.storage.dailyBrief" },
  {
    match: ["tyro-changelog-seen-v1", "tyro-whatsnew-*"],
    labelKey: "settings.general.storage.whatsNew",
  },
  {
    match: [
      "tyro-chatdock-width",
      "tyro-meeting-alert-dismissed",
      "tyro-rhythm-chart-open-v1",
      "tyro-notify-optin-dismissed",
      "tyro-notify-confirm",
      "tyro-login-muted",
      "tyro-login-initialized",
      "tyro-voice-beam-v1",
      "tyro-pwa-promo-v1",
      // Takvim sayfası: görünüm, açık katmanlar ve son bakılan gün (yarım saat hatırlanır).
      "tyro-calendar-v1",
    ],
    labelKey: "settings.general.storage.uiState",
  },
]

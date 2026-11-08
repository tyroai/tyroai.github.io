/**
 * Sayfa parçalarının TEK tanımı: `App`in `lazy()`leri ve önceden indirme aynı `import()`u
 * kullanır (aynı parça, çift istek yok). Anahtar = sidebar/rota kimliği (App › PATH_TO_ID).
 */
const named = (load, name) => () => load().then((m) => ({ default: m[name] }))

export const ROUTE_CHUNKS = {
  myspace: named(() => import("@/features/myspace/MySpacePage"), "MySpacePage"),
  feed: named(() => import("@/features/feed/FeedPage"), "FeedPage"),
  todo: named(() => import("@/features/todo/TodoPage"), "TodoPage"),
  calendar: named(() => import("@/features/calendar/CalendarPage"), "CalendarPage"),
  selfservice: named(() => import("@/features/selfservice/SelfServicePage"), "SelfServicePage"),
  tibot: named(() => import("@/features/selfservice/tibot/TibotPage"), "TibotPage"),
  widgets: named(() => import("@/features/widgets/WidgetsPage"), "WidgetsPage"),
  dashboard: named(() => import("@/features/dashboard/AppLauncher"), "AppLauncher"),
  // Öneri kataloğu sohbetle aynı anda: şerit boş çizilip sonra açılınca ekran zıplıyordu.
  chat: named(
    () =>
      Promise.all([
        import("@/features/chat/ChatScreen"),
        import("@/data/prompts").then((m) => m.preloadPrompts()),
      ]).then(([m]) => m),
    "ChatScreen",
  ),
  help: named(() => import("@/features/help/HelpPage"), "HelpPage"),
  profile: named(() => import("@/features/profile/ProfilePage"), "ProfilePage"),
  "whats-new": named(() => import("@/features/changelog/WhatsNewPage"), "WhatsNewPage"),
  security: named(() => import("@/features/security/SecurityPage"), "SecurityPage"),
  rm: () => import("@/features/rm/RmSection"),
}

const requested = new Set()

/**
 * Önceden indirme yalnız derlenmiş pakette. Geliştirme sunucusunda her sayfa yüzlerce modülün
 * derlenmesi demek; soğuk sunucuda (CI) yeni bağımlılık bulununca Vite sayfayı yeniden yüklüyor
 * ve açık sayfa testin ortasında baştan başlıyordu. Yavaş ya da veri tasarrufundaki bağlantıda da
 * yok: tıklayınca iner.
 */
function frugal() {
  if (import.meta.env.DEV) return true
  const c = typeof navigator !== "undefined" ? navigator.connection : null
  return !!c && (c.saveData || /(^|-)2g$/.test(c.effectiveType ?? ""))
}

/** Sayfanın parçasını arka planda ister (üzerine gelme, odak, boşta). Hata yutulur: tıklamada yeniden denenir. */
export function prefetchRoute(id) {
  const load = ROUTE_CHUNKS[id]
  if (!load || requested.has(id) || frugal()) return
  requested.add(id)
  load().catch(() => requested.delete(id))
}

// Açılıştan sonra boşta sırayla inenler: sohbet (ilk açılışı beklemesin) ve menünün ana sayfaları.
const IDLE_ORDER = ["chat", "myspace", "feed", "todo", "selfservice", "calendar"]

// Sayfa yüklendikten sonra bekleme ve iki sayfa arası boşluk. Hemen ve art arda isteyince altı
// sayfanın ~240 modülü açılışın ilk saniyesinde iniyor ve çalışıyordu; telefonda açık sayfanın
// kendi veri isteğiyle ve çizimiyle yarışıp ölçülen açılışı 2–3 kat uzatıyordu.
export const IDLE_START_MS = 3000
export const IDLE_GAP_MS = 1500

/** Sayfa yüklenip sakinleşince, tarayıcı boşaldıkça aralıklı birer birer ister; sekme gizliyse durur. */
export function prefetchOnIdle(allowed = () => true) {
  if (typeof window === "undefined" || frugal()) return () => {}
  const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 1500))
  const cancel = window.cancelIdleCallback ?? window.clearTimeout
  const queue = IDLE_ORDER.filter(allowed)
  let handle = null
  let timer = null
  const later = (ms) => {
    timer = window.setTimeout(() => (handle = idle(next, { timeout: 4000 })), ms)
  }
  const next = () => {
    const id = queue.shift()
    if (!id || document.visibilityState === "hidden") return
    prefetchRoute(id)
    later(IDLE_GAP_MS)
  }
  const start = () => later(IDLE_START_MS)
  if (document.readyState === "complete") start()
  else window.addEventListener("load", start, { once: true })
  return () => {
    window.removeEventListener("load", start)
    window.clearTimeout(timer)
    if (handle != null) cancel(handle)
  }
}

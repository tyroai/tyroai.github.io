/**
 * MICROSOFT 365 DURUMU — Graph isteklerinin sonuçlarından "sorun Microsoft tarafında mı?" sorusunu
 * cevaplar; her sayfadaki şerit (`layout/ServiceHealthBanner`) bunu okur. 13 Kasım 2026'daki
 * Exchange Online kesintisinde (posta HTTP 500, To Do 503, takvim 16–80 sn) kullanıcı boş kartın
 * TYRO'dan mı Microsoft'tan mı olduğunu bilemiyordu.
 *
 * Her DENEME bir sonuçtur (`recordGraphOutcome`, `graphRequest` yazar):
 * - `server`: 500 · 502 · 503 · 504 ya da bağlantı kurulamadı (çevrimiçiyken)
 * - `timeout`: bizim süre sınırımız doldu (cevap gelmedi)
 * - `slow`: geldi ama `SLOW_MS`'ten uzun sürdü
 * - `busy`: 429 (kısıtlama — "çok yoğun, bekle")
 * - `ok`: zamanında geldi
 * İzin ve oturum (401/403), istemci hataları (400/404), bizim döngü sigortamız ve çevrimdışı hiç
 * kaydedilmez: onlar Microsoft'un sağlığı hakkında bir şey söylemez.
 *
 * Karar `WINDOW_MS` içindeki sonuçlardan, gecikmeli (bir hata şerit açmaz, bir başarı kapatmaz):
 * - **degraded**: en az `TRIP` kötü sonuç (server/timeout/slow) VE pencerenin en az %30'u kötü.
 * - **busy**: degraded değil ama en az `TRIP` kısıtlama.
 * - Açıkken ancak son `CLEAR` deneme zamanında gelince ve penceredeki kötüler eşiğin altına inince
 *   kapanır; hiç istek yoksa pencere boşalınca kapanır.
 * Uygulama kesintinin küresel olduğunu BİLEMEZ; yalnız kendi isteklerine gelen cevabı görür.
 * Şerit buna göre konuşur: hangi servislerin etkilendiğini sayar.
 */
export type OutcomeKind = "ok" | "slow" | "server" | "timeout" | "busy"
export type ServiceName =
  "mail" | "calendar" | "todo" | "notes" | "files" | "people" | "teams" | "other"
export type HealthStatus = "ok" | "degraded" | "busy"

export interface ServiceHealth {
  status: HealthStatus
  /** Bu bozulmanın başladığı an (kapatılan şerit yeni bölümde yeniden çıksın diye). */
  since: number
  /** Penceredeki kötü sonuçların servisleri, en çok etkilenen önce. */
  services: ServiceName[]
}

export const WINDOW_MS = 2 * 60_000
export const SLOW_MS = 10_000
const TRIP = 3
const RATIO = 0.3
const CLEAR = 4

interface Outcome {
  at: number
  kind: OutcomeKind
  service: ServiceName
}

const OK: ServiceHealth = Object.freeze({ status: "ok", since: 0, services: [] }) as ServiceHealth
let outcomes: Outcome[] = []
let health: ServiceHealth = OK
const listeners = new Set<() => void>()

/** Adresten servis: şeritte "posta, takvim" diye sayılır. */
export function serviceOf(path: string): ServiceName {
  const p = path.replace(/^https?:\/\/[^/]+/, "").toLowerCase()
  if (/\/todo\b/.test(p)) return "todo"
  if (/\/(calendar|calendars|calendarview|events|findmeetingtimes|calendargroups)\b/.test(p))
    return "calendar"
  if (
    /\/(messages|mailfolders|sendmail|mailboxsettings|getmailtips|inferenceclassification)\b/.test(
      p,
    )
  )
    return "mail"
  if (/\/onenote\b/.test(p)) return "notes"
  if (/\/(drive|drives|sites)\b/.test(p)) return "files"
  if (/\/(teams|chats|presence|onlinemeetings)\b/.test(p) || /\/communications\b/.test(p))
    return "teams"
  if (
    /\/(users|people|directreports|manager|photo|contacts)\b/.test(p) ||
    /^\/v1\.0\/me(\?|$)/.test(p)
  )
    return "people"
  return "other"
}

/** Bir HTTP durumunun sağlık sınıfı; sağlık hakkında bir şey söylemiyorsa `null`. */
export function kindOfStatus(httpStatus: number): OutcomeKind | null {
  if (httpStatus === 429) return "busy"
  if ([500, 502, 503, 504].includes(httpStatus)) return "server"
  return null
}

const BAD = new Set<OutcomeKind>(["server", "timeout", "slow"])

function decide(now: number, prev: ServiceHealth): ServiceHealth {
  const recent = outcomes
  const bad = recent.filter((o) => BAD.has(o.kind))
  const busy = recent.filter((o) => o.kind === "busy")
  const tail = recent.slice(-CLEAR)
  const recovered = tail.length === CLEAR && tail.every((o) => o.kind === "ok")
  const degraded = bad.length >= TRIP && bad.length >= recent.length * RATIO
  const servicesOf = (list: Outcome[]) => {
    const count = new Map<ServiceName, number>()
    for (const o of list) count.set(o.service, (count.get(o.service) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s)
  }
  if (prev.status !== "ok") {
    // Açıkken: zamanında gelen son denemeler + eşiğin altına inmiş kötüler kapatır.
    const still = prev.status === "degraded" ? degraded : busy.length >= TRIP
    if (!recent.length || (recovered && !still) || (!still && !bad.length && !busy.length))
      return OK
    const list = prev.status === "degraded" ? bad : busy
    return { ...prev, services: list.length ? servicesOf(list) : prev.services }
  }
  if (degraded) return { status: "degraded", since: now, services: servicesOf(bad) }
  if (busy.length >= TRIP) return { status: "busy", since: now, services: servicesOf(busy) }
  return OK
}

function emitIfChanged(next: ServiceHealth) {
  const same =
    next.status === health.status &&
    next.since === health.since &&
    next.services.join() === health.services.join()
  health = next
  if (!same) for (const l of listeners) l()
}

/** Bir Graph denemesinin sonucu (yeniden denemeler ayrı sayılır). */
export function recordGraphOutcome(
  path: string,
  kind: OutcomeKind | null,
  now: number = Date.now(),
): void {
  if (!kind) return
  outcomes = outcomes.filter((o) => now - o.at < WINDOW_MS)
  outcomes.push({ at: now, kind, service: serviceOf(path) })
  emitIfChanged(decide(now, health))
}

/** Başarılı denemenin sınıfı (süreye göre). */
export const kindOfSuccess = (ms: number): OutcomeKind => (ms > SLOW_MS ? "slow" : "ok")

/** Pencere zamanla boşalır: istek olmasa da eski kötüler düşsün (şerit kendiliğinden kapansın). */
export function tickServiceHealth(now: number = Date.now()): void {
  outcomes = outcomes.filter((o) => now - o.at < WINDOW_MS)
  emitIfChanged(decide(now, health))
}

export const getServiceHealth = (): ServiceHealth => health

export function subscribeServiceHealth(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Testler için. */
export function resetServiceHealth(): void {
  outcomes = []
  health = OK
}

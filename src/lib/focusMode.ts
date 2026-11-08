import { useSyncExternalStore } from "react"
import { FOCUS_MODE_KEY } from "@/lib/quietMode"

/**
 * Odak modu (macOS'un Odak'ı gibi, Denetim Merkezi'nden): açıkken TYRO kendiliğinden gelen
 * bildirimleri susturur — masaüstü bildirimi ve "yanıt hazır" balonu çıkmaz (sessiz işaretler,
 * sekme başlığı ve rozet kalır). Kişinin kendi kurduğu odak sayacının alarmı yine çalar.
 * Bitiş anıyla bu tarayıcıda saklanır (`tyro-focus-mode-v1`; kişisel veri değil), süre dolunca
 * kendiliğinden kapanır. Saf yardımcılar testli.
 */
// Bildirim kapısı (`lib/quietMode`) aynı anahtarı okur; tek tanım orada.
const KEY = FOCUS_MODE_KEY

/** Süre seçenekleri: dakika ya da gün sonuna kadar. Kutucuğa dokununca varsayılan bir saat. */
export type FocusChoice = 30 | 60 | 120 | "day"
export const FOCUS_CHOICES: FocusChoice[] = [30, 60, 120, "day"]
export const FOCUS_DEFAULT: FocusChoice = 60

export interface FocusState {
  until: number | null
  /** Seçilen süre (listede ✓); eski kayıtta olmayabilir. */
  choice?: FocusChoice
}

const OFF: FocusState = { until: null }

/** Seçimin bitiş anı: dakika eklenir; "day" o günün son anı (yerel saat). */
export function focusUntil(choice: FocusChoice, now: number): number {
  if (choice === "day") {
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return end.getTime()
  }
  return now + choice * 60000
}

/** Kayıt temizlenir: bitiş geçmişteyse ya da sayı değilse kapalı. */
export function sanitizeFocus(raw: unknown, now: number): FocusState {
  const r = raw as { until?: unknown; choice?: unknown } | null
  const until = r?.until
  if (typeof until !== "number" || !Number.isFinite(until) || until <= now) return OFF
  const choice = FOCUS_CHOICES.find((c) => c === r?.choice)
  return choice ? { until, choice } : { until }
}

export const isFocusOn = (s: FocusState, now: number): boolean => s.until != null && s.until > now

/** Kalan dakika (yukarı yuvarlı; kapalıysa 0). */
export const focusLeftMin = (s: FocusState, now: number): number =>
  s.until == null ? 0 : Math.max(0, Math.ceil((s.until - now) / 60000))

function read(): FocusState {
  try {
    return sanitizeFocus(JSON.parse(localStorage.getItem(KEY) ?? "null"), Date.now())
  } catch {
    return OFF
  }
}

let state: FocusState = typeof window === "undefined" ? OFF : read()
const subs = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined

// Süre dolunca abonelere haber ver (kapalı görünsün). Uzun süreler parça parça beklenir:
// tarayıcı 24,8 günden uzun gecikmeyi hemen çalıştırır, uykudan sonra da yeniden bakılır.
function schedule() {
  clearTimeout(timer)
  if (state.until == null) return
  const wait = Math.min(state.until - Date.now(), 3600000)
  timer = setTimeout(
    () => {
      if (state.until != null && state.until <= Date.now()) set(OFF)
      else schedule()
    },
    Math.max(0, wait) + 50,
  )
}

function set(next: FocusState) {
  state = next
  try {
    if (next.until == null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depo kapalı: mod bu oturumda sürer.
  }
  schedule()
  for (const fn of subs) fn()
}

if (typeof window !== "undefined") {
  schedule()
  // Başka sekmede açılan/kapanan mod bu sekmede de.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return
    state = read()
    schedule()
    for (const fn of subs) fn()
  })
}

function subscribe(fn: () => void) {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

/** Odak modunu açar (`choice` süreyle) ya da kapatır (`null`). */
export function setFocusMode(choice: FocusChoice | null) {
  set(choice == null ? OFF : { until: focusUntil(choice, Date.now()), choice })
}

/** Şu an açık mı (kanca dışında: bildirim kapıları). */
export const focusModeOn = (): boolean => isFocusOn(state, Date.now())

export const useFocusMode = (): FocusState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => OFF,
  )

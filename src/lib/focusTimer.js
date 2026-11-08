import { useSyncExternalStore } from "react"

/**
 * Odak sayacı (Pomodoro gibi) — sayfadan bağımsız tek sayaç: bitiş anı bu tarayıcıda saklanır
 * (`tyro-focus-timer-v1`; kişisel veri değil), sayfa değişse ya da yenilense de sürer. Süre
 * dolunca `doneAt` yazılır; header'daki uyarı onu görüp haber verir. Saf yardımcılar testli.
 */
const KEY = "tyro-focus-timer-v1"
export const PRESETS = [15, 25, 50]
const IDLE = { minutes: 25, endsAt: null, left: null, doneAt: null }

/** Kayıt temizlenir: süre hazır sürelerden biri, zamanlar sayı; bozuksa boş sayaç. */
export function sanitizeTimer(raw) {
  if (!raw || typeof raw !== "object") return IDLE
  const minutes = PRESETS.includes(raw.minutes) ? raw.minutes : IDLE.minutes
  const num = (v) => (Number.isFinite(v) && v > 0 ? v : null)
  const endsAt = num(raw.endsAt)
  const left = endsAt ? null : num(raw.left)
  return { minutes, endsAt, left, doneAt: endsAt || left ? null : num(raw.doneAt) }
}

/**
 * Kalan süre (ms): çalışıyorsa bitişe kadar (tam süreyi aşmaz — "şimdi" bir an eski olabilir),
 * duraklatılmışsa kalan, yoksa tam süre.
 */
export function remainingMs(state, now) {
  if (state.endsAt) return Math.min(state.minutes * 60000, Math.max(0, state.endsAt - now))
  if (state.left != null) return state.left
  return state.minutes * 60000
}

/** "24:05" · "1:02:05" — Latin rakam, saat yalnız gerekince. */
export function formatClock(ms) {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, "0")
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function read() {
  try {
    return sanitizeTimer(JSON.parse(localStorage.getItem(KEY) ?? "null"))
  } catch {
    return IDLE
  }
}

let state = typeof window === "undefined" ? IDLE : read()
const subs = new Set()
let alarm = null

function schedule() {
  clearTimeout(alarm)
  if (state.endsAt) alarm = setTimeout(finish, Math.max(0, state.endsAt - Date.now()) + 50)
}

function set(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depo kapalı: sayaç bu oturumda sürer.
  }
  schedule()
  for (const fn of subs) fn()
}

function finish() {
  if (!state.endsAt) return
  if (Date.now() < state.endsAt) return schedule()
  set({ ...IDLE, minutes: state.minutes, doneAt: Date.now() })
}

if (typeof window !== "undefined") {
  schedule()
  // Başka sekmede başlatılan/durdurulan sayaç bu sekmede de.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return
    state = read()
    schedule()
    for (const fn of subs) fn()
  })
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useFocusTimer = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => IDLE,
  )

export const startTimer = (minutes = state.minutes) =>
  set({ ...IDLE, minutes, endsAt: Date.now() + minutes * 60000 })

export function pauseTimer() {
  if (state.endsAt) set({ ...state, endsAt: null, left: Math.max(0, state.endsAt - Date.now()) })
}

export function resumeTimer() {
  if (state.left != null) set({ ...state, endsAt: Date.now() + state.left, left: null })
}

export const resetTimer = () => set({ ...IDLE, minutes: state.minutes })

/** Süreyi değiştir (çalışmıyorken): sayaç o süreye hazır olur. */
export function setTimerMinutes(minutes) {
  if (!state.endsAt && PRESETS.includes(minutes)) set({ ...IDLE, minutes })
}

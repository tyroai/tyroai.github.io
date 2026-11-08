import { useSyncExternalStore } from "react"

/**
 * Odak modunun bağları (`tyro-focus-links-v1`; kişisel veri değil): "Takvimde de ayır" ve "Teams'te
 * Rahatsız etmeyin" anahtarları, bir de uygulanmış olanın izi (`applied`: hangi Odak oturumu için,
 * takvim bloğunun kimliği, Teams'e yazıldı mı) — gözlemci aynı oturumu iki kez uygulamasın.
 */
const KEY = "tyro-focus-links-v1"
const EMPTY = { calendar: false, teams: false, applied: null }

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null")
    const applied = raw?.applied
    return {
      calendar: raw?.calendar === true,
      teams: raw?.teams === true,
      applied:
        applied && Number.isFinite(applied.until)
          ? {
              until: applied.until,
              eventId: typeof applied.eventId === "string" ? applied.eventId : null,
              presence: applied.presence === true,
            }
          : null,
    }
  } catch {
    return EMPTY
  }
}

let state = typeof window === "undefined" ? EMPTY : read()
const subs = new Set()

function set(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depo kapalı: bu oturumda geçerli.
  }
  for (const fn of subs) fn()
}

const subscribe = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useFocusLinks = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
export const focusLinks = () => state
export const setFocusLink = (name, on) => set({ ...state, [name]: on })
export const setApplied = (applied) => set({ ...state, applied })

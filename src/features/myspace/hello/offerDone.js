import { useSyncExternalStore } from "react"

/**
 * Karşılama kapsülünde bugün yapılan öneriler (`tyro-welcome-done-v1`: gün + adlar): sabah "Bugün
 * seni neler bekliyor?"a basan o gün bir daha görmez, sıradaki öneriye geçilir. Gün değişince
 * kendiliğinden boşalır; çıkışta silinir (`PERSONAL_STORAGE`).
 */
const KEY = "tyro-welcome-done-v1"
const EMPTY = new Set()

const dayOf = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return raw?.day === dayOf() && Array.isArray(raw.keys) ? new Set(raw.keys) : EMPTY
  } catch {
    return EMPTY
  }
}

let state = typeof window === "undefined" ? EMPTY : read()
const subs = new Set()

/** Öneriye basılınca: bugün yapıldı. */
export function markOfferDone(doneKey) {
  if (!doneKey) return
  const fresh = read()
  if (fresh.has(doneKey)) return
  const keys = [...fresh, doneKey]
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: dayOf(), keys }))
  } catch {
    // Depo kapalı: bu oturumda geçerli.
  }
  state = new Set(keys)
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

// Gün dönünce eski kayıt düşer: okurken güne bakılır.
const snapshot = () => {
  const fresh = read()
  if (fresh.size !== state.size || [...fresh].some((k) => !state.has(k))) state = fresh
  return state
}

/** Bugün yapılan önerilerin adları (değişince yeniden çizer). */
export const useOfferDone = () => useSyncExternalStore(subscribe, snapshot, () => EMPTY)

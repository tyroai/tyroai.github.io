import { useSyncExternalStore } from "react"
import { DEFAULT_SLOTS, NOTCH_SLOTS_KEY, parseSlots } from "@/lib/notchSlots"
import { headerEligible, widgetAlias } from "../headerWidgets/headerStore"

/**
 * Çentiğin yuva kaydı (`lib/notchSlots`): bu tarayıcıda, bütün sayfalarda ortak. Widget yuvası
 * header'a girebilen her widget olabilir (`headerEligible`); kişiye kapalı olanı çizen gizler,
 * kayıtta kalır (header tepsisinin kuralı).
 */
const read = () => {
  try {
    // Eski kimlik yenisine döner (ör. Ticket Talepler → halkalı sürümü), yuva boşa düşmez.
    return parseSlots(localStorage.getItem(NOTCH_SLOTS_KEY), headerEligible, widgetAlias)
  } catch {
    return [...DEFAULT_SLOTS]
  }
}

let state = typeof window === "undefined" ? [...DEFAULT_SLOTS] : read()
const subs = new Set()

export function setNotchSlots(items) {
  state = items
  try {
    localStorage.setItem(NOTCH_SLOTS_KEY, JSON.stringify(items))
  } catch {
    // Depo kapalı: seçim bu oturumda kalır.
  }
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  // Başka sekmede değişince bu sekme de güncellenir.
  const onStorage = (e) => {
    if (e.key !== NOTCH_SLOTS_KEY) return
    state = read()
    fn()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    subs.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}

export const useNotchSlots = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT_SLOTS,
  )

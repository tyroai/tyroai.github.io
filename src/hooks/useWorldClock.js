import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { useLocation } from "react-router-dom"
import { HOME_CITY } from "@/data/worldCities"
import { isRmPath } from "@/lib/rm/paths"
import { rmClockDefaults, subscribeRmClock } from "@/lib/rm/rmClock"
import { cityById, DEFAULT_STATE, MAX_SHOWN, STORAGE_KEY, parseStored } from "@/lib/worldClock"

// tyroRM'in kendi listesi: varsayılan proje ülkelerinden gelir, kişi üstüne ekler ya da çıkarır.
const RM_KEY = "tyro-rm-world-clock-v1"
const RM_EMPTY = { home: HOME_CITY, added: [], removed: [] }
const NO_SHOWN = []

function readState() {
  try {
    return parseStored(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function readRm() {
  try {
    const s = JSON.parse(localStorage.getItem(RM_KEY))
    if (s?.v !== 1) return RM_EMPTY
    const list = (v) => (Array.isArray(v) ? v.filter((id) => cityById(id)) : [])
    return {
      home: cityById(s.home) ? s.home : HOME_CITY,
      added: list(s.added),
      removed: list(s.removed),
    }
  } catch {
    return RM_EMPTY
  }
}

// Aynı sayfadaki kopyalar (pencere, Anasayfa'nın dünya saati widget'ı) aynı listeyi görsün:
// kaydeden ötekilere haber verir, onlar depodan yeniden okur.
const listeners = new Set()

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: 1, ...value }))
  } catch {
    // Depo kapalı / kota dolu: tercih bu oturumda kalır.
  }
  for (const fn of listeners) fn(key)
}

// İçerik aynıysa eski nesne kalır: yeniden çizim ve yeniden kayıt olmaz, kopyalar birbirini döndürmez.
const same = (prev, next) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next)

/**
 * Dünya saatinin şehirleri ve ana şehri. Kişinin tercihi, bu tarayıcıda
 * (`tyro-world-clock-v1`, kayıt defteri `data/appMeta.js`); depo kapalıysa
 * varsayılan ofis şehirleriyle çalışır, hata vermez. tyroRM'deyken liste ayrı
 * (`tyro-rm-world-clock-v1`): varsayılanı açık projelerin ülkeleri, kişinin
 * ekledikleri üstüne gelir, çıkardıkları düşer.
 */
export function useWorldClock() {
  const { pathname } = useLocation()
  const inRm = isRmPath(pathname)
  const defaults = useSyncExternalStore(subscribeRmClock, rmClockDefaults)
  const [state, setState] = useState(readState)
  const [rm, setRm] = useState(readRm)

  useEffect(() => save(STORAGE_KEY, state), [state])
  useEffect(() => save(RM_KEY, rm), [rm])
  useEffect(() => {
    const onSaved = (key) => {
      if (key === STORAGE_KEY) setState((s) => same(s, readState()))
      if (key === RM_KEY) setRm((s) => same(s, readRm()))
    }
    listeners.add(onSaved)
    return () => listeners.delete(onSaved)
  }, [])

  const add = useCallback(
    (id) =>
      inRm
        ? setRm((s) => ({
            ...s,
            added: s.added.includes(id) ? s.added : [...s.added, id],
            removed: s.removed.filter((x) => x !== id),
          }))
        : setState((s) => (s.cities.includes(id) ? s : { ...s, cities: [...s.cities, id] })),
    [inRm],
  )
  // Ana şehir kaldırılamaz (şeritlerin ölçüsü o): önce başka bir şehir ana olur.
  const remove = useCallback(
    (id) =>
      inRm
        ? setRm((s) =>
            id === s.home
              ? s
              : {
                  ...s,
                  added: s.added.filter((x) => x !== id),
                  removed: s.removed.includes(id) ? s.removed : [...s.removed, id],
                },
          )
        : setState((s) =>
            id === s.home
              ? s
              : {
                  ...s,
                  cities: s.cities.filter((c) => c !== id),
                  shown: (s.shown ?? []).filter((c) => c !== id),
                },
          ),
    [inRm],
  )
  const setHome = useCallback(
    (id) =>
      inRm
        ? setRm((s) => ({ ...s, home: id }))
        : // Ana şehir widget'ta zaten başta: iğnesi düşer.
          setState((s) =>
            s.cities.includes(id)
              ? { ...s, home: id, shown: (s.shown ?? []).filter((c) => c !== id) }
              : s,
          ),
    [inRm],
  )
  /** Widget'ta göster / gösterme; dolarsa (en çok `MAX_SHOWN`) değişmez ve `false` döner. */
  const shown = state.shown ?? NO_SHOWN
  const full = shown.length >= MAX_SHOWN
  const toggleShown = useCallback(
    (id) => {
      if (!shown.includes(id) && full) return false
      setState((s) => {
        const list = s.shown ?? []
        return {
          ...s,
          shown: list.includes(id) ? list.filter((c) => c !== id) : [...list, id],
        }
      })
      return true
    },
    [shown, full],
  )
  const reset = useCallback(() => (inRm ? setRm(RM_EMPTY) : setState(DEFAULT_STATE)), [inRm])

  if (!inRm) return { ...state, shown, add, remove, setHome, reset, toggleShown }
  const cities = [...new Set([rm.home, ...defaults, ...rm.added])].filter(
    (id) => (id === rm.home || !rm.removed.includes(id)) && cityById(id),
  )
  // tyroRM'in listesi widget'a gitmez: iğne yok.
  return { home: rm.home, cities, shown: [], add, remove, setHome, reset, toggleShown: null }
}

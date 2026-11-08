import { useCallback, useEffect, useState } from "react"
import { DEFAULT_REGIONS, MAX_REGIONS, regionById } from "@/data/growingRegions"

const KEY = "tyro-region-weather-v1"

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s?.v === 1 && Array.isArray(s.ids))
      return s.ids.filter((id, i, a) => regionById(id) && a.indexOf(id) === i).slice(0, MAX_REGIONS)
  } catch {
    // Bozuk kayıt: varsayılan bölgeler.
  }
  return DEFAULT_REGIONS
}

// Aynı sayfadaki kopyalar (Anasayfa kartı, header tepsisi) aynı seçimi görsün.
const listeners = new Set()

/** Kartın bölgeleri (en çok üç; hiç seçilmemişse varsayılan üçü) — bu tarayıcıda, tercih. */
export function useRegions() {
  const [ids, setIds] = useState(read)
  useEffect(() => {
    listeners.add(setIds)
    return () => listeners.delete(setIds)
  }, [])
  const toggle = useCallback((id) => {
    const cur = read()
    const next = cur.includes(id)
      ? cur.filter((x) => x !== id)
      : cur.length < MAX_REGIONS
        ? [...cur, id]
        : cur
    // Son bölge çıkmaz: boş kart yerine en az bir bölge kalır.
    if (next === cur || !next.length) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, ids: next }))
    } catch {
      // Depo kapalı: seçim bu oturumda kalır.
    }
    for (const fn of listeners) fn(next)
  }, [])
  return { ids, toggle }
}

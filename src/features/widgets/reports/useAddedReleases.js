import { useCallback, useState } from "react"

const KEY = "tyro-report-day-v1"
// Son eklenenler yeter: yayın geçince kayıt işe yaramaz.
const KEEP = 40

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return v?.v === 1 && Array.isArray(v.added) ? v.added : []
  } catch {
    return []
  }
}

/**
 * Takvime eklenen yayınlar (`<rapor>:<tarih>`) — aynı yayın iki kez eklenmesin. Bu tarayıcıda
 * (`tyro-report-day-v1`, kayıt defteri `data/appMeta.js`); yalnız rapor kimliği ve tarih.
 */
export function useAddedReleases() {
  const [added, setAdded] = useState(read)
  const mark = useCallback((key) => {
    setAdded((list) => {
      const next = [...list.filter((x) => x !== key), key].slice(-KEEP)
      try {
        localStorage.setItem(KEY, JSON.stringify({ v: 1, added: next }))
      } catch {
        // Depo kapalı: bu oturumda hatırlanır.
      }
      return next
    })
  }, [])
  return { has: (key) => added.includes(key), mark }
}

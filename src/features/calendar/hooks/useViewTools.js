import { useCallback, useState } from "react"

const KEY = "tyro-calendar-tools-v1"

function read() {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(KEY) ?? "null")
    return { comfort: saved?.comfort === true, hidePending: saved?.hidePending === true }
  } catch {
    return { comfort: false, hidePending: false }
  }
}

function write(next) {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depolama kapalı: tercih yalnız bu oturumda.
  }
}

/**
 * Yoğun takvim araçları: rahat saat ölçeği, yanıtlanmamış davetleri gizleme (ikisi hatırlanır) ve
 * liste görünümü (hatırlanmaz: sayfa her girişte ızgarayla açılır, bkz. `lib/prefs`).
 */
export function useViewTools() {
  const [saved, setSaved] = useState(read)
  const [list, setList] = useState(false)
  const flip = useCallback((field) => {
    setSaved((cur) => {
      const next = { ...cur, [field]: !cur[field] }
      write(next)
      return next
    })
  }, [])
  return {
    list,
    comfort: saved.comfort,
    hidePending: saved.hidePending,
    toggleList: useCallback(() => setList((v) => !v), []),
    toggleComfort: useCallback(() => flip("comfort"), [flip]),
    toggleHidePending: useCallback(() => flip("hidePending"), [flip]),
  }
}

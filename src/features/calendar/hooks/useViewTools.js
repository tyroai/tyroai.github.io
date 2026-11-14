import { useCallback, useState } from "react"

// v2: rahat saat ölçeği varsayılan oldu (ürün sahibi: "takvimde direk bu seçili olsun") — eski kayıt
// okunmaz, herkes rahat ölçekle başlar; değiştiren kişinin seçimi yeni anahtarda hatırlanır.
const KEY = "tyro-calendar-tools-v2"

function read() {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(KEY) ?? "null")
    return { comfort: saved?.comfort !== false }
  } catch {
    return { comfort: true }
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
 * Yoğun takvim araçları: rahat saat ölçeği (varsayılan açık, hatırlanır) ve liste görünümü
 * (hatırlanmaz: sayfa her girişte ızgarayla açılır, bkz. `lib/prefs`).
 */
export function useViewTools() {
  const [saved, setSaved] = useState(read)
  const [list, setList] = useState(false)
  const toggleComfort = useCallback(() => {
    setSaved((cur) => {
      const next = { ...cur, comfort: !cur.comfort }
      write(next)
      return next
    })
  }, [])
  return {
    list,
    comfort: saved.comfort,
    toggleList: useCallback(() => setList((v) => !v), []),
    toggleComfort,
  }
}

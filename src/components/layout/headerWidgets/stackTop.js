import { useSyncExternalStore } from "react"

/**
 * Toplu tepsinin "üstteki" widget'ı (iOS'un akıllı yığını gibi): yığında en son bakılan. Düğme
 * onun ikonunu ve canlı bilgisini gösterir, tepsi yeniden açılınca o gelir. Bu oturumda.
 */
let top = null
const subs = new Set()

export function setStackTop(id) {
  if (id === top) return
  top = id
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useStackTop = () =>
  useSyncExternalStore(
    subscribe,
    () => top,
    () => null,
  )

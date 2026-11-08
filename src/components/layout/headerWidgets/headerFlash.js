import { useSyncExternalStore } from "react"

/**
 * Header'a yeni gelen widget'ın ikonu bir an parlar (panodan eklenince göz nereye gittiğini
 * bulsun). Tepsi topluysa toplu düğme parlar.
 */
let flash = null
const subs = new Set()
const emit = () => {
  for (const fn of subs) fn()
}

export function flashHeaderWidget(id) {
  const mark = { id }
  flash = mark
  emit()
  setTimeout(() => {
    if (flash !== mark) return
    flash = null
    emit()
  }, 1600)
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useHeaderFlash = () =>
  useSyncExternalStore(
    subscribe,
    () => flash,
    () => null,
  )

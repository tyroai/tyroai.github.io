import { useSyncExternalStore } from "react"

/**
 * Pano'nun ve Anasayfa'nın düzenleme kipi — düzenleme düğmesi (Pano'da header'daki "Panoyu
 * düzenle", Anasayfa'da sağ alttaki cam düğme) ile sayfanın kendisi (kartlar, üst çubuk) AYNI
 * durumu okur. Sayfa sökülünce kip kapanır.
 */
let editing = false
const subs = new Set()

export function setBoardEditing(next) {
  const value = typeof next === "function" ? next(editing) : Boolean(next)
  if (value === editing) return
  editing = value
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useBoardEditing = () =>
  useSyncExternalStore(
    subscribe,
    () => editing,
    () => false,
  )

/** Düzenlemeden çıkınca odağın döneceği yer: düzenleme düğmesi (header ya da Anasayfa'nın FAB'ı). */
export const focusBoardEditEntry = () => document.querySelector("[data-board-edit-toggle]")?.focus()

/**
 * Panodan header'a: kart header'daki tepsiye sürüklenince tepsi isteği buraya bırakır, açık
 * panonun düzenleyicisi (`WidgetEditor`) kartı taşır (geri alınabilir). Pano yoksa `false`.
 */
let toHeader = null
export function onToHeader(fn) {
  toHeader = fn
  return () => {
    if (toHeader === fn) toHeader = null
  }
}
export const requestToHeader = (slotId) => Boolean(toHeader?.(slotId))
/** Sürüklenen panonun kartı: `dataTransfer` türü (değer yuvanın kimliği). */
export const WIDGET_DRAG_TYPE = "application/x-tyro-widget"

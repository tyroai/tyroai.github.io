import { onSessionClear } from "@/lib/sessionCache"

/*
 * OneNote kapsamının odağı — dosya listesinde basılan defter ya da bölüm (`oneNoteTarget`) ve
 * "en yeni sayfayı aç" isteği. Yalnız bellekte: adreste yalnız kapsam (`fsrc=onenote`), defter
 * adı adrese yazılmaz. Çıkışta silinir (defter adı kişisel).
 * `{ notebook, section, open, webUrl }` ya da `null`; `open` bir kez tüketilir, `webUrl` dosyanın
 * adresi (defter listede yoksa "OneNote'ta aç").
 */
let focus = null
const listeners = new Set()
const emit = () => listeners.forEach((cb) => cb())

export const getOneNoteFocus = () => focus

export function setOneNoteFocus(next) {
  focus = next
  emit()
}

export function subscribeOneNoteFocus(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

onSessionClear(() => setOneNoteFocus(null), "oneNoteFocus")

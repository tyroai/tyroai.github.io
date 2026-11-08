/**
 * SOHBETTEN FORMA DÖNÜŞ — sohbetteki talep kartının "Formda düzenle"si. Kart gönderilen formu
 * taşır (`card.form`, `encodeForm` biçimi; sohbet geçmişine düz JSON yazılır); fişler kartta
 * değil, oturum boyunca bellekte (`stashSent`, kartın `formId`siyle). Kart düzenleme ister
 * (`requestEdit`), Self Servis sayfası alır (`takeEdit` ya da `onEdit`) ve formu dolu açar.
 * Sayfa yenilenince fişler gider; form kaç fiş olduğunu söyler. Çıkışta hepsi silinir
 * (`clearRequestEdits`, `lib/sessionCache`).
 */
import { decodeForm } from "./requestDrafts"
import { onSessionClear } from "@/lib/sessionCache"

const sent = new Map()
let pending = null
const listeners = new Set()

/** Gönderilen formun fişlerini bellekte tutar (en çok son 10 gönderim). */
export function stashSent(formId, receipts = []) {
  if (!formId) return
  sent.set(
    formId,
    receipts.map(({ file, rotate = 0 }) => ({ file, rotate })),
  )
  while (sent.size > 10) sent.delete(sent.keys().next().value)
}

/** Kartın formunu düzenlemeye açtırır (Self Servis sayfası dinler). */
export function requestEdit({ kind, form, formId, receipts = 0 }) {
  if (!form) return
  const files = sent.get(formId) ?? []
  pending = {
    kind,
    initial: { ...decodeForm(form), receipts: files },
    missing: Math.max(0, receipts - files.length),
  }
  listeners.forEach((fn) => fn())
}

/** Bekleyen düzenleme isteği (bir kez alınır) ya da null. */
export function takeEdit() {
  const out = pending
  pending = null
  return out
}

export function onEdit(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function clearRequestEdits() {
  sent.clear()
  pending = null
}
onSessionClear(clearRequestEdits)

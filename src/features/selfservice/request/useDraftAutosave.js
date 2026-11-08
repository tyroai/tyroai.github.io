import { useCallback, useEffect, useRef } from "react"
import { clearDraft, encodeForm, saveDraft } from "@/lib/requestDrafts"

const DELAY = 500

/**
 * Formu yazdıkça taslak olarak saklar (`lib/requestDrafts`): kısa bir beklemeyle, sayfa kapanırken
 * ya da yenilenirken hemen. Dolu değilse taslak silinir; gönderildiyse (`sent`) dokunulmaz —
 * gönderim taslağı kendisi siler. Dönüş `flush()`: "Taslak olarak sakla"da beklemeden yazar.
 */
export function useDraftAutosave({ kind, form, active, sent }) {
  const latest = useRef(null)
  useEffect(() => {
    latest.current = { form, receipts: kind === "expense" ? form.expense.receipts : [] }
  })

  const flush = useCallback(() => {
    const now = latest.current
    if (!now || sent.current) return
    if (now.form.dirty) saveDraft(kind, now.form.snapshot(), now.receipts)
    else clearDraft(kind)
  }, [kind, sent])

  // Değişikliği bekleyerek yazar: yalnız durum değişince (anahtar), her çizimde değil.
  const receipts = kind === "expense" ? form.expense.receipts : []
  const key = `${JSON.stringify(encodeForm(form.snapshot()))}|${receipts.map((r) => `${r.id}:${r.rotate}`).join(",")}`
  useEffect(() => {
    if (!active) return undefined
    const id = setTimeout(flush, DELAY)
    return () => clearTimeout(id)
  }, [key, active, flush])

  // Sayfa kapanırken ya da yenilenirken bekleyen yazım kaçmasın.
  useEffect(() => {
    if (!active) return undefined
    window.addEventListener("pagehide", flush)
    return () => window.removeEventListener("pagehide", flush)
  }, [active, flush])

  return flush
}

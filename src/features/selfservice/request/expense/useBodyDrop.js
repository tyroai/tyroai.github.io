import { useEffect, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { acceptReceipts, hasFiles } from "./acceptReceipts"

// Kendi bırakma yeri olan alan (başlığın fiş şeridi): gövdenin katmanı orada görünmez, olayı
// alan işler.
const OWN = "[data-drop-zone]"
const isTyping = (el) =>
  el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || Boolean(el?.isContentEditable)

/**
 * Masraf formuna bırakılan ya da yapıştırılan (Ctrl/⌘+V) fişler: formun her yerinden masrafın
 * BAŞLIĞINA gider (`onFiles`, görsel ya da PDF) — ERP'de fişler kaleme değil başlığa eklenir.
 * Kendi bırakma yeri olan alan önce gelir (olayı işler). Yapıştırma yalnız panoda dosya varsa:
 * alanlara metin yapıştırmak olduğu gibi çalışır. Pencere açıkken sayfanın başka bir yerine kaçan
 * dosya tarayıcıyı dosyaya götürmez: yarım form kaybolmasın. `over`: sürükleme gövdede (alanda
 * değil). `on`: gövde fiş kabul ediyor (gözden geçirmede kapalı; koruma yine açık).
 *
 * `onText(metin)`: yazı alanı dışında yapıştırılan metin (Excel satırları); true dönerse işlendi.
 * Dosyadan önce bakılır: Excel panoya hücrelerin resmini de koyar, satırlar fiş sanılmasın.
 * Izgaranın kendi yapıştırması önce gelir (olayı durdurur, burası dokunmaz).
 */
export function useBodyDrop(onFiles, on = true, onText = null) {
  const { t } = useLocale()
  const [over, setOver] = useState(false)
  // Olay dinleyicisi bir kez bağlanır; işlevler her çizimde yeni (akışın son hâli).
  const latest = useRef(onFiles)
  const text = useRef(onText)
  useEffect(() => {
    latest.current = onFiles
    text.current = onText
  })

  useEffect(() => {
    if (!on) return undefined
    const onPaste = (e) => {
      if (e.defaultPrevented) return
      const plain = text.current && !isTyping(e.target) && e.clipboardData?.getData("text/plain")
      if (plain && text.current(plain)) {
        e.preventDefault()
        return
      }
      if (!hasFiles(e.clipboardData)) return
      // Yazı alanında metin de varsa yapıştırma alanındır: Excel tek hücrenin resmini de koyar,
      // tutara "450" yapıştırırken fiş eklenmesin. Yalnız resim (ekran görüntüsü) fişe gider.
      if (isTyping(e.target) && e.clipboardData.getData("text/plain").trim()) return
      e.preventDefault()
      const ok = acceptReceipts(e.clipboardData.files, t)
      if (ok.length) latest.current(ok)
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [on, t])

  useEffect(() => {
    const stop = (e) => hasFiles(e.dataTransfer) && e.preventDefault()
    document.addEventListener("dragover", stop)
    document.addEventListener("drop", stop)
    return () => {
      document.removeEventListener("dragover", stop)
      document.removeEventListener("drop", stop)
    }
  }, [])

  const handlers = {
    // Yakalama evresi: alan olayı işlese de katmanın görünüp görünmeyeceği bilinir.
    onDragOverCapture: (e) => setOver(hasFiles(e.dataTransfer) && !e.target.closest?.(OWN)),
    onDragOver: (e) => {
      if (e.defaultPrevented || !hasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    },
    onDragLeave: (e) => !e.currentTarget.contains(e.relatedTarget) && setOver(false),
    onDropCapture: () => setOver(false),
    onDrop: (e) => {
      if (e.defaultPrevented || !hasFiles(e.dataTransfer)) return
      e.preventDefault()
      const ok = acceptReceipts(e.dataTransfer.files, t)
      if (ok.length) onFiles(ok)
    },
  }
  return { over: on && over, handlers: on ? handlers : {} }
}

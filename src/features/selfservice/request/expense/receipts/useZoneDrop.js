import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { acceptReceipts, hasFiles } from "../acceptReceipts"

/**
 * Kendi bırakma yeri olan alan (başlığın fiş şeridi): üstüne dosya sürüklenince `over`,
 * bırakılan görsel ya da PDF `onFiles`a. Kap `data-drop-zone` taşır: gövdenin katmanı orada
 * görünmez (`useBodyDrop`), olay burada işlenir, gövde ikinci kez eklemez.
 */
export function useZoneDrop(onFiles) {
  const { t } = useLocale()
  const [over, setOver] = useState(false)
  const handlers = {
    onDragOver: (e) => {
      if (!hasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
      if (!over) setOver(true)
    },
    onDragLeave: (e) => !e.currentTarget.contains(e.relatedTarget) && setOver(false),
    onDrop: (e) => {
      if (!hasFiles(e.dataTransfer)) return
      e.preventDefault()
      setOver(false)
      const ok = acceptReceipts(e.dataTransfer.files, t)
      if (ok.length) onFiles(ok)
    },
  }
  return { over, handlers }
}

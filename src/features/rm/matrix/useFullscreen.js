import { useCallback, useEffect, useState } from "react"

/**
 * Matris tam ekranı: sayfanın üstüne tam pencere katman ve (varsa) tarayıcı tam ekranı. Tarayıcı
 * tam ekranı kökte açılır: diyaloglar ve ipuçları (gövdeye taşınan katmanlar) görünür kalır.
 * Tarayıcıdan çıkınca (Esc) katman da kapanır; tam ekran desteklenmiyorsa Esc katmanı kapatır.
 */
export function useFullscreen() {
  const [full, setFull] = useState(false)

  const exit = useCallback(() => {
    setFull(false)
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [])

  const enter = useCallback(() => {
    setFull(true)
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    if (!full) return
    const onChange = () => {
      if (!document.fullscreenElement) setFull(false)
    }
    // Yazı alanındaki (hücre düzenleyici), menüdeki ve penceredeki Esc kendi işini görür; katmanı kapatmaz.
    const onKey = (e) => {
      if (e.key !== "Escape" || document.fullscreenElement) return
      if (
        e.target.closest?.(
          "input, textarea, [role=dialog], [role=alertdialog], [role=listbox], [role=menu]",
        )
      )
        return
      setFull(false)
    }
    document.addEventListener("fullscreenchange", onChange)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("fullscreenchange", onChange)
      window.removeEventListener("keydown", onKey)
    }
  }, [full])

  return { full, enter, exit }
}

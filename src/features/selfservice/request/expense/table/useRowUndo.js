import { useCallback, useEffect, useState } from "react"

/**
 * Silinen son kalemin geri alınması: 8 saniye boyunca ızgaranın alt şeridinde "Kalem 3 silindi ·
 * Geri al". Pencerenin içinde durur, çünkü bildirim (toast) kipli pencerenin arkasında kalıyor:
 * tıklanamıyor, klavyeyle ulaşılamıyor, birincil düğmeyi örtüyor. Kişi şeridin üstündeyken ya da
 * odak oradayken süre işlemez. Yeni silme öncekini kalıcı yapar.
 */
export function useRowUndo(ms = 8000) {
  const [last, setLast] = useState(null)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (!last || hold) return
    const id = setTimeout(() => setLast(null), ms)
    return () => clearTimeout(id)
  }, [last, hold, ms])
  const push = useCallback((entry) => setLast(entry), [])
  const clear = useCallback(() => {
    setLast(null)
    setHold(false)
  }, [])
  return { last, push, clear, setHold }
}

import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * Adresteki tek seferlik komut (`?edit=1`, `?new=meeting`): sayfa açıldığında bir kez çalışır ve
 * parametre adresten silinir (geri tuşu komutu yinelemesin). Başka yerden (Denetim Merkezi'nin
 * kısayolları, arama) sayfaya "şunu aç" demenin yolu: çağıran sayfanın koduna bağlanmaz.
 * `ready`: sayfa komutu karşılamaya hazır değilse (veri yükleniyor) bekler.
 */
export function useUrlCommand(param, expected, run, ready = true) {
  const [params, setParams] = useSearchParams()
  const value = params.get(param)
  // Parametre silinene kadar araya giren çizimler komutu ikinci kez çalıştırmasın.
  const done = useRef(false)
  useEffect(() => {
    if (value !== expected) {
      done.current = false
      return
    }
    if (!ready || done.current) return
    done.current = true
    run()
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(param)
        return next
      },
      { replace: true },
    )
  }, [value, expected, ready, run, param, setParams])
}

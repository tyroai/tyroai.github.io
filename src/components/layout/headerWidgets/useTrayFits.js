import { useLayoutEffect, useRef, useState } from "react"

// Tepsi açıkken header'da en az bu kadar boşluk kalsın (sayfa adı sıkışmasın); topluyken
// ancak açılınca da bu kadar boşluk kalacaksa açılır — iki eşik arası titremeyi önler.
const KEEP = 8
const ROOM = 24

/**
 * Tepsi header'a sığıyor mu (öncelik+ kalıbı): header'daki boşluğu tutan ara parçanın
 * (`free`, sayfa adıyla arama arasında) genişliği izlenir. Boşluk biterse ikonlar tek
 * düğmede toplanır; açılınca da yer kalacaksa yeniden açılır. Açık hâlin genişliği açıkken
 * ölçülür, topluyken tahminle (`estimate`) birlikte kullanılır. Posta, radyo hapı gelip
 * gidince ya da sohbet paneli açılınca ara parçanın boyu değişir; gözlemci onu yakalar.
 */
export function useTrayFits(free, tray, estimate) {
  const [fits, setFits] = useState(true)
  const fitsRef = useRef(true)
  const openWidth = useRef(0)
  useLayoutEffect(() => {
    if (!free) return undefined
    openWidth.current = 0
    const check = () => {
      const room = free.getBoundingClientRect().width
      const now = tray.current?.getBoundingClientRect().width ?? 0
      let next
      if (fitsRef.current) {
        openWidth.current = now
        next = room >= KEEP
      } else {
        next = room - (Math.max(openWidth.current, estimate) - now) >= ROOM
      }
      fitsRef.current = next
      setFits(next)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(free)
    return () => ro.disconnect()
  }, [free, tray, estimate])
  return fits
}

import { useEffect, useState } from "react"

/**
 * Yükleme `ms`'yi aşınca true: iskelet tek başına "takıldı mı?" dedirtir, bir satır ipucu
 * ("Biraz uzun sürüyor…") sakinleştirir. Yalnız yükleme sürerken bağlanan bileşende kullanılır:
 * sayaç bağlanınca başlar, sökülünce temizlenir; yükleme bitince bileşen gider, sıfırlanır.
 */
export function useSlow(ms = 4000): boolean {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), ms)
    return () => clearTimeout(id)
  }, [ms])
  return slow
}

import { useEffect, useState } from "react"

/**
 * Hazır soru kutucuklarının satır boyu, soru kutusu uzayınca KÜÇÜLMESİN: kutu kısayken
 * (`compact`) satır ızgaranın verdiği boyda ölçülür; kutu uzayınca (şablon, uzun metin) bu boy
 * satırın alt sınırı olur ve sığmayanlar için ızgara kayar. Döndürdüğü stil `--tile-row`
 * değişkenini taşır (`auto-rows-[minmax(var(--tile-row,2.75rem),1fr)]`). Ölçüm yalnız kısa
 * hâlde: sınır uygulanırken ölçülseydi kendi sınırını ölçerdi.
 */
export function useStableTileRows(groupRef, compact) {
  const [row, setRow] = useState(0)
  useEffect(() => {
    const g = groupRef.current
    if (!compact || !g || typeof ResizeObserver === "undefined") return undefined
    // İlk ölçüm de gözlemcinin ilk bildiriminde (yerleşimden sonra): elle okumak sayfayı
    // açılışta bir kez daha yerleştirmeye zorluyordu; değer yalnız kutu uzayınca kullanılıyor.
    const ro = new ResizeObserver(() => setRow(g.firstElementChild?.offsetHeight ?? 0))
    ro.observe(g)
    return () => ro.disconnect()
  }, [groupRef, compact])
  return !compact && row ? { "--tile-row": `${row}px` } : undefined
}

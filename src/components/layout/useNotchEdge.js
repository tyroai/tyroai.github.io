import { useEffect } from "react"

/**
 * Kenarda bir panel (sohbet ya da sayfa paneli) açıkken çentik gizlenmez: ana sütunun sağ
 * kenarına, yani panelin soluna taşınır — header her durumda aynı kalır, posta, takvim ve dünya
 * saati çentikte durur. Ölçü React durumuna değil, satırın CSS değişkenlerine yazılır: panel
 * açılırken, kapanırken ve sürüklenirken her karede değişiyor, çentiği her karede yeniden
 * çizdirmesin. Gözlem hep açık: kapanış animasyonu bitmeden silinseydi ray panelin üstüne zıplardı.
 *   `--notch-edge`: görüntü alanının sağından ana sütunun sağına (genişteki sabit ray)
 *   `--notch-dock`: satırda panellerin kapladığı genişlik (dardaki şerit, ana sütunda ortalı)
 * Panel yokken ikisi 0: ray ekranın kenarında, şerit satırın ortasında. Kartın kenar payı (8px)
 * panel daralırken payla birlikte erir — sona doğru sıçrama olmasın.
 */
export function useNotchEdge(mainRef) {
  useEffect(() => {
    const main = mainRef.current
    const row = main?.parentElement
    if (!main || !row) return undefined
    const place = () => {
      const box = main.getBoundingClientRect()
      const rowRight = row.getBoundingClientRect().right
      // Gizli ana sütun (sohbet sayfası) ya da üstte açılan telefon paneli: kenarda sütun yok.
      const dock = box.width > 0 ? Math.max(0, rowRight - box.right) : 0
      const gap = Math.max(0, document.documentElement.clientWidth - rowRight)
      row.style.setProperty("--notch-edge", `${dock > 0 ? dock + Math.min(gap, dock) : 0}px`)
      row.style.setProperty("--notch-dock", `${dock}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(main)
    window.addEventListener("resize", place)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", place)
      row.style.removeProperty("--notch-edge")
      row.style.removeProperty("--notch-dock")
    }
  }, [mainRef])
}

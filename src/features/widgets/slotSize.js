import { createContext, useContext } from "react"

/**
 * Kartın panodaki boyu: "mini" (dar kart) ya da "big" (geniş kart, sol sütun). Aynı genişlikte
 * iki mod ayrı çizilsin diye — ör. Ufukta'da mini alt alta, büyük yatay. Pano dışında (header
 * penceresi, Büyüt, katalog önizlemesi) `null`: widget yalnız kendi genişliğine bakar.
 */
export const SlotSizeContext = createContext(null)

export const useSlotSize = () => useContext(SlotSizeContext)

/**
 * Yuvanın boyu. Sol sütunda genişlik seçeneği yok, kart sütunun tamamını alır: büyük. Tek sütunda
 * (telefon, dar pencere) dar/geniş bir şey değiştirmez, düğmesi de yok: `null` — widget kendi
 * genişliğine bakar.
 */
export function slotSize(zone, wide, single = false) {
  if (zone === "left") return "big"
  if (single) return null
  return wide ? "big" : "mini"
}

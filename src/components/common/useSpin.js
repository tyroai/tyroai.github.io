import { useState } from "react"
import { normalizeAngle, shortestTurn } from "@/lib/imageRotate"

/**
 * Çizimde kullanılacak birikimli açı: 270'ten 0'a dönen görsel CSS geçişinde üç çeyrek geri
 * dönmesin, bir çeyrek ileri gitsin (360). `key` değişince (başka görsel) birikim sıfırlanır.
 * Durum çizim sırasında güncellenir (React'in "prop değişince durumu ayarla" biçimi).
 */
export function useSpin(angle, key) {
  const deg = normalizeAngle(angle)
  const [spin, setSpin] = useState({ key, deg, turn: deg })
  if (spin.key !== key) {
    setSpin({ key, deg, turn: deg })
    return deg
  }
  if (spin.deg !== deg) {
    const turn = spin.turn + shortestTurn(spin.deg, deg)
    setSpin({ key, deg, turn })
    return turn
  }
  return spin.turn
}

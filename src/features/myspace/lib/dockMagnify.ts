/**
 * Öneri sırasının Dock büyümesi: imlece yakın önerinin simgesi büyür, komşuları kademeli eşlik eder
 * (cos² düşüşü). Saf hesap; kare döngüsü `hooks/useDockMagnify`.
 */

/** İmleç `distance` px uzaktaysa 1, tam üstündeyse `peak`. `focus` yoksa (imleç dışarıda) 1. */
export function dockTarget(
  center: number,
  focus: number | null,
  peak: number,
  distance: number,
): number {
  if (focus === null) return 1
  const reach = Math.abs(focus - center) / distance
  return reach < 1 ? 1 + (peak - 1) * Math.cos((reach * Math.PI) / 2) ** 2 : 1
}

/** Yay adımı (yarı örtük Euler): hız ve değer birlikte ilerler, büyük adımda da taşmaz. */
export function springStep(
  value: number,
  velocity: number,
  target: number,
  dt: number,
  stiffness = 1500,
  damping = 120,
): [number, number] {
  const v =
    (velocity + dt * stiffness * (target - value)) / (1 + dt * damping + dt * dt * stiffness)
  return [value + v * dt, v]
}

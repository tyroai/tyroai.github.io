import { useReducedMotion, useTransform } from "motion/react"

// Satır başına pencere kayması ve pencere genişliği (açıklık oranında).
const STEP = 0.1
const SPAN = 0.32
const TOP = 0.97
const BLUR = 10
const LIFT = -12

const toFilter = (b) => (b < 0.25 ? "none" : `blur(${b.toFixed(1)}px)`)

/**
 * Bir satırın geçişi, çekmecenin açıklığından türer (`progress`): satır bulanıklaşıp solarak ve
 * hafifçe yükselerek dağılır. Yukarı kalkan çekmecede üst kenara ilk varan üst satır olduğundan önce
 * o dağılır; inerken aynı yoldan ters sırayla, alttan yukarı netleşir (ürün sahibinin örneğindeki
 * geçiş). Parmağı izler, yarıda tutulabilir: ayrı animasyon yok. Azaltılmış harekette yok (çekmece
 * zaten solar).
 */
export function useLineDissolve(progress, index) {
  const reduce = useReducedMotion()
  const crisp = TOP - index * STEP
  const gone = crisp - SPAN
  const opacity = useTransform(progress, [gone, crisp], [0, 1])
  const y = useTransform(progress, [gone, crisp], [LIFT, 0])
  const blur = useTransform(progress, [gone + SPAN * 0.15, crisp], [BLUR, 0])
  const filter = useTransform(blur, toFilter)
  return reduce ? undefined : { opacity, y, filter }
}

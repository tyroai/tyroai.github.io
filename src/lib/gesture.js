/**
 * Sürükleme hareketinin saf matematiği (alt çekmece, hafta şeridi): parmak hızı, ivmeyle
 * varılacak yer, kenarda lastik direnci ve bırakınca kapanıp kapanmayacağı kararı. Kancalar
 * (`hooks/useSheetDrag`, `features/calendar/hooks/useStripSwipe`) yalnız DOM ve yay işini yapar.
 */

/** Hız için bakılan son pencere (ms): daha eskisi bırakma hızını yanıltır. */
export const VELOCITY_WINDOW = 100

/** Son örneklerden hız (px/sn). Örnek: `{ pos, t }`; pencere dışındakiler atılır. */
export function releaseVelocity(samples, now) {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW)
  if (recent.length < 2) return 0
  const a = recent[0]
  const b = recent[recent.length - 1]
  const dt = b.t - a.t
  return dt > 0 ? ((b.pos - a.pos) / dt) * 1000 : 0
}

/** Apple'ın yavaşlama izdüşümü: parmak bırakılınca hız tükenene dek varılacak uzaklık (px). */
export function project(velocity, rate = 0.99) {
  return ((velocity / 1000) * rate) / (1 - rate)
}

/** Lastik: sınırı aşan `over` uzaklığı `max`a doğru yavaşlayarak büyür, hiçbir zaman aşmaz. */
export function rubber(over, max, stiffness = 0.55) {
  if (over <= 0) return 0
  return (1 - 1 / ((over * stiffness) / max + 1)) * max
}

/**
 * Çekmece bırakılınca kapansın mı? `pos` aşağı çekilen uzaklık, `v` aşağı hız (px/sn), `size`
 * çekmece boyu. Hızlı fırlatma az çekilse de kapatır; yavaş ve kısa çekiş geri oturur.
 */
export function shouldDismiss({ pos, v, size }) {
  if (pos <= 0) return false
  if (v > 500) return true
  if (v < -500) return false
  return pos + project(v) > size * 0.45
}

/** Şerit bırakılınca hafta değişsin mi? Dönüş: -1, 0 ya da 1 (kaydırma yönü). */
export function stripCommit({ pos, v, size }) {
  const reach = pos + project(v, 0.985)
  if (Math.abs(v) > 450 && Math.sign(v) === Math.sign(pos || v)) return -Math.sign(v)
  if (Math.abs(reach) > size * 0.3) return -Math.sign(reach)
  return 0
}

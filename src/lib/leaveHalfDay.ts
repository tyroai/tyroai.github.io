/**
 * YARIM GÜN İZİN — ERP (Dynamics 365, izin satırları) tek günlük yarım izni tutarlı yazmıyor; canlı
 * kayıtlarda aynı öğleden sonra izni (13:00–17:15, 8,5 saatlik vardiyanın yarısı) dört biçimde
 * görüldü:
 *
 *   gün 50  · saat 4,25   ("0,50" yüzde gibi yazılmış)
 *   gün 50  · saat 0
 *   gün 0,5 · saat −13    (bitiş saati boş, saat eksiye düşmüş)
 *   gün 0   · saat 4,25
 *
 * İlk üçü tutarlılık denetimine (`selfServiceSanity`) "imkânsız kayıt" diye takılıyor ve listeden
 * düşüyordu. Bu dört biçim yarım gün sayılır: gün 0,5; anlamsız saat atılır. Yalnız TEK günlük
 * kayıtta ve yalnız bu biçimlerde: çok günlük aralıkta 50 gün gerçek bir tutarsızlıktır, denetim
 * onu yakalamaya devam eder. Bakiye ERP'nin özetinden gelir; burası yalnız satırın okunuşu.
 */
export interface LeaveSpan {
  start: Date | null
  end: Date | null
  days: number | null
  hours: number | null
}

/** Yarım vardiya sayılan saat aralığı (7–10 saatlik vardiyaların yarısı). */
const HALF_MIN = 3.5
const HALF_MAX = 5
/** ERP'nin yarım günü yüzde gibi yazdığı değer ("0,50" → 50). */
const HALF_AS_PERCENT = 50

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/** Saat yarım vardiya aralığındaysa kendisi, değilse `null` (eksi, sıfır ya da tam gün saati atılır). */
const halfHours = (hours: number | null): number | null =>
  hours != null && hours >= HALF_MIN && hours <= HALF_MAX ? hours : null

/**
 * Tek günlük kaydı yarım gün biçimlerinden biriyse düzeltilmiş hâliyle (`half: true`), değilse
 * olduğu gibi döndürür.
 */
export function halfDayFix<T extends LeaveSpan>(leave: T): T & { half?: true } {
  const { start, end, days, hours } = leave
  if (!start || (end && !sameDay(start, end))) return leave
  const asPercent = days === HALF_AS_PERCENT && (hours ?? 0) <= HALF_MAX
  const asHalf = days === 0.5
  const asHours = (days ?? 0) === 0 && halfHours(hours) != null
  if (!asPercent && !asHalf && !asHours) return leave
  return { ...leave, days: 0.5, hours: halfHours(hours), half: true }
}

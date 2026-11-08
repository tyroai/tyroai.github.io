import { upcomingBridges } from "@/lib/leaveBridges"
import { dayDiff, startOfDay } from "@/lib/leaveDays"
import { pendingAnnual } from "@/lib/leaveImpact"
import { nextAccrual } from "@/lib/selfServiceAccrual"
import { upcomingLeave } from "@/lib/selfServiceAlerts"

/**
 * "İzin bakiyem" kartının bilgisi (saf, testli) — Self Servis verisinden:
 * - `remain` ERP'nin kalanı (Self Servis'teki sayı); `pending` onay bekleyen yıllık izin günleri —
 *   ERP'nin kalanı bunları düşmüyor. `free` = kalan − onaydaki: kartın ortasındaki sayı, halkanın
 *   boş kısmı (izin formu da onaydakileri kullanılmış sayar).
 * - `share` kullanılan, `pendingShare` onaydaki pay (halkanın iki yayı) — paydası kullanılan +
 *   kalan: devreden izinle kalan yıllık haktan büyük olabilir, halka ortadaki sayıyla çelişmesin.
 * - `next` sıradaki izin `{ record, inDays }`; `bridge` 6 ay içindeki ilk köprü günü.
 * - `claim` ERP'nin hakkı: tüm yılların BİRİKMİŞ toplamı (yıllık pay değil).
 * - `accrual` sonraki hak ediş — TAHMİN (`selfServiceAccrual`, yalnız kıdemden), işe giriş
 *   bilinmiyorsa null.
 * Bakiye okunamadıysa `remain` null: kart "0 gün" demez.
 */
export function leaveSummary({ balance, leaves, hireDate = null, now = new Date() }) {
  const today = startOfDay(now)
  const remain = balance?.remain ?? null
  const claim = balance?.claim ?? null
  const used = balance?.used ?? null
  const pending = leaves ? pendingAnnual(leaves, today).days : 0
  const pool = used != null && remain != null ? used + Math.max(remain, 0) : null
  const share = pool > 0 ? Math.min(1, used / pool) : null
  const record = leaves ? upcomingLeave(leaves, today) : null
  return {
    remain,
    claim,
    used,
    pending,
    free: remain == null ? null : remain - pending,
    share,
    pendingShare: pool > 0 ? Math.min(1 - share, pending / pool) : 0,
    next: record ? { record, inDays: dayDiff(today, record.start) } : null,
    bridge: upcomingBridges(today, { months: 6, max: 1 })[0] ?? null,
    accrual: hireDate ? nextAccrual(hireDate, today) : null,
  }
}
